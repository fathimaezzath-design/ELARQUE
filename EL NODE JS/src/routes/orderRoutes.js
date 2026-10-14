const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { createOrder } = require("../controllers/orderController");

// All order endpoints require customer authentication
router.use(protect);

// POST /api/orders - Validate and initiate order creation foundation
router.post("/", createOrder);

module.exports = router;
