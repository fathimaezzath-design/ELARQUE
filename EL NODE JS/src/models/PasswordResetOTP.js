const mongoose = require("mongoose");

const passwordResetOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const resetOTP = await PasswordResetOTP.findOne({
      email: normalizedEmail,
    });

    if (!resetOTP) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found or expired.",
      });
    }

    if (resetOTP.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({
        _id: resetOTP._id,
      });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (resetOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // OTP is correct
    await PasswordResetOTP.deleteOne({
      _id: resetOTP._id,
    });

    // Create temporary reset token
    const resetToken = jwt.sign(
      {
        email: normalizedEmail,
        purpose: "password-reset",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Verification successful.",
      resetToken,
    });

  } catch (error) {
    console.error("VERIFY RESET OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the verification code.",
    });
  }
};

module.exports = mongoose.model(
  "PasswordResetOTP",
  passwordResetOTPSchema,
);