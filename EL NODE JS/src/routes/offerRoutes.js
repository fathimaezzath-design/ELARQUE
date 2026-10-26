const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const { getActiveOffers } = require("../utils/offerUtils");

// GET /api/offers - Active store offers
router.get("/", async (req, res) => {
  try {
    const offers = await getActiveOffers();
    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load offers.",
    });
  }
});

// GET /api/offers/referral - Active referral offer terms
router.get("/referral", async (req, res) => {
  try {
    const now = new Date();
    const referralOffer = await Offer.findOne({
      targetClass: "referral",
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    return res.status(200).json({
      success: true,
      referralOffer: referralOffer || {
        title: "Bespoke Sovereign Referral Protocol",
        referralConfig: {
          referrerAmount: 200,
          refereeAmount: 100,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load referral offer.",
    });
  }
});

module.exports = router;
