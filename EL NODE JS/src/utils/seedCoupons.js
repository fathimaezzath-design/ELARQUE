const Coupon = require("../models/Coupon");

const DEFAULT_COUPONS = [
  {
    code: "ATELIER10",
    description: "Enjoy 10% privilege discount on all handcrafted atelier pieces.",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 1500,
    minPurchase: 1000,
    startDate: new Date("2025-01-01"),
    expiryDate: new Date("2028-12-31"),
    usageLimit: 5000,
    userUsageLimit: 5,
    isActive: true,
  },
  {
    code: "LAVISH20",
    description: "20% salon privilege on haute commissions exceeding ₹4,000.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 3000,
    minPurchase: 4000,
    startDate: new Date("2025-01-01"),
    expiryDate: new Date("2028-12-31"),
    usageLimit: 3000,
    userUsageLimit: 3,
    isActive: true,
  },
  {
    code: "WELCOME500",
    description: "Flat ₹500 off on your bespoke curations above ₹2,000.",
    discountType: "fixed",
    discountValue: 500,
    maxDiscount: 500,
    minPurchase: 2000,
    startDate: new Date("2025-01-01"),
    expiryDate: new Date("2028-12-31"),
    usageLimit: 10000,
    userUsageLimit: 2,
    isActive: true,
  },
  {
    code: "PRIVILEGE30",
    description: "Exclusive 30% discount on orders of ₹7,500 or higher.",
    discountType: "percentage",
    discountValue: 30,
    maxDiscount: 4500,
    minPurchase: 7500,
    startDate: new Date("2025-01-01"),
    expiryDate: new Date("2028-12-31"),
    usageLimit: 2000,
    userUsageLimit: 2,
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
