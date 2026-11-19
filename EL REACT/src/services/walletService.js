
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { attachCustomerInterceptors } from "./api";

const API = axios.create({
  baseURL: `${API_BASE_URL}/wallet`,
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
