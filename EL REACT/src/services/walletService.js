import axios from "axios";
import { attachCustomerInterceptors } from "./api";

const API = axios.create({
  baseURL: "http://localhost:5000/api/wallet",
});

attachCustomerInterceptors(API);

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getWalletData = () => {
  return API.get("/", {
    headers: authHeader(),
  });
};

export const topupWallet = (payload) => {
  return API.post("/topup", payload, {
    headers: authHeader(),
  });
};

export const createTopupRazorpayOrder = (amount) => {
  return API.post(
    "/create-razorpay-topup",
    { amount },
    {
      headers: authHeader(),
    }
  );
};

export const verifyTopupPayment = (payload) => {
  return API.post("/verify-topup", payload, {
    headers: authHeader(),
  });
};
