const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const User = require("../models/User");
const Coupon = require("../models/Coupon");

// Configuration helper for Razorpay
function getRazorpayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const isRealConfig = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("elarqueTestKey") &&
    !keySecret.includes("elarqueTestSecret") &&
    keyId.startsWith("rzp_")
  );

  let instance = null;
  if (isRealConfig) {
    try {
      instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (err) {
      console.warn("Razorpay instance initialization note:", err.message);
    }
  }

  return { keyId, keySecret, isRealConfig, instance };
}

// Generate unique order reference (e.g. #ELQ-2026-78901)
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `#ELQ-${year}-${rand}`;
}

// Helper: Rollback inventory reservations if order persistence fails
async function rollbackReservations(reservations) {
  for (const res of reservations) {
    try {
      await Product.findOneAndUpdate(
        {
          _id: res.productId,
          "variants._id": res.variantId,
        },
        {
          $inc: { "variants.$.stock": res.quantity },
        }
      );
    } catch (err) {
      console.error(
        `Failed to rollback stock for product ${res.productId}, variant ${res.variantId}:`,
        err
      );
    }
  }
}

// Helper: Calculate cart total & validate items
async function calculateCartSummary(userId, couponCode = "") {
  const cart = await Cart.findOne({ userId });
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new Error("Your shopping bag is empty.");
  }

  const validatedItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.productId,
      isDeleted: false,
      status: "active",
    });

    if (!product) {
      throw new Error(`Garment "${item.name || "Item"}" is no longer available.`);
    }

    const variant = (product.variants || []).find(
      (v) => v._id && v._id.toString() === item.variantId.toString()
    );

    if (!variant) {
      throw new Error(`Selected variant for "${product.name}" is no longer available.`);
    }

    const qty = Number(item.quantity) || 1;
    const currentStock = Number(variant.stock) || 0;
    if (currentStock < qty) {
      throw new Error(`Insufficient stock for "${product.name}" (${variant.size} / ${variant.color}). Available: ${currentStock}.`);
    }

    const basePrice = Number(variant.price || product.price);
    const salePrice = variant.salePrice !== undefined && variant.salePrice !== null ? Number(variant.salePrice) : product.salePrice;
    const effectivePrice = salePrice && Number(salePrice) < basePrice ? Number(salePrice) : basePrice;

    const lineTotal = effectivePrice * qty;
    subtotal += lineTotal;

    validatedItems.push({
      product: product._id,
      variantId: variant._id,
      variant: {
        _id: variant._id,
        size: variant.size,
        color: variant.color,
      },
      productName: product.name,
      productImage: Array.isArray(variant.images) && variant.images.length > 0 ? variant.images[0] : "",
      price: effectivePrice,
      quantity: qty,
      itemTotal: lineTotal,
      itemStatus: "Active",
    });
  }

  // Calculate Coupon Discount
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const couponDoc = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (couponDoc) {
      const now = new Date();
      if ((!couponDoc.startDate || couponDoc.startDate <= now) && (!couponDoc.expiryDate || couponDoc.expiryDate >= now)) {
        if (subtotal >= (couponDoc.minPurchase || 0)) {
          if (couponDoc.discountType === "percentage") {
            discount = Math.round((subtotal * couponDoc.discountValue) / 100);
            if (couponDoc.maxDiscount && discount > couponDoc.maxDiscount) {
              discount = couponDoc.maxDiscount;
            }
          } else {
            discount = Math.min(couponDoc.discountValue, subtotal);
          }
          appliedCoupon = {
            code: couponDoc.code,
            discountAmount: discount,
            discountType: couponDoc.discountType,
          };
        }
      }
    }
  }

  const packagingFee = 199;
  const shippingCharge = 0;
  const totalAmount = Math.max(0, subtotal - discount + packagingFee + shippingCharge);

  return {
    cart,
    validatedItems,
    subtotal,
    discount,
    packagingFee,
    shippingCharge,
    totalAmount,
    appliedCoupon,
  };
}

// -----------------------------------------------------------------------------
// RAZORPAY: CREATE ORDER
// POST /api/payment/razorpay/create-order
// Body: { addressId, couponCode }
// -----------------------------------------------------------------------------
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { addressId, couponCode = "" } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "A valid delivery address is required.",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    const { totalAmount, subtotal, discount, appliedCoupon } = await calculateCartSummary(
      userId,
      couponCode
    );

    const amountInPaise = Math.round(totalAmount * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    const { keyId, keySecret, isRealConfig, instance } = getRazorpayConfig();

    if (!isRealConfig || !instance) {
      return res.status(500).json({
        success: false,
        message: "Razorpay gateway is not configured with valid Test Mode API keys.",
      });
    }

    let razorpayOrderId = "";
    try {
      const orderOptions = {
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: userId.toString(),
          couponCode: appliedCoupon?.code || "",
        },
      };
      const rzpOrder = await instance.orders.create(orderOptions);
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.error("Razorpay orders.create failed:", rzpErr);
      return res.status(502).json({
        success: false,
        message: `Razorpay Gateway Error: ${rzpErr.error?.description || rzpErr.message || "Failed to initialize order on Razorpay."}`,
      });
    }

    return res.status(200).json({
      success: true,
      keyId,
      razorpayOrderId,
      amount: totalAmount,
      amountInPaise,
      currency: "INR",
      receipt,
      subtotal,
      discount,
      packagingFee: 199,
      coupon: appliedCoupon,
      customer: {
        name: address.fullName,
        phone: address.phone,
        email: req.user.email || "",
      },
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to initialize Razorpay payment.",
    });
  }
};

