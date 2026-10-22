const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon,
} = require("../controllers/couponController");

// Available coupons for the authenticated user
router.get("/available", protect, getAvailableCoupons);

// Apply a coupon
router.post("/apply", protect, applyCoupon);

// Remove a coupon
router.post("/remove", protect, removeCoupon);

module.exports = router;
