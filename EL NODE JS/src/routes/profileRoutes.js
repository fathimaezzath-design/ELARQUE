const express = require("express");

const router = express.Router();

const profileController = require("../controllers/profileController");

const authMiddleware = require("../middlewares/authMiddleware");

const upload = require("../middlewares/uploadMiddleware");

// GET PROFILE
router.get(
  "/",
  authMiddleware,
  profileController.getProfile
);

// UPDATE PROFILE
router.put(
  "/",
  authMiddleware,
  profileController.updateProfile
);

// UPDATE PROFILE IMAGE
router.put(
  "/image",
  authMiddleware,
  upload.single("profileImage"),
  profileController.updateProfileImage
);

// SEND EMAIL CHANGE OTP
router.post(
  "/email/send-otp",
  authMiddleware,
  profileController.sendEmailChangeOTP
);

// VERIFY EMAIL CHANGE OTP
router.post(
  "/email/verify-otp",
  authMiddleware,
  profileController.verifyEmailChangeOTP
);

// CHANGE PASSWORD
router.put(
  "/change-password",
  authMiddleware,
  profileController.changePassword
);

router.post(
  "/email/send-otp",
  authMiddleware,
  profileController.sendEmailChangeOTP
);

router.post(
  "/email/verify-otp",
  authMiddleware,
  profileController.verifyEmailChangeOTP
);

module.exports = router;