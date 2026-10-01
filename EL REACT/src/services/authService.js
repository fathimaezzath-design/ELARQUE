import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

const PROFILE_API = axios.create({
  baseURL: "http://localhost:5000/api/profile",
});

// Add JWT automatically to profile requests
PROFILE_API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// =========================
// AUTH
// =========================

export const registerUser = (data) =>
  API.post("/register", data);

export const verifyOTP = (data) =>
  API.post("/verify-otp", data);

export const resendOTP = (data) =>
  API.post("/resend-otp", data);

export const loginUser = (data) =>
  API.post("/login", data);


// =========================
// FORGOT PASSWORD
// =========================

export const forgotPassword = (data) =>
  API.post("/forgot-password", data);

export const verifyResetOTP = (data) =>
  API.post("/verify-reset-otp", data);

export const resendResetOTP = (data) =>
  API.post("/resend-reset-otp", data);

export const resetPassword = (data) =>
  API.post("/reset-password", data);


// =========================
// PROFILE
// =========================

export const getProfile = () =>
  PROFILE_API.get("/");

export const updateProfile = (data) =>
  PROFILE_API.put("/", data);

export const updateProfileImage = (formData) =>
  PROFILE_API.put("/image", formData);


// =========================
// CHANGE EMAIL
// =========================

export const sendEmailChangeOTP = (newEmail) =>
  PROFILE_API.post("/email/send-otp", {
    newEmail,
  });

export const verifyEmailChangeOTP = (otp) =>
  PROFILE_API.post("/email/verify-otp", {
    otp,
  });


// CHANGE PASSWORD

export const changePassword = (data) =>
  PROFILE_API.put("/change-password", data);


export default API;