const Coupon = require("../models/Coupon");
const mongoose = require("mongoose");

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/coupons
// List all coupons (active + inactive) with usage metrics
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllCoupons = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    const now = new Date();
    const enriched = coupons.map((c) => ({
      ...c,
      isExpired: c.expiryDate && new Date(c.expiryDate) < now,
      totalUsers: (c.usedBy || []).length,
    }));

    return res.status(200).json({
      success: true,
      coupons: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("ADMIN GET COUPONS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch coupons." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/coupons
// Create a new coupon
// ──────────────────────────────────────────────────────────────────────────────
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      startDate,
      expiryDate,
      usageLimit,
      userUsageLimit,
      isActive,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required." });
    }

    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than zero." });
    }

    if (!expiryDate) {
      return res.status(400).json({ success: false, message: "Expiry date is required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const exists = await Coupon.findOne({ code: cleanCode });
    if (exists) {
      return res.status(409).json({ success: false, message: `Coupon code "${cleanCode}" already exists.` });
    }

    const coupon = new Coupon({
      code: cleanCode,
      description: (description || "").trim(),
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minPurchase: Number(minPurchase) || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 1000,
      userUsageLimit: Number(userUsageLimit) || 1,
      isActive: isActive !== false,
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Privilege code "${cleanCode}" created successfully.`,
      coupon,
    });
  } catch (err) {
    console.error("ADMIN CREATE COUPON ERROR:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code already exists." });
    }
    return res.status(500).json({ success: false, message: "Failed to create coupon." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/coupons/:id
// Get single coupon details
// ──────────────────────────────────────────────────────────────────────────────
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID." });
    }

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    return res.status(200).json({ success: true, coupon });
  } catch (err) {
    console.error("ADMIN GET COUPON BY ID ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch coupon." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/coupons/:id
// Update a coupon
// ──────────────────────────────────────────────────────────────────────────────
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID." });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    const {
      description,
      discountType,
      discountValue,
      maxDiscount,
      minPurchase,
      startDate,
      expiryDate,
      usageLimit,
      userUsageLimit,
      isActive,
    } = req.body;

    if (description !== undefined) coupon.description = description.trim();
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (minPurchase !== undefined) coupon.minPurchase = Number(minPurchase) || 0;
    if (startDate !== undefined) coupon.startDate = new Date(startDate);
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit) || 1000;
    if (userUsageLimit !== undefined) coupon.userUsageLimit = Number(userUsageLimit) || 1;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Privilege code "${coupon.code}" updated successfully.`,
      coupon,
    });
  } catch (err) {
    console.error("ADMIN UPDATE COUPON ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to update coupon." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/coupons/:id/toggle
// Toggle active / inactive
// ──────────────────────────────────────────────────────────────────────────────
exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID." });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Privilege code "${coupon.code}" is now ${coupon.isActive ? "active" : "inactive"}.`,
      isActive: coupon.isActive,
    });
  } catch (err) {
    console.error("ADMIN TOGGLE COUPON STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to toggle coupon status." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/coupons/:id
// Delete coupon (soft-delete if already used)
// ──────────────────────────────────────────────────────────────────────────────
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID." });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    if ((coupon.usedBy || []).length > 0 || coupon.usedCount > 0) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(200).json({
        success: true,
        message: `Privilege code "${coupon.code}" has prior usage and has been deactivated for auditing.`,
        softDeleted: true,
      });
    }

    await Coupon.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Privilege code "${coupon.code}" permanently deleted.`,
    });
  } catch (err) {
    console.error("ADMIN DELETE COUPON ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to delete coupon." });
  }
};
