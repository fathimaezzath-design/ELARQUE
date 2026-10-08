const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/adminCategoryController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// POST /api/admin/categories - Create new category (Admin Protected)
router.post("/categories", adminAuthMiddleware, createCategory);

// GET /api/admin/categories - List categories with search & pagination (Admin Protected)
router.get("/categories", adminAuthMiddleware, getCategories);

// PATCH /api/admin/categories/:id - Edit category (Admin Protected)
router.patch("/categories/:id", adminAuthMiddleware, updateCategory);

// PATCH /api/admin/categories/:id/delete - Soft delete category (Admin Protected)
router.patch("/categories/:id/delete", adminAuthMiddleware, deleteCategory);

module.exports = router;

