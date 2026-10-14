import axios from "axios";
import { attachCustomerInterceptors } from "./api";

const API = axios.create({
  baseURL: "http://localhost:5000/api/orders",
});

attachCustomerInterceptors(API);

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * POST /api/orders
 * Place a new order using the authenticated customer's cart and selected address.
 * @param {string} addressId  - MongoDB ObjectId of the selected delivery address
 * @param {string} paymentMethod - "COD" | "ONLINE" | "WALLET" (default: "COD")
 * @returns {Promise} - Resolves with { success, order, cartCleared, message }
 */
export const createOrder = (addressId, paymentMethod = "COD") => {
  return API.post(
    "/",
    { addressId, paymentMethod },
    { headers: authHeader() }
  );
};

export default { createOrder };
