const crypto = require("crypto");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const User = require("../models/User");
const Order = require("../models/Order");

/**
 * Generate a cryptographically secure, collision-resistant order reference number.
 * Format: EL-YYYYMMDD-XXXXXX (e.g. EL-20261014-9A2BF4)
 */
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `EL-${dateStr}-${randomSuffix}`;
}

/**
 * POST /api/orders
 * Safe Real Order Creation Controller (Step 3C)
 *
 * Sequence:
 * 1. Authenticate user from req.user (ignore any body userId)
 * 2. Validate addressId and verify ownership
 * 3. Retrieve customer cart and reject empty carts
 * 4. Guard against rapid duplicate submissions (e.g. rapid double-clicks)
 * 5. Revalidate every product, category, variant, and quantity against catalog
 * 6. Calculate server-authoritative effective prices and fee snapshots
 * 7. Aggregate variant quantities across cart lines
 * 8. Atomically reserve stock using conditional MongoDB updates (variants.stock >= quantity)
 * 9. Roll back reservations if any variant has insufficient stock
 * 10. Persist the Order document with immutable snapshots (with collision retry)
 * 11. Roll back all stock reservations if order persistence fails
 * 12. Only after successful order persistence, clear the customer's cart
 * 13. Safely increment User.orderCount
 * 14. Return 201 Created with the persisted Order document
 */
