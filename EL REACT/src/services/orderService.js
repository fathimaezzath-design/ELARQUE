import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/orders",
});

// Get authentication token
const authHeader = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =========================
   CREATE ORDER
========================= */

export const createOrder = (addressId, paymentMethod = "COD") => {
  return API.post(
    "/",
    { addressId, paymentMethod },
    { headers: authHeader() }
  );
};

/* =========================
   GET MY ORDERS
========================= */

export const getMyOrders = (search = "") => {
  const params = {};

  if (search.trim()) {
    params.search = search.trim();
  }

  return API.get("/", {
    headers: authHeader(),
    params,
  });
};

/* =========================
   GET ORDER DETAILS
========================= */

export const getOrderDetails = (orderId) => {
  return API.get(`/${orderId}`, {
    headers: authHeader(),
  });
};

/* =========================
   CANCEL FULL ORDER
========================= */

export const cancelOrder = (orderId, reason = "") => {
  return API.patch(
    `/${orderId}/cancel`,
    { reason },
    { headers: authHeader() }
  );
};

/* =========================
   CANCEL SINGLE ITEM
========================= */

export const cancelOrderItem = (orderId, itemId, reason = "") => {
  return API.patch(
    `/${orderId}/items/${itemId}/cancel`,
    { reason },
    { headers: authHeader() }
  );
};

/* =========================
   REQUEST ORDER RETURN
========================= */

export const requestOrderReturn = (orderId, reason) => {
  return API.patch(
    `/${orderId}/return`,
    { reason },
    { headers: authHeader() }
  );
};

/* =========================
   REQUEST ITEM RETURN
========================= */

export const requestItemReturn = (orderId, itemId, reason) => {
  return API.patch(
    `/${orderId}/items/${itemId}/return`,
    { reason },
    { headers: authHeader() }
  );
};

export default API;
