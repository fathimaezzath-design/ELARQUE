import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/address",
});

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