// -----------------------------------------------------------------------------
// RAZORPAY: VERIFY PAYMENT & PLACE ORDER
// POST /api/payment/razorpay/verify
// Body: { addressId, couponCode, razorpayOrderId, razorpayPaymentId, razorpaySignature }
// -----------------------------------------------------------------------------
exports.verifyRazorpayPayment = async (req, res) => {
  const successfulReservations = [];

  try {
    const userId = req.user.id || req.user._id;
    const {
      addressId,
      couponCode = "",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: "Valid address required." });
    }

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order and payment IDs are required.",
      });
    }

    // Idempotency: Prevent duplicate order processing if already confirmed
    const existingOrder = await Order.findOne({ gatewayPaymentId: razorpayPaymentId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified and order confirmed.",
        order: existingOrder,
      });
    }

    const { keySecret, isRealConfig } = getRazorpayConfig();

    if (!isRealConfig || !keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay gateway is not configured with valid Test Mode API keys on server.",
      });
    }

    // Verify cryptographic signature securely
    if (!razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment authentication failed. Cryptographic signature is required.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment authentication failed. Cryptographic signature does not match.",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Delivery address not found." });
    }

    const {
      cart,
      validatedItems,
      subtotal,
      discount,
      packagingFee,
      shippingCharge,
      totalAmount,
      appliedCoupon,
    } = await calculateCartSummary(userId, couponCode);

    // Stock reservations
    const variantRequirements = new Map();
    for (const item of validatedItems) {
      const key = `${item.product.toString()}_${item.variantId.toString()}`;
      if (variantRequirements.has(key)) {
        variantRequirements.get(key).totalQuantity += item.quantity;
      } else {
        variantRequirements.set(key, {
          productId: item.product,
          variantId: item.variantId,
          totalQuantity: item.quantity,
          name: item.productName,
          size: item.variant.size,
          color: item.variant.color,
        });
      }
    }

    let reservationFailed = null;
    for (const reqItem of variantRequirements.values()) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: reqItem.productId,
          isDeleted: false,
          status: "active",
          variants: {
            $elemMatch: {
              _id: reqItem.variantId,
              stock: { $gte: reqItem.totalQuantity },
            },
          },
        },
        {
          $inc: { "variants.$.stock": -reqItem.totalQuantity },
        },
        { returnDocument: "after" }
      );

      if (!updatedProduct) {
        reservationFailed = reqItem;
        break;
      }

      successfulReservations.push({
        productId: reqItem.productId,
        variantId: reqItem.variantId,
        quantity: reqItem.totalQuantity,
      });
    }

    if (reservationFailed) {
      await rollbackReservations(successfulReservations);
      return res.status(409).json({
        success: false,
        message: `Inventory exhausted for "${reservationFailed.name}" (${reservationFailed.size} / ${reservationFailed.color}).`,
      });
    }

    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      house: address.house || "",
      street: address.street || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    const orderNumber = generateOrderNumber();

    const orderDoc = new Order({
      orderNumber,
      user: userId,
      items: validatedItems,
      shippingAddress: shippingAddressSnapshot,
      subtotal,
      discount,
      coupon: appliedCoupon || { code: "", discountAmount: 0, discountType: "" },
      shippingCharge,
      packagingFee,
      totalAmount,
      paymentMethod: "ONLINE",
      paymentGateway: "Razorpay",
      gatewayOrderId: razorpayOrderId,
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature || "",
      paymentStatus: "Paid",
      orderStatus: "Placed",
    });

    const savedOrder = await orderDoc.save();

    // Clear user cart
    try {
      cart.items = [];
      await cart.save();
    } catch (cErr) {
      console.warn("Cart cleanup warning:", cErr.message);
    }

    // Increment user order count
    try {
      await User.findByIdAndUpdate(userId, { $inc: { orderCount: 1 } });
    } catch (uErr) {
      console.warn("Order count update warning:", uErr.message);
    }

    // Record coupon usage
    if (appliedCoupon && appliedCoupon.code) {
      try {
        await Coupon.findOneAndUpdate(
          { code: appliedCoupon.code },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: {
                userId,
                orderId: savedOrder._id,
                usedAt: new Date(),
              },
            },
          }
        );
      } catch (cpnErr) {
        console.warn("Coupon usage record warning:", cpnErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Payment successfully verified and order confirmed.",
      order: savedOrder,
    });
  } catch (error) {
    console.error("VERIFY RAZORPAY PAYMENT ERROR:", error);
    await rollbackReservations(successfulReservations);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment and order.",
    });
  }
};

