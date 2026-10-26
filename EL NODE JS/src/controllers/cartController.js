const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { getActiveOffers, evaluateProductOffer } = require("../utils/offerUtils");

/**
 * Format a populated cart document into a customer-facing response structure
 * consistent with ELARQUE cart designs and business rules.
 */
function formatCart(cart, activeOffers = []) {
  if (!cart || !Array.isArray(cart.items)) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      shippingFee: 0,
      packagingFee: 0,
      total: 0,
    };
  }

  let subtotal = 0;
  let availableCurationsCount = 0;
  let totalQuantity = 0;

  const formattedItems = cart.items.map((item) => {
    const product = item.productId;
    const isProductPopulated = product && typeof product === "object" && product._id;

    const isProductActive = Boolean(
      isProductPopulated &&
        !product.isDeleted &&
        product.status === "active" &&
        product.categoryId &&
        !product.categoryId.isDeleted &&
        product.categoryId.status === "active"
    );

    let variant = null;
    if (isProductPopulated && Array.isArray(product.variants)) {
      variant = product.variants.find(
        (v) => v._id && v._id.toString() === item.variantId.toString()
      );
    }

    const variantExists = Boolean(variant);
    const availableStock = variant ? Number(variant.stock) || 0 : 0;
    const isAvailable = Boolean(isProductActive && variantExists && availableStock > 0);
    const hasSufficientStock = Boolean(isAvailable && availableStock >= item.quantity);

    // Calculate current effective price
    let currentPrice = item.price;
    let originalPrice = item.price;
    let appliedOffer = null;

    if (isProductActive && product.price !== undefined) {
      originalPrice = Number(product.price);
      if (
        product.salePrice !== undefined &&
        product.salePrice !== null &&
        Number(product.salePrice) < Number(product.price)
      ) {
        currentPrice = Number(product.salePrice);
      } else {
        currentPrice = Number(product.price);
      }

      // Check active promotional offers: Apply largest between product & category
      if (Array.isArray(activeOffers) && activeOffers.length > 0) {
        const offerResult = evaluateProductOffer(
          {
            _id: product._id,
            price: originalPrice,
            categoryId: product.categoryId,
          },
          activeOffers
        );
        if (offerResult && offerResult.discountAmount > 0) {
          if (offerResult.finalPrice < currentPrice) {
            currentPrice = offerResult.finalPrice;
            appliedOffer = offerResult.appliedOffer;
          }
        }
      }
    }

    // Determine cover image: variant-specific image preferred
    let coverImage = null;
    if (variant && Array.isArray(variant.images) && variant.images.length > 0) {
      coverImage = variant.images[0];
    } else if (isProductPopulated) {
      if (product.coverImage) {
        coverImage = product.coverImage;
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        coverImage = product.images[0];
      }
    }

    const lineTotal = currentPrice * item.quantity;

    // Status message for customer UI
    let statusMessage = "Ready to Ship";
    if (!isProductActive || !variantExists) {
      statusMessage = "Currently unavailable";
    } else if (availableStock <= 0) {
      statusMessage = "Out of stock";
    } else if (availableStock <= 5) {
      statusMessage = `Low stock: only ${availableStock} left`;
    }

    // Accumulate available totals
    if (isAvailable && hasSufficientStock) {
      subtotal += lineTotal;
      availableCurationsCount += 1;
      totalQuantity += item.quantity;
    }

    return {
      id: item._id.toString(),
      _id: item._id.toString(),
      productId: isProductPopulated ? product._id.toString() : item.productId.toString(),
      variantId: item.variantId.toString(),
      name: isProductPopulated ? product.name : "Unavailable Garment",
      brand: isProductPopulated ? product.brand : "ELARQUE",
      category:
        isProductPopulated && product.categoryId
          ? product.categoryId.name
          : "",
      coverImage,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: currentPrice,
      originalPrice,
      lineTotal,
      isAvailable,
      availableStock,
      hasSufficientStock,
      statusMessage,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const shippingFee = 0; // Complimentary tracked courier dispatch
  const packagingFee = availableCurationsCount > 0 ? 199 : 0; // Signature Parisian keepsake packaging
  const total = subtotal + packagingFee + shippingFee;

  return {
    items: formattedItems,
    itemCount: totalQuantity,
    curationsCount: availableCurationsCount,
    subtotal,
    shippingFee,
    packagingFee,
    total,
  };
}

/**
 * Helper to fetch a fully populated cart for a customer
 */
async function getPopulatedCart(userId) {
  return Cart.findOne({ userId }).populate({
    path: "items.productId",
    populate: {
      path: "categoryId",
      select: "_id name status isDeleted",
    },
  });
}

/**
 * GET /api/cart
 * Retrieve current customer's cart with inventory validation and cost breakdown
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated customer identifier.",
      });
    }

    const [cart, activeOffers] = await Promise.all([
      getPopulatedCart(userId),
      getActiveOffers(),
    ]);

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: formatCart(null, activeOffers),
      });
    }

    return res.status(200).json({
      success: true,
      cart: formatCart(cart, activeOffers),
    });
  } catch (error) {
    console.error("Cart getCart error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving your cart.",
    });
  }
};

/**
 * POST /api/cart
 * Add a garment variant to the customer's luxury shopping bag
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const { productId, variantId, quantity } = req.body;

    // 1. Validate identifiers
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Product ID.",
      });
    }

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Variant ID.",
      });
    }

    // 2. Validate quantity
    const qty = quantity !== undefined ? Number(quantity) : 1;
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer greater than or equal to 1.",
      });
    }

    // 3. Find and validate active product & category
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      status: "active",
    }).populate({
      path: "categoryId",
      select: "_id name status isDeleted",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently unavailable in the atelier catalog.",
      });
    }

    if (
      !product.categoryId ||
      product.categoryId.isDeleted ||
      product.categoryId.status !== "active"
    ) {
      return res.status(404).json({
        success: false,
        message: "Product category is archived or unavailable.",
      });
    }

    // 4. Validate embedded variant and inventory
    if (!Array.isArray(product.variants)) {
      return res.status(400).json({
        success: false,
        message: "This product has no available variants.",
      });
    }

    const variant = product.variants.find(
      (v) => v._id && v._id.toString() === variantId.toString()
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Selected size/color variant does not exist for this garment.",
      });
    }

    const stock = Number(variant.stock) || 0;
    if (stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selected variant is currently out of stock.",
      });
    }

    if (qty > stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty}) exceeds available inventory (${stock}).`,
      });
    }

    // 5. Effective unit price (respecting variant price if configured)
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

    // 6. Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // 7. Check if item already exists in cart (prevent duplicate entries)
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.variantId.toString() === variantId.toString()
    );

    if (existingIndex > -1) {
      const existingItem = cart.items[existingIndex];
      const combinedQty = existingItem.quantity + qty;

      if (combinedQty > stock) {
        return res.status(400).json({
          success: false,
          message: `Adding ${qty} more would exceed available stock (${stock}). You already have ${existingItem.quantity} in your cart.`,
        });
      }

      existingItem.quantity = combinedQty;
      existingItem.price = effectivePrice;
      existingItem.size = variant.size;
      existingItem.color = variant.color;
    } else {
      cart.items.push({
        productId: product._id,
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        quantity: qty,
        price: effectivePrice,
      });
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(userId);

    return res.status(200).json({
      success: true,
      message: "Garment added to your luxury cart successfully.",
      cart: formatCart(populatedCart),
    });
  } catch (error) {
    console.error("Cart addToCart error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while adding the garment to cart.",
    });
  }
};

/**
 * PATCH /api/cart/items/:itemId
 * Update quantity for an existing cart item with inventory validation
 */
exports.updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // 1. Validate itemId
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    // 2. Validate quantity
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer greater than or equal to 1.",
      });
    }

    // 3. Find customer cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // 4. Locate item in cart
    const item = cart.items.find((i) => i._id.toString() === itemId.toString());
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in your cart.",
      });
    }

    // 5. Verify product and variant availability and stock
    const product = await Product.findOne({
      _id: item.productId,
      isDeleted: false,
      status: "active",
    }).populate({
      path: "categoryId",
      select: "_id name status isDeleted",
    });

    if (
      !product ||
      !product.categoryId ||
      product.categoryId.isDeleted ||
      product.categoryId.status !== "active"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot update quantity: this garment is currently unavailable.",
      });
    }

    const variant = (product.variants || []).find(
      (v) => v._id && v._id.toString() === item.variantId.toString()
    );

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Cannot update quantity: selected variant is no longer available.",
      });
    }

    const stock = Number(variant.stock) || 0;
    if (qty > stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty}) exceeds available inventory (${stock}).`,
      });
    }

    // 6. Update quantity and update price snapshot (respecting variant price)
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

    item.quantity = qty;
    item.price = effectivePrice;
    item.size = variant.size;
    item.color = variant.color;

    await cart.save();

    const populatedCart = await getPopulatedCart(userId);

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated successfully.",
      cart: formatCart(populatedCart),
    });
  } catch (error) {
    console.error("Cart updateItemQuantity error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while updating cart quantity.",
    });
  }
};

/**
 * DELETE /api/cart/items/:itemId
 * Remove a specific item from the cart
 */
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const { itemId } = req.params;

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const itemExists = cart.items.some((i) => i._id.toString() === itemId.toString());
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Item not found in your cart.",
      });
    }

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId.toString());
    await cart.save();

    const populatedCart = await getPopulatedCart(userId);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully.",
      cart: formatCart(populatedCart),
    });
  } catch (error) {
    console.error("Cart removeItem error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while removing the item from cart.",
    });
  }
};

/**
 * DELETE /api/cart
 * Clear all items from the customer's cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart: formatCart(null),
    });
  } catch (error) {
    console.error("Cart clearCart error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while clearing your cart.",
    });
  }
};
