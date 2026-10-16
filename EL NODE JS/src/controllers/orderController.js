const mongoose = require("mongoose");
const Order = require("../models/Order");

// ── Product model for stock restoration ─────────────────────────────────────
let Product;
try {
  Product = require("../models/Product");
} catch (err) {
  console.warn("[STOCK WARNING] Product model could not be loaded:", err.message);
  Product = null;
}

// =====================================================
// ELIGIBILITY CONSTANTS
// =====================================================

// Statuses that allow FULL ORDER cancellation
const CANCELLABLE_ORDER_STATUSES = ["Placed", "Confirmed", "Processing"];

// Statuses that allow ITEM-LEVEL cancellation
const CANCELLABLE_ITEM_STATUSES_ORDER = ["Placed", "Confirmed", "Processing"];

// Statuses that allow RETURN REQUEST
const RETURNABLE_ORDER_STATUSES = ["Delivered"];

// =====================================================
// HELPERS
// =====================================================

/**
 * Restore stock for one order item.
 *
 * Matches the variant using:
 *  1) Variant ObjectId (_id) if present in item.variant._id or item.variantId
 *  2) Exact variant size & color match via $elemMatch fallback
 *
 * NOTE ON ATOMICITY:
 * Standalone MongoDB (non-replica set) does not support multi-document transactions.
 * Individual variant increments are atomic at the single-document level using $inc.
 * Each item tracks `stockRestored: boolean` to prevent duplicate increments and
 * enable safe, idempotent retries if transient network or server errors occur.
 *
 * @param {Object} item - The order item subdocument
 * @returns {Promise<{ success: boolean, reason?: string, error?: string, updatedProduct?: Object }>}
 */
async function restoreItemStock(item) {
  if (!Product) {
    const msg = "Product model is not loaded — cannot restore inventory.";
    console.warn(`[STOCK RESTORE] ${msg} Item: "${item.productName}"`);
    return { success: false, reason: msg };
  }

  const productId = item.product || item.productId;
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    const msg = `Invalid or missing product ID for item "${item.productName}".`;
    console.warn(`[STOCK RESTORE] ${msg}`);
    return { success: false, reason: msg };
  }

  const qty = Number(item.quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    const msg = `Invalid item quantity (${item.quantity}) for "${item.productName}".`;
    console.warn(`[STOCK RESTORE] ${msg}`);
    return { success: false, reason: msg };
  }

  // Variant identification
  const variantId =
    (item.variant && item.variant._id) ||
    item.variantId ||
    (mongoose.Types.ObjectId.isValid(item.variant) ? item.variant : null);

  const size = item.variant?.size || item.size;
  const color = item.variant?.color || item.color;

  try {
    let updatedProduct = null;

<<<<<<< Updated upstream
    // Strategy 1: Match by variant ObjectId
    if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
      updatedProduct = await Product.findOneAndUpdate(
=======
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

      // Server-authoritative effective unit price (respecting variant pricing)
      const baseVariantPrice =
        variant.price !== undefined && variant.price !== null
          ? Number(variant.price)
          : Number(product.price);
      const saleVariantPrice =
        variant.salePrice !== undefined && variant.salePrice !== null
          ? Number(variant.salePrice)
          : product.salePrice;

      const effectivePrice =
        saleVariantPrice !== undefined &&
        saleVariantPrice !== null &&
        Number(saleVariantPrice) < Number(baseVariantPrice)
          ? Number(saleVariantPrice)
          : Number(baseVariantPrice);

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
>>>>>>> Stashed changes
        {
          _id: productId,
          "variants._id": variantId,
        },
        {
          $inc: { "variants.$.stock": qty },
        },
        { returnDocument: "after" }
      );
    }

    // Strategy 2: Match by exact variant size and color
    if (!updatedProduct && size && color) {
      updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          variants: {
            $elemMatch: {
              size: size.trim(),
              color: color.trim(),
            },
          },
        },
        {
          $inc: { "variants.$.stock": qty },
        },
        { returnDocument: "after" }
      );
    }

    if (!updatedProduct) {
      // Diagnostic check to see why variant didn't match
      const existing = await Product.findById(productId).select("_id name variants isDeleted");
      if (!existing) {
        return {
          success: false,
          reason: `Product ID ${productId} not found in catalog.`,
        };
      }
      return {
        success: false,
        reason: `Variant (ID: ${variantId || "N/A"}, Size: "${size || ""}", Color: "${color || ""}") not found in garment "${existing.name}".`,
      };
    }

    console.log(
      `[STOCK RESTORE] Restored +${qty} units for "${item.productName}" (Product: ${productId})`
    );
    return {
      success: true,
      updatedProduct,
    };
  } catch (err) {
    console.error(
      `[STOCK RESTORE ERROR] Failed to restore stock for item "${item.productName}":`,
      err.message
    );
    return {
      success: false,
      error: err.message,
    };
  }
}