// -----------------------------------------------------------------------------
// PAYPAL: CREATE & CAPTURE (Multi-Gateway Add-On)
// -----------------------------------------------------------------------------
exports.createPayPalOrder = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { addressId, couponCode = "" } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: "Valid delivery address is required." });
    }

    const { totalAmount, subtotal, discount, appliedCoupon } = await calculateCartSummary(
      userId,
      couponCode
    );

    const paypalOrderId = `PAYPAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
      success: true,
      gateway: "PayPal",
      paypalOrderId,
      amount: totalAmount,
      currency: "INR",
      subtotal,
      discount,
      coupon: appliedCoupon,
      packagingFee: 199,
    });
  } catch (error) {
    console.error("PAYPAL CREATE ORDER ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to initialize PayPal transaction.",
    });
  }
};

exports.capturePayPalPayment = async (req, res) => {
  const successfulReservations = [];

  try {
    const userId = req.user.id || req.user._id;
    const { addressId, couponCode = "", paypalOrderId, paypalPaymentId } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: "Valid address required." });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Delivery address not found." });
    }

    const {
      cart,
      validatedItems,
      subtotal,
      discount,
      packagingFee,
      shippingCharge,
      totalAmount,
      appliedCoupon,
    } = await calculateCartSummary(userId, couponCode);

    // Stock reservations
    const variantRequirements = new Map();
    for (const item of validatedItems) {
      const key = `${item.product.toString()}_${item.variantId.toString()}`;
      if (variantRequirements.has(key)) {
        variantRequirements.get(key).totalQuantity += item.quantity;
      } else {
        variantRequirements.set(key, {
          productId: item.product,
          variantId: item.variantId,
          totalQuantity: item.quantity,
          name: item.productName,
          size: item.variant.size,
          color: item.variant.color,
        });
      }
    }

    let reservationFailed = null;
    for (const reqItem of variantRequirements.values()) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: reqItem.productId,
          isDeleted: false,
          status: "active",
          variants: {
            $elemMatch: {
              _id: reqItem.variantId,
              stock: { $gte: reqItem.totalQuantity },
            },
          },
        },
        {
          $inc: { "variants.$.stock": -reqItem.totalQuantity },
        },
        { returnDocument: "after" }
      );

      if (!updatedProduct) {
        reservationFailed = reqItem;
        break;
      }

      successfulReservations.push({
        productId: reqItem.productId,
        variantId: reqItem.variantId,
        quantity: reqItem.totalQuantity,
      });
    }

    if (reservationFailed) {
      await rollbackReservations(successfulReservations);
      return res.status(409).json({
        success: false,
        message: `Inventory exhausted for "${reservationFailed.name}".`,
      });
    }

    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      house: address.house || "",
      street: address.street || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    const orderNumber = generateOrderNumber();

    const orderDoc = new Order({
      orderNumber,
      user: userId,
      items: validatedItems,
      shippingAddress: shippingAddressSnapshot,
      subtotal,
      discount,
      coupon: appliedCoupon || { code: "", discountAmount: 0, discountType: "" },
      shippingCharge,
      packagingFee,
      totalAmount,
      paymentMethod: "ONLINE",
      paymentGateway: "PayPal",
      gatewayOrderId: paypalOrderId || `PAYPAL-${Date.now()}`,
      gatewayPaymentId: paypalPaymentId || `CAPT-${Date.now()}`,
      paymentStatus: "Paid",
      orderStatus: "Placed",
    });

    const savedOrder = await orderDoc.save();

    // Clean cart
    try {
      cart.items = [];
      await cart.save();
    } catch (cErr) {
      console.warn("Cart cleanup warning:", cErr.message);
    }

    // Increment count
    try {
      await User.findByIdAndUpdate(userId, { $inc: { orderCount: 1 } });
    } catch (uErr) {
      console.warn("User update warning:", uErr.message);
    }

    // Record coupon usage
    if (appliedCoupon && appliedCoupon.code) {
      try {
        await Coupon.findOneAndUpdate(
          { code: appliedCoupon.code },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: {
                userId,
                orderId: savedOrder._id,
                usedAt: new Date(),
              },
            },
          }
        );
      } catch (cpnErr) {
        console.warn("Coupon record warning:", cpnErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "PayPal payment captured and order confirmed.",
      order: savedOrder,
    });
  } catch (error) {
    console.error("PAYPAL CAPTURE PAYMENT ERROR:", error);
    await rollbackReservations(successfulReservations);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete PayPal order.",
    });
  }
};
