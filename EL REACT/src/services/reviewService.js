
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { attachCustomerInterceptors } from "./api";

const API = axios.create({
  baseURL: `${API_BASE_URL}/reviews`,
});

attachCustomerInterceptors(API);

/**
 * Fetch approved customer reviews and summary statistics for a product
 */
export const getProductReviews = (productId) => {
  return API.get(`/product/${productId}`);
};

/**
 * Submit a customer review for a product
 */
export const createProductReview = (productId, reviewData) => {
  return API.post(`/product/${productId}`, reviewData);
};

/**
 * Check if the currently authenticated customer can review this product
 */
export const checkReviewEligibility = (productId) => {
  return API.get(`/product/${productId}/eligibility`);
};

export default {
  getProductReviews,
  createProductReview,
  checkReviewEligibility,
};
