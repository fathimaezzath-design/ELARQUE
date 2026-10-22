const Coupon = require("../models/Coupon");

// GET /api/coupons/available
// Get all active and eligible coupons for the current user
exports.getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
    }).sort({ minPurchase: 1 });

    // Filter coupons that user has not exhausted
    const eligibleCoupons = coupons.map((c) => {
      const userUsage = (c.usedBy || []).filter(
        (u) => u.userId && u.userId.toString() === userId.toString()
      ).length;

      const isEligible = userUsage < (c.userUsageLimit || 1);

      return {
        _id: c._id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxDiscount: c.maxDiscount,
        minPurchase: c.minPurchase,
        expiryDate: c.expiryDate,
        isEligible,
        userUsage,
        userUsageLimit: c.userUsageLimit || 1,
      };
    });

    return res.status(200).json({
      success: true,
      coupons: eligibleCoupons,
    });
  } catch (error) {
    console.error("GET AVAILABLE COUPONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve available coupons.",
    });
  }
};

// POST /api/coupons/apply
// Apply a coupon and calculate discount on subtotal
exports.applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { code, subtotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a promotional coupon code.",
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderSubtotal = Number(subtotal) || 0;

    if (orderSubtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart subtotal must be greater than zero to apply a coupon.",
      });
    }

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Privilege code "${cleanCode}" is invalid or does not exist.`,
      });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return res.status(400).json({
        success: false,
        message: `Privilege code "${cleanCode}" is not yet active.`,
      });
    }

    if (coupon.expiryDate && coupon.expiryDate < now) {
      return res.status(400).json({
        success: false,
        message: `Privilege code "${cleanCode}" has expired.`,
      });
    }

    if (orderSubtotal < (coupon.minPurchase || 0)) {
      return res.status(400).json({
        success: false,
        message: `A minimum commission value of ₹${coupon.minPurchase.toLocaleString("en-IN")} is required for coupon "${cleanCode}".`,
      });
    }

    // Check user usage limit
    const userUsageCount = (coupon.usedBy || []).filter(
      (u) => u.userId && u.userId.toString() === userId.toString()
    ).length;

    if (userUsageCount >= (coupon.userUsageLimit || 1)) {
      return res.status(400).json({
        success: false,
        message: `You have already redeemed privilege code "${cleanCode}" the maximum number of times allowed (${coupon.userUsageLimit}).`,
      });
    }

    // Check system-wide limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Privilege code "${cleanCode}" has reached its total redemption quota.`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((orderSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderSubtotal);
    }

    return res.status(200).json({
      success: true,
      message: `Privilege code "${coupon.code}" applied successfully! You saved ₹${discountAmount.toLocaleString("en-IN")}.`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase,
        discountAmount,
      },
    });
  } catch (error) {
    console.error("APPLY COUPON ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while applying coupon.",
    });
  }
};

// POST /api/coupons/remove
exports.removeCoupon = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Coupon removed successfully.",
  });
};
