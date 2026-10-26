const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");

// ── GET /api/admin/offers ────────────────────────────────────────────────────
exports.getOffers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      type = "all",
      sort = "recent",
    } = req.query;

    const query = {};
    const now = new Date();

    // Search by title, code, or description
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by type
    if (type !== "all") {
      query.offerType = type;
    }

    // Filter by status
    if (status === "active") {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === "scheduled") {
      query.isActive = true;
      query.startDate = { $gt: now };
    } else if (status === "expired") {
      query.$or = [
        { endDate: { $lt: now } },
      ];
    } else if (status === "draft") {
      query.isActive = false;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "discount_high") sortOption = { discountValue: -1 };
    else if (sort === "discount_low") sortOption = { discountValue: 1 };
    else if (sort === "expiry_soon") sortOption = { endDate: 1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [offers, total] = await Promise.all([
      Offer.find(query)
        .populate("targetProducts", "name price brand")
        .populate("targetCategories", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Offer.countDocuments(query),
    ]);

    // Attach dynamic computed status to each offer
    const enrichedOffers = offers.map((offer) => {
      let computedStatus = "active";
      if (!offer.isActive) {
        computedStatus = "draft";
      } else if (new Date(offer.startDate) > now) {
        computedStatus = "scheduled";
      } else if (new Date(offer.endDate) < now) {
        computedStatus = "expired";
      }
      return {
        ...offer,
        computedStatus,
      };
    });

    return res.status(200).json({
      success: true,
      offers: enrichedOffers,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error("GET OFFERS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve promotional offers.",
    });
  }
};

// ── GET /api/admin/offers/:id ────────────────────────────────────────────────
exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate("targetProducts", "name price brand")
      .populate("targetCategories", "name")
      .lean();

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    const now = new Date();
    let computedStatus = "active";
    if (!offer.isActive) computedStatus = "draft";
    else if (new Date(offer.startDate) > now) computedStatus = "scheduled";
    else if (new Date(offer.endDate) < now) computedStatus = "expired";

    return res.status(200).json({
      success: true,
      offer: {
        ...offer,
        computedStatus,
      },
    });
  } catch (err) {
    console.error("GET OFFER BY ID ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load offer details.",
    });
  }
};

// ── POST /api/admin/offers ───────────────────────────────────────────────────
exports.createOffer = async (req, res) => {
  try {
    const {
      title,
      code,
      offerType = "percentage",
      targetClass,
      targetProducts = [],
      targetCategories = [],
      discountCalculation = "percentage",
      discountValue,
      startDate,
      endDate,
      isActive = true,
      referralConfig,
      description = "",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Offer title is required.",
      });
    }

    if (!targetClass || !["product", "category", "referral"].includes(targetClass)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid target class (Product, Category, or Referral).",
      });
    }

    if (discountValue === undefined || discountValue === null || Number(discountValue) < 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid discount value.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and expiration date are required.",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after expiration date.",
      });
    }

    if (targetClass === "product" && (!targetProducts || targetProducts.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one targeted product for product offers.",
      });
    }

    if (targetClass === "category" && (!targetCategories || targetCategories.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one targeted category for category offers.",
      });
    }

    const offer = await Offer.create({
      title: title.trim(),
      code: code ? code.trim().toUpperCase() : `OFFER-${Date.now().toString(36).toUpperCase()}`,
      offerType,
      targetClass,
      targetProducts,
      targetCategories,
      discountCalculation,
      discountValue: Number(discountValue),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: Boolean(isActive),
      referralConfig: referralConfig || { referrerAmount: 200, refereeAmount: 100 },
      description: description.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Promotional offer successfully published.",
      offer,
    });
  } catch (err) {
    console.error("CREATE OFFER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create offer.",
    });
  }
};

// ── PUT /api/admin/offers/:id ────────────────────────────────────────────────
exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    const {
      title,
      code,
      offerType,
      targetClass,
      targetProducts,
      targetCategories,
      discountCalculation,
      discountValue,
      startDate,
      endDate,
      isActive,
      referralConfig,
      description,
    } = req.body;

    if (title) offer.title = title.trim();
    if (code) offer.code = code.trim().toUpperCase();
    if (offerType) offer.offerType = offerType;
    if (targetClass) offer.targetClass = targetClass;
    if (targetProducts) offer.targetProducts = targetProducts;
    if (targetCategories) offer.targetCategories = targetCategories;
    if (discountCalculation) offer.discountCalculation = discountCalculation;
    if (discountValue !== undefined) offer.discountValue = Number(discountValue);
    if (startDate) offer.startDate = new Date(startDate);
    if (endDate) offer.endDate = new Date(endDate);
    if (isActive !== undefined) offer.isActive = Boolean(isActive);
    if (referralConfig) offer.referralConfig = referralConfig;
    if (description !== undefined) offer.description = description.trim();

    await offer.save();

    return res.status(200).json({
      success: true,
      message: "Promotional offer updated successfully.",
      offer,
    });
  } catch (err) {
    console.error("UPDATE OFFER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update offer.",
    });
  }
};

// ── DELETE /api/admin/offers/:id ─────────────────────────────────────────────
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promotional offer deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE OFFER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete offer.",
    });
  }
};

// ── PATCH /api/admin/offers/:id/toggle ───────────────────────────────────────
exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    return res.status(200).json({
      success: true,
      message: `Offer ${offer.isActive ? "activated" : "moved to draft"}.`,
      isActive: offer.isActive,
    });
  } catch (err) {
    console.error("TOGGLE OFFER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to toggle offer status.",
    });
  }
};

// ── GET /api/admin/offers/targets ────────────────────────────────────────────
// Returns active products & categories for offer builder dropdown selection
exports.getOfferTargets = async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isDeleted: false, status: "active" })
        .select("_id name price categoryId")
        .populate("categoryId", "name")
        .lean(),
      Category.find({ isDeleted: false, status: "active" })
        .select("_id name")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      products,
      categories,
    });
  } catch (err) {
    console.error("GET OFFER TARGETS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load targets.",
    });
  }
};
