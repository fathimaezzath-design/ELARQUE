const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    referralCode: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    agreedToTerms: {
      type: Boolean,
      required: true,
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
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);