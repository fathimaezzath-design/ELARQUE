require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/Order");

async function seedReturns() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for returns seeding");

    // Order 1: Pending Return (EL-20261018-00D474)
    await Order.findOneAndUpdate(
      { orderNumber: "EL-20261018-00D474" },
      {
        $set: {
          returnStatus: "Requested",
          returnReason: "Size Misfit — Sleeves taper slightly too narrow through forearm",
          returnRequestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          "items.0.returnStatus": "Requested",
          "items.0.itemStatus": "ReturnRequested",
          "items.0.returnReason": "Size Misfit — Sleeves taper slightly too narrow through forearm",
          "items.0.returnRequestedAt": new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      }
    );
    console.log("Order 1 (EL-20261018-00D474) updated to Requested/Pending");

    // Order 2: Approved Return (EL-20261016-82F9B3)
    await Order.findOneAndUpdate(
      { orderNumber: "EL-20261016-82F9B3" },
      {
        $set: {
          returnStatus: "Approved",
          returnReason: "Color variance from lookbook — Slightly more champagne gold than anticipated under gallery lighting",
          returnRequestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          returnAdminNote: "Patron concierge confirmed DHL Express pickup scheduled. Garment must retain intact atelier security seal for instant vault reversal.",
          "items.0.returnStatus": "Approved",
          "items.0.itemStatus": "Returned",
          "items.0.returnReason": "Color variance from lookbook — Slightly more champagne gold than anticipated under gallery lighting",
          "items.0.returnAdminNote": "Patron concierge confirmed DHL Express pickup scheduled. Garment must retain intact atelier security seal for instant vault reversal.",
          "items.0.returnRequestedAt": new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }
    );
    console.log("Order 2 (EL-20261016-82F9B3) updated to Approved");

    // Order 3: Rejected Return (EL-20261015-7CEC6B)
    await Order.findOneAndUpdate(
      { orderNumber: "EL-20261015-7CEC6B" },
      {
        $set: {
          returnStatus: "Rejected",
          returnReason: "Wardrobe policy violation — Security ribbon detached",
          returnRejectionReason: "Item returned past 14-day atelier inspection window with security ribbon detached.",
          returnRequestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          "items.0.productName": "Tailored Velvet Frontier Jacket",
          "items.0.price": 8200,
          "items.0.itemTotal": 8200,
          "items.0.quantity": 1,
          "items.0.returnStatus": "Rejected",
          "items.0.itemStatus": "Active",
          "items.0.returnReason": "Wardrobe policy violation — Security ribbon detached",
          "items.0.returnRejectionReason": "Item returned past 14-day atelier inspection window with security ribbon detached.",
          "items.0.returnRequestedAt": new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      }
    );
    console.log("Order 3 (EL-20261015-7CEC6B) updated to Rejected");

    // Order 4: Completed / Refunded Return (EL-20261015-9BDE6A)
    await Order.findOneAndUpdate(
      { orderNumber: "EL-20261015-9BDE6A" },
      {
        $set: {
          returnStatus: "Completed",
          returnReason: "Fit preference — Exchange processed via atelier exchange concierge",
          returnRequestedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
          returnCompletedAt: new Date(),
          paymentStatus: "Refunded",
          "items.0.productName": "Architectural Wool Crepe Coat",
          "items.0.price": 7499,
          "items.0.itemTotal": 7499,
          "items.0.quantity": 1,
          "items.0.returnStatus": "Completed",
          "items.0.itemStatus": "Returned",
          "items.0.returnReason": "Fit preference — Exchange processed via atelier exchange concierge",
          "items.0.returnRequestedAt": new Date(Date.now() - 72 * 60 * 60 * 1000),
        },
      }
    );
    console.log("Order 4 (EL-20261015-9BDE6A) updated to Completed/Refunded");

    console.log("All returns seeded cleanly!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedReturns();
