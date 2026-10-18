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

    resendCount: {
      type: Number,
      default: 0,
    },

    lastResentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);