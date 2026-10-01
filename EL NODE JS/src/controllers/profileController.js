const User = require("../models/User");
const EmailChangeOTP = require("../models/EmailChangeOTP");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  sendEmailChangeOtpMail,
} = require("../services/otpService");


// ======================================================
// GET PROFILE
// ======================================================

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
};


// ======================================================
// UPDATE PROFILE
// ======================================================

exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    // Check phone number belongs to another user
    const phoneExists = await User.findOne({
      phoneNumber,
      _id: { $ne: user._id },
    });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    user.fullName = fullName.trim();
    user.phoneNumber = phoneNumber;

    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (address) {
      user.address = {
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
    };
    }

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};


// ======================================================
// UPDATE PROFILE IMAGE
// ======================================================

exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.profileImage =
      "/uploads/users/" + req.file.filename;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully.",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE IMAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update profile image.",
    });
  }
};


// ======================================================
// SEND EMAIL CHANGE OTP
// ======================================================

exports.sendEmailChangeOTP = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email address is required.",
      });
    }

    const normalizedEmail =
      newEmail.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Check if another account already uses this email
    const emailExists = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    // Don't allow same email
    if (normalizedEmail === req.user.email) {
      return res.status(400).json({
        success: false,
        message:
          "This is already your current email address.",
      });
    }

    await EmailChangeOTP.deleteMany({
      userId: req.user._id,
    });

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await EmailChangeOTP.create({
      userId: req.user._id,
      newEmail: normalizedEmail,
      otp,
      expiresAt,
    });

    await sendEmailChangeOtpMail(
      normalizedEmail,
      otp
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your new email.",
    });
  } catch (error) {
    console.error(
      "SEND EMAIL CHANGE OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send email verification code.",
    });
  }
};


// ======================================================
// VERIFY EMAIL CHANGE OTP
// ======================================================

exports.verifyEmailChangeOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6-digit verification code.",
      });
    }

    const record = await EmailChangeOTP.findOne({
      userId: req.user._id,
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code not found or expired.",
      });
    }

    if (record.expiresAt < new Date()) {
      await EmailChangeOTP.deleteOne({
        _id: record._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired.",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid verification code.",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.email = record.newEmail;

    await user.save();

    await EmailChangeOTP.deleteOne({
      _id: record._id,
    });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully.",
      email: user.email,
    });
  } catch (error) {
    console.error(
      "VERIFY EMAIL CHANGE OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify email address.",
    });
  }
};


// ======================================================
// CHANGE PASSWORD
// ======================================================

exports.changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters.",
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least one uppercase letter.",
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least one number.",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least one special symbol.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change password.",
    });
  }
};

exports.sendEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email address is required.",
      });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Get current user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if same email
    if (user.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "This is already your current email address.",
      });
    }

    // Check if email already belongs to another account
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    // Remove previous OTP
    await EmailChangeOTP.deleteMany({
      userId,
    });

    // Generate 6 digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // OTP valid for 2 minutes
    const expiresAt = new Date(
      Date.now() + 2 * 60 * 1000
    );

    await EmailChangeOTP.create({
      userId,
      newEmail: normalizedEmail,
      otp,
      expiresAt,
    });

    // Send OTP
    await sendEmailChangeOtpMail(
      normalizedEmail,
      otp
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your new email.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error(
      "SEND EMAIL CHANGE OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code.",
    });
  }
};


exports.verifyEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const emailChangeOTP =
      await EmailChangeOTP.findOne({
        userId,
      });

    if (!emailChangeOTP) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code expired or not found.",
      });
    }

    // Check expiry
    if (
      emailChangeOTP.expiresAt < new Date()
    ) {
      await EmailChangeOTP.deleteOne({
        _id: emailChangeOTP._id,
      });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired.",
      });
    }

    // Check OTP
    if (emailChangeOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // Make sure email is still available
    const existingUser = await User.findOne({
      email: emailChangeOTP.newEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      await EmailChangeOTP.deleteOne({
        _id: emailChangeOTP._id,
      });

      return res.status(409).json({
        success: false,
        message:
          "This email address is already registered.",
      });
    }

    // Update user email
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.email = emailChangeOTP.newEmail;

    await user.save();

    // Delete OTP
    await EmailChangeOTP.deleteOne({
      _id: emailChangeOTP._id,
    });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully.",
      email: user.email,
    });
  } catch (error) {
    console.error(
      "VERIFY EMAIL CHANGE OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify email.",
    });
  }
};

exports.sendEmailChangeOTP = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email address is required.",
      });
    }

    const normalizedEmail =
      newEmail.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Don't allow the same email
    const currentUser = await User.findById(
      req.user.id
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (currentUser.email === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "This is already your current email address.",
      });
    }

    // Check if new email already belongs to another user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "This email address is already registered.",
      });
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Save OTP
    await EmailChangeOTP.deleteMany({
      userId: req.user.id,
    });

    await EmailChangeOTP.create({
      userId: req.user.id,
      newEmail: normalizedEmail,
      otp,
      expiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ),
    });

    // Send email
    await sendEmailChangeOtpMail(
      normalizedEmail,
      otp
    );

    return res.status(200).json({
      success: true,
      message:
        "Verification code sent to your new email.",
      email: normalizedEmail,
    });

  } catch (error) {
    console.error(
      "SEND EMAIL CHANGE OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code.",
    });
  }
};


// ==========================================
// GET PROFILE
// ==========================================

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile.",
    });
  }
};


// ==========================================
// UPDATE PROFILE
// ==========================================

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.fullName = fullName;
    user.phoneNumber = phoneNumber;
    user.dateOfBirth = dateOfBirth || null;
    user.gender = gender || "";

    user.address = {
      street: address?.street || "",
      city: address?.city || "",
      state: address?.state || "",
      pincode: address?.pincode || "",
    };

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};


// CHANGE PASSWORD

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Check fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    // Check new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters.",
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Prevent same password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.log("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};