// =====================================================
// GET MY ORDERS (Customer)
// GET /api/orders
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    const filter = { user: userId };

    if (search && search.trim()) {
      filter.orderNumber = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const orders = await Order.find(filter)
      .select(
        "orderNumber orderDate orderStatus paymentStatus totalAmount items returnStatus stockRestored"
      )
      .sort({ orderDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders.",
    });
  }
};

// =====================================================
// GET ORDER DETAILS (Customer)
// GET /api/orders/:id
// =====================================================

const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: userId,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET ORDER DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching order details.",
    });
  }
};

// =====================================================
// CANCEL FULL ORDER (Customer)
// PATCH /api/orders/:id/cancel
// Body: { reason? }
// =====================================================

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    // Inspect current order state
    const existingOrder = await Order.findOne({ _id: id, user: userId });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Handle idempotency / safe retries on already cancelled orders
    if (existingOrder.orderStatus === "Cancelled") {
      const unrestoredItems = existingOrder.items.filter((i) => !i.stockRestored);

      if (unrestoredItems.length === 0) {
        return res.status(409).json({
          success: false,
          message: "This order is already cancelled and all inventory has been restored.",
        });
      }

      // Safe retry for items whose stock restoration previously failed
      console.log(
        `[RETRY CANCEL] Order ${existingOrder.orderNumber} is already Cancelled. Retrying stock restoration for ${unrestoredItems.length} unrestored item(s)...`
      );

      const retryFailures = [];
      for (const item of unrestoredItems) {
        const restoreRes = await restoreItemStock(item);
        if (restoreRes.success) {
          await Order.updateOne(
            { _id: existingOrder._id, "items._id": item._id },
            { $set: { "items.$.stockRestored": true } }
          );
          item.stockRestored = true;
        } else {
          retryFailures.push({
            itemId: item._id,
            productName: item.productName,
            reason: restoreRes.reason || restoreRes.error || "Inventory update failed",
          });
        }
      }

      const allRestoredNow = existingOrder.items.every((i) => i.stockRestored);
      if (allRestoredNow) {
        await Order.updateOne({ _id: existingOrder._id }, { $set: { stockRestored: true } });
        existingOrder.stockRestored = true;
      }

      return res.status(200).json({
        success: true,
        message:
          retryFailures.length === 0
            ? "Pending inventory restoration completed successfully."
            : "Inventory restoration retried with partial failures.",
        stockRestoration: {
          status: retryFailures.length === 0 ? "completed" : "partial_failure",
          failures: retryFailures,
        },
        order: existingOrder,
      });
    }

    // Eligibility check
    if (!CANCELLABLE_ORDER_STATUSES.includes(existingOrder.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Orders with status "${existingOrder.orderStatus}" cannot be cancelled. Only ${CANCELLABLE_ORDER_STATUSES.join(
          ", "
        )} orders are eligible.`,
      });
    }

    // ── Concurrency Guard: Atomic status transition ──────────────────────────
    // Uses findOneAndUpdate with status filter to prevent duplicate concurrent runs
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        user: userId,
        orderStatus: { $in: CANCELLABLE_ORDER_STATUSES },
      },
      {
        $set: {
          orderStatus: "Cancelled",
          cancellationReason: reason.trim(),
          cancelledDate: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message: "Order cancellation could not be processed due to a concurrent status update. Please refresh.",
      });
    }

    // ── Stock Restoration for all eligible active items ──────────────────────
    const stockFailures = [];

    for (const item of order.items) {
      if (item.itemStatus === "Active") {
        let restored = false;

        if (!item.stockRestored) {
          const restoreRes = await restoreItemStock(item);
          if (restoreRes.success) {
            restored = true;
          } else {
            stockFailures.push({
              itemId: item._id,
              productName: item.productName,
              reason: restoreRes.reason || restoreRes.error || "Inventory update failed",
            });
          }
        } else {
          // Already restored previously
          restored = true;
        }

        // Update item status and stockRestored flag in database
        const itemUpdate = {
          "items.$.itemStatus": "Cancelled",
          "items.$.stockRestored": restored,
        };
        if (reason.trim() && !item.cancellationReason) {
          itemUpdate["items.$.cancellationReason"] = reason.trim();
        }

        await Order.updateOne(
          { _id: order._id, "items._id": item._id },
          { $set: itemUpdate }
        );

        item.itemStatus = "Cancelled";
        item.stockRestored = restored;
        if (reason.trim() && !item.cancellationReason) {
          item.cancellationReason = reason.trim();
        }
      }
    }

    // Only mark order.stockRestored = true if ALL items are restored
    const allItemsRestored = order.items.every((i) => i.stockRestored);
    if (allItemsRestored) {
      await Order.updateOne({ _id: order._id }, { $set: { stockRestored: true } });
      order.stockRestored = true;
    } else {
      await Order.updateOne({ _id: order._id }, { $set: { stockRestored: false } });
      order.stockRestored = false;
    }

    return res.status(200).json({
      success: true,
      message:
        stockFailures.length === 0
          ? "Order cancelled successfully and inventory restored."
          : "Order cancelled. However, inventory restoration encountered issues for some items and will be reconciled.",
      stockRestoration: {
        status: stockFailures.length === 0 ? "completed" : "partial_failure",
        failures: stockFailures,
      },
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        cancellationReason: order.cancellationReason,
        cancelledDate: order.cancelledDate,
        stockRestored: order.stockRestored,
        items: order.items,
      },
    });
  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling order.",
    });
  }
};

// =====================================================
// CANCEL SINGLE ITEM (Customer)
// PATCH /api/orders/:id/items/:itemId/cancel
// Body: { reason? }
// =====================================================

const cancelOrderItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, itemId } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    // First check existing order and item status
    const existingOrder = await Order.findOne({ _id: id, user: userId });
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!CANCELLABLE_ITEM_STATUSES_ORDER.includes(existingOrder.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Individual items cannot be cancelled when the order status is "${existingOrder.orderStatus}".`,
      });
    }

    const existingItem = existingOrder.items.id(itemId);
    if (!existingItem) {
      return res.status(404).json({ success: false, message: "Order item not found." });
    }

    if (existingItem.itemStatus !== "Active") {
      return res.status(409).json({
        success: false,
        message: `This item is already "${existingItem.itemStatus}" and cannot be cancelled again.`,
      });
    }

    // ── Concurrency Guard: Atomic item status transition ──────────────────────
    // Ensures only one concurrent request can transition this item from "Active"
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        user: userId,
        orderStatus: { $in: CANCELLABLE_ITEM_STATUSES_ORDER },
        items: {
          $elemMatch: {
            _id: itemId,
            itemStatus: "Active",
          },
        },
      },
      {
        $set: {
          "items.$.itemStatus": "Cancelled",
          "items.$.cancellationReason": reason.trim(),
        },
      },
      { returnDocument: "after" }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message: "Item cancellation could not be processed due to a concurrent update. Please refresh.",
      });
    }

    const item = order.items.id(itemId);

    // ── Stock Restoration for this specific item ──────────────────────────────
    let stockRestored = false;
    let stockError = null;

    if (!item.stockRestored) {
      const restoreRes = await restoreItemStock(item);
      if (restoreRes.success) {
        stockRestored = true;
        await Order.updateOne(
          { _id: order._id, "items._id": itemId },
          { $set: { "items.$.stockRestored": true } }
        );
        item.stockRestored = true;
      } else {
        stockError = restoreRes.reason || restoreRes.error || "Inventory update failed";
        console.warn(
          `[ITEM CANCEL] Stock restore failed for item ${itemId} ("${item.productName}"): ${stockError}`
        );
      }
    } else {
      stockRestored = true;
    }

    // ── Recalculate order totals from remaining active items ──────────────────
    const activeItems = order.items.filter((i) => i.itemStatus === "Active");
    const newSubtotal = activeItems.reduce((sum, i) => sum + i.itemTotal, 0);
    const newTotalAmount = Math.max(
      0,
      newSubtotal - (order.discount || 0) + (order.shippingCharge || 0)
    );

    const orderUpdate = {
      subtotal: newSubtotal,
      totalAmount: newTotalAmount,
    };

    if (activeItems.length === 0) {
      // All items in the order are now cancelled
      orderUpdate.orderStatus = "Cancelled";
      orderUpdate.cancelledDate = new Date();
      orderUpdate.cancellationReason = "All items cancelled by customer.";
      orderUpdate.stockRestored = order.items.every((i) => i.stockRestored);
    }

    await Order.updateOne({ _id: order._id }, { $set: orderUpdate });

    return res.status(200).json({
      success: true,
      message: stockRestored
        ? "Item cancelled successfully and inventory restored."
        : "Item cancelled. However, inventory restoration could not be completed and is queued for reconciliation.",
      stockRestoration: {
        success: stockRestored,
        error: stockError,
      },
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: activeItems.length === 0 ? "Cancelled" : order.orderStatus,
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
        items: order.items,
      },
    });
  } catch (error) {
    console.error("CANCEL ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling item.",
    });
  }
};