exports.createOrder = async (req, res) => {
  // Array tracking all atomic stock reservations made during this request
  const successfulReservations = [];

  try {
    // -----------------------------------------------------------------------
    // 1. Authenticated Customer ID
    // -----------------------------------------------------------------------
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing customer authentication.",
      });
    }

    // -----------------------------------------------------------------------
    // 2. Validate Address & Ownership
    // -----------------------------------------------------------------------
    const { addressId, paymentMethod = "COD" } = req.body;
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "A valid delivery address ID is required to place an order.",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Selected delivery address was not found or does not belong to your account.",
      });
    }

    // Validate payment method against supported enum
    const allowedPaymentMethods = ["COD", "ONLINE", "WALLET"];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method "${paymentMethod}". Allowed methods: ${allowedPaymentMethods.join(", ")}.`,
      });
    }

    // -----------------------------------------------------------------------
    // 3. Retrieve Customer Cart & Reject Empty
    // -----------------------------------------------------------------------
    const cart = await Cart.findOne({ userId });
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your shopping bag is empty. Please add silhouettes before checkout.",
      });
    }

    // -----------------------------------------------------------------------
    // 4. Duplicate Submission Guard (e.g. rapid double-click within 4 seconds)
    // -----------------------------------------------------------------------
    const recentDuplicate = await Order.findOne({
      userId,
      createdAt: { $gte: new Date(Date.now() - 4000) },
    });
    if (recentDuplicate) {
      return res.status(429).json({
        success: false,
        message: "A recent order submission is already being processed. Please check your order history.",
      });
    }

    // -----------------------------------------------------------------------
    // 5. Authoritatively Validate Catalog & Calculate Pricing
    // -----------------------------------------------------------------------
    const validatedItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (
        !item.productId ||
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        !item.variantId ||
        !mongoose.Types.ObjectId.isValid(item.variantId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Cart contains invalid product or variant identifiers.",
        });
      }

      const qty = Number(item.quantity) || 1;
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Cart item quantity must be an integer greater than zero.",
        });
      }

      // Query active, non-deleted product with active category
      const product = await Product.findOne({
        _id: item.productId,
        isDeleted: false,
        status: "active",
      }).populate({
        path: "categoryId",
        select: "_id name status isDeleted",
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Garment "${item.name || "Unknown"}" is no longer active or has been archived from the atelier catalog.`,
        });
      }

      if (
        !product.categoryId ||
        product.categoryId.isDeleted ||
        product.categoryId.status !== "active"
      ) {
        return res.status(400).json({
          success: false,
          message: `Category for garment "${product.name}" is currently unavailable.`,
        });
      }

      // Locate variant
      const variant = (product.variants || []).find(
        (v) => v._id && v._id.toString() === item.variantId.toString()
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Selected variant (Size: ${item.size}, Color: ${item.color}) for "${product.name}" no longer exists.`,
        });
      }

      const currentStock = Number(variant.stock) || 0;
      if (currentStock <= 0) {
        return res.status(409).json({
          success: false,
          message: `Garment "${product.name}" (${variant.size} / ${variant.color}) is currently out of stock.`,
        });
      }

      if (qty > currentStock) {
        return res.status(409).json({
          success: false,
          message: `Requested quantity (${qty}) for "${product.name}" (${variant.size} / ${variant.color}) exceeds available stock (${currentStock}).`,
        });
      }

      // Server-authoritative effective unit price
      const effectivePrice =
        product.salePrice !== undefined &&
        product.salePrice !== null &&
        Number(product.salePrice) < Number(product.price)
          ? Number(product.salePrice)
          : Number(product.price);

      const lineTotal = effectivePrice * qty;
      subtotal += lineTotal;

      // Select variant-specific cover image if available
      let coverImage = null;
      if (Array.isArray(variant.images) && variant.images.length > 0) {
        coverImage = variant.images[0];
      } else if (product.coverImage) {
        coverImage = product.coverImage;
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        coverImage = product.images[0];
      }

      validatedItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        size: variant.size,
        color: variant.color,
        coverImage,
        price: effectivePrice,
        quantity: qty,
        lineTotal,
      });
    }

    // -----------------------------------------------------------------------
    // 6. Aggregate Variant Requirements (handles duplicate cart lines)
    // -----------------------------------------------------------------------
    const variantRequirements = new Map();
    for (const item of validatedItems) {
      const key = `${item.productId.toString()}_${item.variantId.toString()}`;
      if (variantRequirements.has(key)) {
        variantRequirements.get(key).totalQuantity += item.quantity;
      } else {
        variantRequirements.set(key, {
          productId: item.productId,
          variantId: item.variantId,
          totalQuantity: item.quantity,
          name: item.name,
          size: item.size,
          color: item.color,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 7. Atomic Conditional Stock Reservation & Failure Recovery
    // -----------------------------------------------------------------------
    let reservationFailedRequirement = null;

    for (const requirement of variantRequirements.values()) {
      // Conditional atomic decrement: $elemMatch ensures variant ID and sufficient
      // stock are verified on the SAME array element, and the $ positional operator
      // then unambiguously targets that matched element for the $inc.
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: requirement.productId,
          isDeleted: false,
          status: "active",
          variants: {
            $elemMatch: {
              _id: requirement.variantId,
              stock: { $gte: requirement.totalQuantity },
            },
          },
        },
        {
          $inc: { "variants.$.stock": -requirement.totalQuantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Atomic reservation failed (stock was insufficient or concurrent lock)
        reservationFailedRequirement = requirement;
        break;
      }

      // Track successful reservation for potential rollback
      successfulReservations.push({
        productId: requirement.productId,
        variantId: requirement.variantId,
        quantity: requirement.totalQuantity,
      });
    }

    // If any variant could not be reserved, roll back all previous reservations
    if (reservationFailedRequirement) {
      await rollbackReservations(successfulReservations);
      return res.status(409).json({
        success: false,
        message: `Insufficient inventory for "${reservationFailedRequirement.name}" (${reservationFailedRequirement.size} / ${reservationFailedRequirement.color}). Please update your shopping bag.`,
      });
    }

    // -----------------------------------------------------------------------
    // 8. Construct Authoritative Pricing and Snapshots
    // -----------------------------------------------------------------------
    const shippingFee = 0; // Complimentary tracked atelier courier dispatch
    const packagingFee = validatedItems.length > 0 ? 199 : 0; // Signature Parisian keepsake packaging
    const total = subtotal + shippingFee + packagingFee;

    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      house: address.house,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    const pricingSnapshot = {
      subtotal,
      shippingFee,
      packagingFee,
      total,
    };

    // -----------------------------------------------------------------------
    // 9. Persist Order Document (with orderNumber collision retry)
    // -----------------------------------------------------------------------
    let savedOrder = null;
    let persistenceAttempts = 0;

    while (!savedOrder && persistenceAttempts < 3) {
      persistenceAttempts++;
      const orderNumber = generateOrderNumber();

      try {
        const orderDoc = new Order({
          orderNumber,
          userId,
          items: validatedItems,
          shippingAddress: shippingAddressSnapshot,
          pricing: pricingSnapshot,
          paymentMethod,
          paymentStatus: "pending",
          orderStatus: "placed",
        });

        savedOrder = await orderDoc.save();
      } catch (saveError) {
        // If unique orderNumber collision, retry with a fresh orderNumber
        if (saveError.code === 11000 && persistenceAttempts < 3) {
          continue;
        }

        // Fatal persistence failure: restore all reserved stock and abort
        console.error("CRITICAL: Order persistence failed:", saveError.message);
        await rollbackReservations(successfulReservations);

        return res.status(500).json({
          success: false,
          message: "Failed to persist order in the salon database. All reserved inventory has been restored.",
        });
      }
    }

    if (!savedOrder) {
      await rollbackReservations(successfulReservations);
      return res.status(500).json({
        success: false,
        message: "Failed to generate unique order reference after multiple attempts. All reserved inventory has been restored.",
      });
    }

    // -----------------------------------------------------------------------
    // 10. Post-Persistence Cleanup: Clear Cart & Increment User orderCount
    // (Note: Since order is already persisted, failure here must NOT roll back stock)
    // -----------------------------------------------------------------------
    let cartCleared = false;
    try {
      cart.items = [];
      await cart.save();
      cartCleared = true;
    } catch (cartCleanupError) {
      console.error(
        `WARNING: Cart cleanup failed for user ${userId} after order ${savedOrder.orderNumber}:`,
        cartCleanupError.message
      );
      cartCleared = false;
    }

    try {
      await User.findByIdAndUpdate(userId, { $inc: { orderCount: 1 } });
    } catch (userCountError) {
      console.error(
        `WARNING: Failed to increment orderCount for user ${userId}:`,
        userCountError.message
      );
    }

    // -----------------------------------------------------------------------
    // 11. Success Response with Real Persisted Order
    // -----------------------------------------------------------------------
    return res.status(201).json({
      success: true,
      message: cartCleared
        ? "Order placed successfully."
        : "Order placed successfully. Note: shopping bag cleanup is pending; please do not resubmit.",
      cartCleared,
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order creation fatal error:", error);

    // Safeguard: Roll back reserved stock ONLY if the order was NOT already persisted.
    // If savedOrder exists, the order is committed — rolling back stock would create
    // an oversold state where the order references inventory that was restored.
    if (!savedOrder && successfulReservations.length > 0) {
      await rollbackReservations(successfulReservations);
    } else if (savedOrder) {
      console.error(
        `WARNING: Post-persistence error for order ${savedOrder.orderNumber}. ` +
        `Stock reservations preserved. Manual review may be required.`
      );
    }

    return res.status(500).json({
      success: false,
      message: savedOrder
        ? `Order ${savedOrder.orderNumber} was placed, but a post-processing step encountered an error. Do not resubmit.`
        : "An internal server error occurred while processing your order.",
    });
  }
};

/**
 * Helper to roll back stock reservations in case of stock exhaustion or persistence failure.
 * Restores exact reserved quantities using atomic MongoDB $inc increments.
 */
async function rollbackReservations(reservations) {
  for (const resv of reservations) {
    try {
      await Product.updateOne(
        {
          _id: resv.productId,
          "variants._id": resv.variantId,
        },
        {
          $inc: { "variants.$.stock": resv.quantity },
        }
      );
    } catch (rollbackErr) {
      console.error(
        `CRITICAL STOCK ROLLBACK FAILURE: Product ID ${resv.productId}, Variant ID ${resv.variantId}, Quantity ${resv.quantity}:`,
        rollbackErr.message
      );
    }
  }
}
