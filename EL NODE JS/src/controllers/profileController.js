const User = require("../models/User");
const Address = require("../models/Address");
const EmailChangeOTP = require("../models/EmailChangeOTP");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendEmailChangeOtpMail } = require("../services/otpService");

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;


// GET PROFILE

exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Retrieve default saved address for the authenticated user safely
    let savedAddress = null;
    try {
      savedAddress = await Address.findOne({ userId, isDefault: true }).lean();
      if (!savedAddress) {
        savedAddress = await Address.findOne({ userId }).sort({ createdAt: -1 }).lean();
      }
    } catch (addrErr) {
      console.warn("Unable to fetch address in getProfile:", addrErr.message);
    }

    return res.status(200).json({
      success: true,
      user,
      savedAddress: savedAddress || null,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
};


// UPDATE PROFILE

exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    const { fullName, phoneNumber, dateOfBirth, gender, address } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const updateFields = {};

    if (fullName !== undefined && String(fullName).trim()) {
      updateFields.fullName = String(fullName).trim();
    }

    if (phoneNumber !== undefined) {
      // Clean phone number to digits only (take last 10 digits for Indian standard)
      const cleanPhone = String(phoneNumber).replace(/\D/g, "").slice(-10);
      if (cleanPhone) {
        const userPhoneClean = (user.phoneNumber || "").replace(/\D/g, "").slice(-10);
        if (cleanPhone !== userPhoneClean) {
          const phoneExists = await User.findOne({
            phoneNumber: cleanPhone,
            _id: { $ne: user._id },
          });
          if (phoneExists) {
            return res.status(400).json({
              success: false,
              message: "This phone number is already linked to another account.",
            });
          }
        }
        updateFields.phoneNumber = cleanPhone;
      }
    }

    if (dateOfBirth !== undefined) {
      updateFields.dateOfBirth = dateOfBirth || "";
    }

    if (gender !== undefined) {
      updateFields.gender = gender || "";
    }

    // Preserve existing address if provided
    if (address && typeof address === "object") {
      updateFields.address = {
        street: address.street !== undefined ? address.street : user.address?.street,
        city: address.city !== undefined ? address.city : user.address?.city,
        state: address.state !== undefined ? address.state : user.address?.state,
        pincode: address.pincode !== undefined ? address.pincode : user.address?.pincode,
        country: address.country || user.address?.country || "India",
      };
    }

    // Use findByIdAndUpdate to reliably update fields in MongoDB without blocking on unrelated schema requirements
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { returnDocument: "after", runValidators: false }
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
      message: error?.message || "Unable to update profile.",
    });
  }
};


// UPDATE PROFILE IMAGE

exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const userId = getUserId(req);
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
      message: "Profile image updated successfully.",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("UPDATE PROFILE IMAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile image.",
    });
  }
};


// SEND EMAIL CHANGE OTP
// Requires Current Account Password Verification

exports.sendEmailChangeOTP = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !newEmail.trim()) {
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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Require and verify current password securely if the account uses password auth
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current account password is required to change your email.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }
    }

    // Prevent re-entering current email
    if (user.email && user.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "This is already your current email address.",
      });
    }

    // Ensure email is not registered to another account
    const existingAccount = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered to another account.",
      });
    }

    // Invalidate any existing OTPs for this user
    await EmailChangeOTP.deleteMany({ userId: user._id });

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailChangeOTP.create({
      userId: user._id,
      newEmail: normalizedEmail,
      otp,
      expiresAt,
    });

    await sendEmailChangeOtpMail(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("SEND EMAIL CHANGE OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email verification code. Please try again later.",
    });
  }
};


// VERIFY EMAIL CHANGE OTP

exports.verifyEmailChangeOTP = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
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

    if (record.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Re-check uniqueness right before committing
    const emailConflict = await User.findOne({
      email: record.newEmail,
      _id: { $ne: user._id },
    });

    if (emailConflict) {
      await EmailChangeOTP.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: "This email was recently claimed by another account.",
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


// CHANGE PASSWORD

exports.changePassword = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters.",
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least one uppercase letter.",
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least one number.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};
