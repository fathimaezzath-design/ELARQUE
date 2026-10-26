const express = require("express");

const router = express.Router();

const {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  getProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");
// Register
router.post("/register", registerUser);

// Signup OTP
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/resend-reset-otp", resendResetOTP);
router.post("/reset-password", resetPassword);

// Profile & Referral Info
router.get("/profile", authMiddleware, getProfile);
router.get("/referral-info", authMiddleware, require("../controllers/authController").getReferralInfo);

module.exports = router;