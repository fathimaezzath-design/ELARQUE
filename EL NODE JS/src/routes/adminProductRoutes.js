const express = require("express");
const router = express.Router();
const { createProduct } = require("../controllers/adminProductController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// POST /api/admin/products - Create new product (Admin Protected)
router.post("/", adminAuthMiddleware, createProduct);
router.post("/products", adminAuthMiddleware, createProduct);

module.exports = router;
