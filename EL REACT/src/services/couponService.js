import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/coupons",
});

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch available coupons eligible for the user
export const getAvailableCoupons = () => {
  return API.get("/available", {
    headers: authHeader(),
  });
};

// Apply promotional code against order subtotal
export const applyCoupon = (code, subtotal) => {
  return API.post(
    "/apply",
    { code, subtotal },
    { headers: authHeader() }
  );
};

// Remove currently applied coupon
export const removeCoupon = () => {
  return API.post("/remove", {}, { headers: authHeader() });
};

export default {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon,
};
