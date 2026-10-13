const User = require("../models/User");
const EmailChangeOTP = require("../models/EmailChangeOTP");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmailChangeOtpMail } = require("../services/otpService");

// ======================================================
// GET PROFILE
// ======================================================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Include helper flags for frontend security flows without exposing sensitive data
    const userWithAuthMeta = {
      ...user.toObject(),
      hasPassword: Boolean(user.password || (await User.findById(userId).select("password")).password),
      isGoogleUser: Boolean(user.googleId),
    };

    return res.status(200).json({
      success: true,
      user: userWithAuthMeta,
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
    const userId = req.user._id || req.user.id || req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
    } = req.body;

    // 1. Full Name Validation
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        field: "fullName",
        message: "Full name is required.",
      });
    }

    const trimmedFullName = fullName.trim();
    if (trimmedFullName.length < 2) {
      return res.status(400).json({
        success: false,
        field: "fullName",
        message: "Full name must contain at least 2 characters.",
      });
    }
    if (trimmedFullName.length > 80) {
      return res.status(400).json({
        success: false,
        field: "fullName",
        message: "Full name cannot exceed 80 characters.",
      });
    }

    // 2. Phone Number Validation
    // Non-Google users must have a phone number; Google users can optionally supply one
    const cleanPhone = typeof phoneNumber === "string" ? phoneNumber.replace(/\s|\+91/g, "").trim() : "";
    const isGoogleAccountWithoutPhone = user.googleId && !cleanPhone && !user.phoneNumber;

    if (!isGoogleAccountWithoutPhone) {
      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          field: "phoneNumber",
          message: "Phone number is required.",
        });
      }

      if (!/^[0-9]{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          field: "phoneNumber",
          message: "Phone number must contain exactly 10 digits.",
        });
      }

      // Check if phone number is registered by another user
      const phoneExists = await User.findOne({
        phoneNumber: cleanPhone,
        _id: { $ne: user._id },
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          field: "phoneNumber",
          message: "This phone number is already registered to another account.",
        });
      }

      user.phoneNumber = cleanPhone;
    }

    // 3. Date of Birth Validation
    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({
          success: false,
          field: "dateOfBirth",
          message: "Invalid date of birth format.",
        });
      }
      if (dobDate > new Date()) {
        return res.status(400).json({
          success: false,
          field: "dateOfBirth",
          message: "Date of birth cannot be in the future.",
        });
      }
      user.dateOfBirth = dateOfBirth;
    } else if (dateOfBirth === "") {
      user.dateOfBirth = "";
    }

    // 4. Gender Validation
    if (gender !== undefined) {
      const allowedGenders = ["", "Male", "Female", "Other", "Prefer not to say"];
      if (typeof gender === "string" && (allowedGenders.includes(gender) || gender.length <= 30)) {
        user.gender = gender;
      } else {
        return res.status(400).json({
          success: false,
          field: "gender",
          message: "Please select a valid gender option.",
        });
      }
    }

    // 5. Address Validation
    if (address && typeof address === "object") {
      const street = typeof address.street === "string" ? address.street.trim() : "";
      const city = typeof address.city === "string" ? address.city.trim() : "";
      const state = typeof address.state === "string" ? address.state.trim() : "";
      const pincode = typeof address.pincode === "string" ? address.pincode.trim() : "";
      const country = typeof address.country === "string" ? address.country.trim() : "India";

      if (pincode && !/^[0-9]{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          field: "pincode",
          message: "Pincode must contain exactly 6 digits.",
        });
      }

      user.address = {
        street: street.slice(0, 150),
        city: city.slice(0, 60),
        state: state.slice(0, 60),
        pincode: pincode.slice(0, 10),
        country: country || "India",
      };
    }

    user.fullName = trimmedFullName;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile. Please try again.",
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
        message: "Please select an image file to upload.",
      });
    }

    const userId = req.user._id || req.user.id || req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.profileImage = "/uploads/users/" + req.file.filename;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("UPDATE PROFILE IMAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile photo.",
    });
  }
};

// ======================================================
// SEND EMAIL CHANGE OTP (WITH PASSWORD VERIFICATION)
// ======================================================
exports.sendEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || typeof newEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "New email address is required.",
      });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (currentUser.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "This is already your current registered email address.",
      });
    }

    // Check if new email already belongs to another registered account
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: currentUser._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered to another account.",
      });
    }

    // Password verification:
    // If the account has a local password, require current password before changing email
    const hasLocalPassword = Boolean(currentUser.password);

    if (hasLocalPassword) {
      // Check if an unexpired OTP is already pending for this user and newEmail (resend case)
      const existingPendingOTP = await EmailChangeOTP.findOne({
        userId: currentUser._id,
        newEmail: normalizedEmail,
        expiresAt: { $gt: new Date() },
      });

      // If NOT an active resend for the exact same pending newEmail, password must be verified
      if (!existingPendingOTP) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: "Current password is required to change your email address.",
          });
        }

        const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect.",
          });
        }
      }
    }
    // If user has NO local password (Google authenticated account), allow requesting OTP
    // because the user is already authenticated via their active Google session.

    // Remove existing OTPs for this user
    await EmailChangeOTP.deleteMany({ userId: currentUser._id });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await EmailChangeOTP.create({
      userId: currentUser._id,
      newEmail: normalizedEmail,
      otp,
      expiresAt,
    });

    await sendEmailChangeOtpMail(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your new email address.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("SEND EMAIL CHANGE OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send verification code. Please try again.",
    });
  }
};

// ======================================================
// VERIFY EMAIL CHANGE OTP
// ======================================================
exports.verifyEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
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
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const record = await EmailChangeOTP.findOne({ userId });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found or expired. Please request a new one.",
      });
    }

    if (record.expiresAt < new Date()) {
      await EmailChangeOTP.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }

    // Double-check email is not taken in the interim
    const existingUser = await User.findOne({
      email: record.newEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      await EmailChangeOTP.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: "This email address is already registered to another account.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.email = record.newEmail;
    await user.save();

    await EmailChangeOTP.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully.",
      email: user.email,
    });
  } catch (error) {
    console.error("VERIFY EMAIL CHANGE OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify email address.",
    });
  }
};

// ======================================================
// CHANGE / SET PASSWORD
// ======================================================
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const hasLocalPassword = Boolean(user.password);

    // If account has an existing password, current password is strictly required and verified
    if (hasLocalPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          field: "currentPassword",
          message: "Current password is required.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          field: "currentPassword",
          message: "Current password is incorrect.",
        });
      }
    }

    // Validate new password fields
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        field: "newPassword",
        message: "New password is required.",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        field: "confirmPassword",
        message: "Please confirm your new password.",
      });
    }

    // Password strength rules
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        field: "newPassword",
        message: "New password must contain at least 8 characters.",
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        field: "newPassword",
        message: "New password must contain at least one uppercase letter.",
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        field: "newPassword",
        message: "New password must contain at least one number.",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        field: "newPassword",
        message: "New password must contain at least one special symbol (!@#$%^&*).",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        field: "confirmPassword",
        message: "New passwords do not match.",
      });
    }

    if (hasLocalPassword) {
      const samePassword = await bcrypt.compare(newPassword, user.password);
      if (samePassword) {
        return res.status(400).json({
          success: false,
          field: "newPassword",
          message: "New password must be different from your current password.",
        });
      }
    }

    // Hash and update password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: hasLocalPassword
        ? "Password changed successfully."
        : "Password created successfully for your account.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update password. Please try again.",
    });
  }
};
