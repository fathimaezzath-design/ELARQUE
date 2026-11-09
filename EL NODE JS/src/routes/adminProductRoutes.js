const express = require("express");
const router = express.Router();
const {
  createProduct,
  uploadProductImages,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
} = require("../controllers/adminProductController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const {
  productUploadMiddleware,
} = require("../middlewares/productUploadMiddleware");

// GET /api/admin/products - List products with search, pagination & populated category (Admin Protected)
router.get("/", adminAuthMiddleware, getProducts);
router.get("/products", adminAuthMiddleware, getProducts);

// GET /api/admin/products/:id - Retrieve single product by MongoDB ID (Admin Protected)
router.get("/:id", adminAuthMiddleware, (req, res, next) => {
  if (req.baseUrl === "/api/admin") {
    return next();
  }
  return getProductById(req, res, next);
});
router.get("/products/:id", adminAuthMiddleware, getProductById);

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

// POST /api/admin/products/batch-delete - Batch delete products (Admin Protected)
router.post("/batch-delete", adminAuthMiddleware, batchDeleteProducts);
router.post("/products/batch-delete", adminAuthMiddleware, batchDeleteProducts);

// POST /api/admin/products - Create new product (Admin Protected)
router.post("/", adminAuthMiddleware, createProduct);
router.post("/products", adminAuthMiddleware, createProduct);

// PATCH /api/admin/products/:id - Update product fields by MongoDB ID (Admin Protected)
router.patch("/:id", adminAuthMiddleware, (req, res, next) => {
  if (req.baseUrl === "/api/admin") {
    return next();
  }
  return updateProduct(req, res, next);
});
router.patch("/products/:id", adminAuthMiddleware, updateProduct);

// DELETE /api/admin/products/:id - Soft delete product by MongoDB ID (Admin Protected)
router.delete("/:id", adminAuthMiddleware, (req, res, next) => {
  if (req.baseUrl === "/api/admin") {
    return next();
  }
  return deleteProduct(req, res, next);
});
router.delete("/products/:id", adminAuthMiddleware, deleteProduct);

module.exports = router;

