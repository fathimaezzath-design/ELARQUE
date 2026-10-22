const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayPalOrder,
  capturePayPalPayment,
} = require("../controllers/paymentController");

// Razorpay routes
router.post("/razorpay/create-order", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

// PayPal multi-gateway routes
router.post("/paypal/create-order", protect, createPayPalOrder);
router.post("/paypal/capture", protect, capturePayPalPayment);

module.exports = router;
