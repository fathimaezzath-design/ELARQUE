const express = require("express");
const router = express.Router();
const {
  createProduct,
  uploadProductImages,
} = require("../controllers/adminProductController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const {
  productUploadMiddleware,
} = require("../middlewares/productUploadMiddleware");

// POST /api/admin/products/images - Upload multiple product images (Admin Protected)
router.post(
  "/images",
  adminAuthMiddleware,
  productUploadMiddleware,
  uploadProductImages
);
router.post(
  "/products/images",
  adminAuthMiddleware,
  productUploadMiddleware,
  uploadProductImages
);

// POST /api/admin/products - Create new product (Admin Protected)
router.post("/", adminAuthMiddleware, createProduct);
router.post("/products", adminAuthMiddleware, createProduct);

module.exports = router;

