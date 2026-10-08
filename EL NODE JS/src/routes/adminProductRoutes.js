const express = require("express");
const router = express.Router();
const {
  createProduct,
  uploadProductImages,
  getProducts,
} = require("../controllers/adminProductController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const {
  productUploadMiddleware,
} = require("../middlewares/productUploadMiddleware");

// GET /api/admin/products - List products with search, pagination & populated category (Admin Protected)
router.get("/", adminAuthMiddleware, getProducts);
router.get("/products", adminAuthMiddleware, getProducts);

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