// =====================================================
// REQUEST FULL ORDER RETURN (Customer)
// PATCH /api/orders/:id/return
// Body: { reason } (required)
// NOTE: Return requests do NOT restore stock.
// Stock restoration for returns only occurs when physically
// inspected and approved by warehouse administration.
// =====================================================

const requestOrderReturn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    if (!reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A return reason is required.",
      });
    }

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!RETURNABLE_ORDER_STATUSES.includes(order.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Return requests are only allowed for orders with status: ${RETURNABLE_ORDER_STATUSES.join(
          ", "
        )}. Current status: "${order.orderStatus}".`,
      });
    }

    if (order.returnStatus !== "None") {
      return res.status(409).json({
        success: false,
        message: `A return request already exists for this order (current status: "${order.returnStatus}").`,
      });
    }

    order.returnStatus = "Requested";
    order.returnReason = reason.trim();

    // Mark active items as ReturnRequested without restoring stock
    for (const item of order.items) {
      if (item.itemStatus === "Active") {
        item.itemStatus = "ReturnRequested";
        item.returnStatus = "Requested";
        item.returnReason = reason.trim();
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return request submitted. Our atelier team will review it shortly.",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        returnStatus: order.returnStatus,
        returnReason: order.returnReason,
      },
    });
  } catch (error) {
    console.error("REQUEST RETURN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting return request.",
    });
  }
};

// =====================================================
// REQUEST ITEM-LEVEL RETURN (Customer)
// PATCH /api/orders/:id/items/:itemId/return
// Body: { reason } (required)
// NOTE: Item return requests do NOT restore stock.
// =====================================================

const requestItemReturn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, itemId } = req.params;
    const { reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    if (!reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A return reason is required.",
      });
    }

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!RETURNABLE_ORDER_STATUSES.includes(order.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: `Item return requests are only allowed when the order is "${RETURNABLE_ORDER_STATUSES.join(
          ", "
        )}". Current status: "${order.orderStatus}".`,
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: "Order item not found." });
    }

    if (item.itemStatus !== "Active") {
      return res.status(409).json({
        success: false,
        message: `This item's status is "${item.itemStatus}" — a return cannot be requested at this stage.`,
      });
    }

    if (item.returnStatus !== "None") {
      return res.status(409).json({
        success: false,
        message: `A return request already exists for this item (status: "${item.returnStatus}").`,
      });
    }

    item.itemStatus = "ReturnRequested";
    item.returnStatus = "Requested";
    item.returnReason = reason.trim();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Item return request submitted. Our atelier team will review it shortly.",
      item: {
        _id: item._id,
        productName: item.productName,
        itemStatus: item.itemStatus,
        returnStatus: item.returnStatus,
        returnReason: item.returnReason,
      },
    });
  } catch (error) {
    console.error("REQUEST ITEM RETURN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting item return request.",
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  cancelOrderItem,
  requestOrderReturn,
  requestItemReturn,
  restoreItemStock, // Exported for unit/integration testing
};
