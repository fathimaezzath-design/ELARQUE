import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/payment",
});

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Dynamically load Razorpay checkout script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* =========================================================================
   RAZORPAY GATEWAY
   ========================================================================= */

// Initialize a Razorpay checkout session on server
export const createRazorpayOrder = (addressId, couponCode = "") => {
  return API.post(
    "/razorpay/create-order",
    { addressId, couponCode },
    { headers: authHeader() }
  );
};

// Verify payment cryptographic signature & place order
export const verifyRazorpayPayment = (payload) => {
  return API.post(
    "/razorpay/verify",
    payload,
    { headers: authHeader() }
  );
};

/* =========================================================================
   PAYPAL GATEWAY (Multi-Gateway Add-On)
   ========================================================================= */

// Initialize PayPal order
export const createPayPalOrder = (addressId, couponCode = "") => {
  return API.post(
    "/paypal/create-order",
    { addressId, couponCode },
    { headers: authHeader() }
  );
};

// Capture PayPal payment
export const capturePayPalPayment = (payload) => {
  return API.post(
    "/paypal/capture",
    payload,
    { headers: authHeader() }
  );
};

export default {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayPalOrder,
  capturePayPalPayment,
};
