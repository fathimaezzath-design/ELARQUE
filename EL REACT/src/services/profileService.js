import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/profile",
});

// Get authentication token
const authHeader = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =========================
   GET PROFILE
========================= */

export const getProfile = () => {
  return API.get("/", {
    headers: authHeader(),
  });
};

/* =========================
   UPDATE PROFILE
========================= */

export const updateProfile = (data) => {
  return API.put("/", data, {
    headers: authHeader(),
  });
};

/* =========================
   UPDATE PROFILE IMAGE
========================= */

export const updateProfileImage = (file) => {
  const formData = new FormData();

  formData.append("profileImage", file);

  return API.put("/image", formData, {
    headers: {
      ...authHeader(),
      "Content-Type": "multipart/form-data",
    },
  });
};

/* =========================
   CHANGE PASSWORD
========================= */

export const changePassword = (data) => {
  return API.put("/change-password", data, {
    headers: authHeader(),
  });
};

/* =========================
   EMAIL CHANGE
========================= */

export const sendEmailChangeOTP = (newEmail) => {
  return API.post(
    "/email/send-otp",
    {
      newEmail,
    },
    {
      headers: authHeader(),
    }
  );
};

export const verifyEmailChangeOTP = (otp) => {
  return API.post(
    "/email/verify-otp",
    {
      otp,
    },
    {
      headers: authHeader(),
    }
  );
};

export default API;