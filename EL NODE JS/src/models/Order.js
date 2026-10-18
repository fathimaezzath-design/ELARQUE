const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// ITEM-LEVEL STATUSES
//   Active      – no cancellation or return
//   Cancelled   – customer cancelled this individual item
//   ReturnRequested – customer has requested a return for this item
//   Returned    – return approved by admin (set by admin, not customer)
// ─────────────────────────────────────────────────────────────────────────────

const ITEM_STATUSES = ["Active", "Cancelled", "ReturnRequested", "Returned"];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    productName: {
      type: String,
      required: true,
    },

    productImage: {
      type: String,
      default: "",
    },

    variant: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      size: { type: String, default: "" },
      color: { type: String, default: "" },
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
    },

    itemTotal: {
      type: Number,
      required: true,
    },

    // ── Per-item cancellation / return tracking ──────────────────────────────

    itemStatus: {
      type: String,
      enum: ITEM_STATUSES,
      default: "Active",
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnStatus: {
      type: String,
      enum: [
        "None",
        "Requested",
        "Pending",
        "Approved",
        "Picked Up",
        "Completed",
        "Refunded",
        "Rejected",
      ],
      default: "None",
    },

    returnRequestedAt: {
      type: Date,
    },

    returnAdminNote: {
      type: String,
      default: "",
      trim: true,
    },

    returnRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnCustomerMessage: {
      type: String,
      default: "",
      trim: true,
    },

    // Guard flag – set to true after stock is restored for this item.
    // Prevents double-restoration without MongoDB transactions.
    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must contain at least one item.",
      },
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      house: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "WALLET"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Placed",
    },

    subtotal: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },

    deliveredDate: {
      type: Date,
    },

    cancelledDate: {
      type: Date,
    },

    // ── Order-level cancellation / return ────────────────────────────────────

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    // Order-level return request (e.g. "Delivered" order return).
    returnStatus: {
      type: String,
      enum: [
        "None",
        "Requested",
        "Pending",
        "Approved",
        "Picked Up",
        "Completed",
        "Refunded",
        "Rejected",
      ],
      default: "None",
    },

    returnReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnRequestedAt: {
      type: Date,
    },

    returnAdminNote: {
      type: String,
      default: "",
      trim: true,
    },

    returnRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnCustomerMessage: {
      type: String,
      default: "",
      trim: true,
    },

    returnPickupScheduledDate: {
      type: Date,
    },

    returnPickedUpAt: {
      type: Date,
    },

    returnCompletedAt: {
      type: Date,
    },

    // Guard: true after ALL items' stock has been restored for this order.
    // Prevents double-restoration of full-order cancellations.
    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast user-scoped queries sorted by date
orderSchema.index({ user: 1, orderDate: -1 });

module.exports = mongoose.model("Order", orderSchema);
