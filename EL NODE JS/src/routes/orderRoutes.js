const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");

const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  cancelOrderItem,
  requestOrderReturn,
  requestItemReturn,
} = require("../controllers/orderController");

// Create a new order
router.post("/", protect, createOrder);

// Get all orders for the authenticated user
router.get("/", protect, getMyOrders);

// Get a single order's details
router.get("/:id", protect, getOrderDetails);

// Cancel a full order
router.patch("/:id/cancel", protect, cancelOrder);

// Cancel a single item within an order
router.patch("/:id/items/:itemId/cancel", protect, cancelOrderItem);

// Request return for an entire order
router.patch("/:id/return", protect, requestOrderReturn);

// Request return for a single item
router.patch("/:id/items/:itemId/return", protect, requestItemReturn);

module.exports = router;
