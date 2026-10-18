import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin/returns";

const getAuthHeaders = () => {
  const adminToken = localStorage.getItem("adminToken");
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
};

/**
 * Fetch list of return requests with filtering, search, sorting and pagination
 * @param {Object} params - { page, limit, status, search, sort }
 */
export const getReturnRequests = async (params = {}) => {
  const response = await axios.get(API_BASE_URL, {
    params,
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Fetch single return request dossier by ID
 * @param {string} id
 */
export const getReturnRequestById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Update return disposition status
 * @param {string} id
 * @param {Object} data - { status, adminNote, rejectionReason, customerMessage, notifyCustomer }
 */
export const updateReturnStatus = async (id, data) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/status`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Quick Approve / Reject action
 * @param {string} id
 * @param {Object} data - { action: "APPROVE" | "REJECT", rejectionReason, adminNote }
 */
export const quickReturnAction = async (id, data) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/action`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export default {
  getReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
  quickReturnAction,
};
