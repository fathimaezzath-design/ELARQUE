const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  handleReturnRequest,
  getOrderStats,
} = require("../controllers/adminOrderController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// All admin order routes require administrative privileges
router.use(adminAuthMiddleware);

// GET /api/admin/orders/stats - Summary counts and revenue metrics
router.get("/stats", getOrderStats);

// GET /api/admin/orders - Filtered, paginated, searchable order list
router.get("/", getOrders);

// GET /api/admin/orders/:id - Single order details
router.get("/:id", getOrderById);

// PATCH /api/admin/orders/:id/status - Update order lifecycle status
router.patch("/:id/status", updateOrderStatus);

// PATCH /api/admin/orders/:id/return - Approve / Reject return requests
router.patch("/:id/return", handleReturnRequest);

module.exports = router;
