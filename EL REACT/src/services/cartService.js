import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/cart",
});

/**
 * Retrieve authorization headers with customer Bearer JWT
 */
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET /api/cart
 * Fetch the authenticated customer's cart
 */
export const getCart = () => {
  return API.get("/", { headers: authHeader() });
};

/**
 * POST /api/cart
 * Add an item/variant to the cart
 * @param {string} productId
 * @param {string} variantId
 * @param {number} quantity
 */
export const addToCart = (productId, variantId, quantity = 1) => {
  return API.post(
    "/",
    { productId, variantId, quantity },
    { headers: authHeader() }
  );
};

/**
 * PATCH /api/cart/items/:itemId
 * Update quantity for a specific cart item
 * @param {string} itemId
 * @param {number} quantity
 */
export const updateItemQuantity = (itemId, quantity) => {
  return API.patch(
    `/items/${itemId}`,
    { quantity },
    { headers: authHeader() }
  );
};

/**
 * DELETE /api/cart/items/:itemId
 * Remove an item from the cart
 * @param {string} itemId
 */
export const removeItem = (itemId) => {
  return API.delete(`/items/${itemId}`, { headers: authHeader() });
};

/**
 * DELETE /api/cart
 * Clear all items from the cart
 */
export const clearCart = () => {
  return API.delete("/", { headers: authHeader() });
};

export default {
  getCart,
  addToCart,
  updateItemQuantity,
  removeItem,
  clearCart,
};
