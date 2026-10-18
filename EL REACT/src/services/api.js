/**
 * Attaches request and response interceptors to an axios instance
 * for customer authentication handling.
 */
export const attachCustomerInterceptors = (axiosInstance) => {
  if (!axiosInstance || !axiosInstance.interceptors) return;

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token && (!config.headers || !config.headers.Authorization)) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/admin")
        ) {
          // Token expired, invalid, or account suspended
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      return Promise.reject(error);
    }
  );
};

export default {
  attachCustomerInterceptors,
};
