const express = require("express");

const router = express.Router();

const {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  googleLogin,
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
router.post("/google", googleLogin);

// Forgot password
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/resend-reset-otp", resendResetOTP);
router.post("/reset-password", resetPassword);

// Profile
router.get("/profile", authMiddleware, getProfile);

module.exports = router;