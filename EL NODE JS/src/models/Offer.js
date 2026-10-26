const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    offerType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    targetClass: {
      type: String,
      enum: ["product", "category", "referral"],
      required: true,
    },
    targetProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    targetCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    discountCalculation: {
      type: String,
      enum: ["percentage", "flat", "bogo"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "scheduled", "expired"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    referralConfig: {
      referrerAmount: {
        type: Number,
        default: 200,
      },
      refereeAmount: {
        type: Number,
        default: 100,
      },
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual helper to compute real-time active status based on dates
offerSchema.methods.getComputedStatus = function () {
  if (!this.isActive) return "draft";
  const now = new Date();
  if (this.startDate > now) return "scheduled";
  if (this.endDate < now) return "expired";
  return "active";
};

module.exports = mongoose.model("Offer", offerSchema);
