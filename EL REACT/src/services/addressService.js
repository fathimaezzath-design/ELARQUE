import axios from "axios";
import { attachCustomerInterceptors } from "./api";
import { API_BASE_URL } from "../config/api";

const API = axios.create({
  baseURL: `${API_BASE_URL}/address`,
});

attachCustomerInterceptors(API);

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAddresses = () => {
  return API.get("/", {
    headers: authHeader(),
  });
};

export const addAddress = (data) => {
  return API.post("/", data, {
    headers: authHeader(),
  });
};

export const updateAddress = (id, data) => {
  return API.put(`/${id}`, data, {
    headers: authHeader(),
  });
};

export const deleteAddress = (id) => {
  return API.delete(`/${id}`, {
    headers: authHeader(),
  });
};

export const setDefaultAddress = (id) => {
  return API.patch(`/${id}/default`, {}, {
    headers: authHeader(),
  });
};

export default {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
