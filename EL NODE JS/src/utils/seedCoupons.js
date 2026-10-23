const Coupon = require("../models/Coupon");

const DEFAULT_COUPONS = [
  {
    code: "WINTER30",
    title: "RUNWAY F/W",
    categoryTag: "Seasonal",
    description: "Autumn / Winter runway salon privilege for cold-weather tailoring.",
    discountType: "percentage",
    discountValue: 30,
    maxDiscount: 500,
    minPurchase: 2500,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    usageLimit: 500,
    userUsageLimit: 1,
    isActive: true,
  },
  {
    code: "WELCOME10",
    title: "PREMIER INDULGENCE",
    categoryTag: "New Patrons",
    description: "Welcome privilege for first-time atelier client acquisitions.",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 250,
    minPurchase: 1500,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2027-01-15"),
    usageLimit: 1000,
    userUsageLimit: 1,
    isActive: true,
  },
  {
    code: "FESTIVE20",
    title: "SALON NOCTURNE",
    categoryTag: "Private Salon",
    description: "Private salon evening event concession on bespoke commissions.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 1000,
    minPurchase: 5000,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-11-05"),
    usageLimit: 300,
    userUsageLimit: 1,
    isActive: true,
  },
  {
    code: "NEWUSER15",
    title: "FIRST ACQUISITION",
    categoryTag: "New Patrons",
    description: "First curation privilege for verified registered fashion patrons.",
    discountType: "percentage",
    discountValue: 15,
    maxDiscount: 300,
    minPurchase: 2000,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2027-02-28"),
    usageLimit: 800,
    userUsageLimit: 1,
    isActive: true,
  },
  {
    code: "ELARQUE25",
    title: "VIP SIGNATURE TIER",
    categoryTag: "Private Salon",
    description: "Exclusive VIP signature allocation across luxury western apparel.",
    discountType: "percentage",
    discountValue: 25,
    maxDiscount: 750,
    minPurchase: 4000,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-20"),
    usageLimit: 250,
    userUsageLimit: 1,
    isActive: true,
  },
];

async function seedCoupons() {
  try {
    for (const couponData of DEFAULT_COUPONS) {
      await Coupon.findOneAndUpdate(
        { code: couponData.code },
        { $setOnInsert: couponData },
        { upsert: true, returnDocument: "after" }
      );
    }
  } catch (err) {
    console.error("COUPON SEEDING ERROR:", err.message);
  }
}

module.exports = seedCoupons;
