const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getCart,
  addToCart,
  updateItemQuantity,
  removeItem,
  clearCart,
} = require("../controllers/cartController");

// All cart endpoints require customer authentication
router.use(protect);

// GET /api/cart - Get current customer's cart
router.get("/", getCart);

// POST /api/cart - Add item/variant to cart
router.post("/", addToCart);

// PATCH /api/cart/items/:itemId - Update item quantity
router.patch("/items/:itemId", updateItemQuantity);

// DELETE /api/cart/items/:itemId - Remove single item from cart
router.delete("/items/:itemId", removeItem);

// DELETE /api/cart - Clear entire cart
router.delete("/", clearCart);

module.exports = router;
