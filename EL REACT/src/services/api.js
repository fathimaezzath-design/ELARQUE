import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const attachCustomerInterceptors = (instance) => {
  // Attach customer token automatically
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Catch 401 unauthorized responses
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        // Clear ONLY customer authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Avoid redirect loops if the user is already on an auth page or making a login request
        const authPaths = [
          "/login",
          "/signup",
          "/verify-otp",
          "/forgot-password",
          "/verify-reset-otp",
          "/reset-password",
        ];
        const currentPath = window.location.pathname;
        const isAuthPage = authPaths.some((p) => currentPath.startsWith(p));

        if (!isAuthPage) {
          window.location.href = "/login";
        }
      }
      // Note: We deliberately do NOT log out or redirect on 403 errors per requirements
      return Promise.reject(error);
    }
  );

  return instance;
};

const customerApi = axios.create({
  baseURL: BASE_URL,
});

attachCustomerInterceptors(customerApi);

export default customerApi;
