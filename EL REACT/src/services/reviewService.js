import axios from "axios";
import { attachCustomerInterceptors } from "./api";

const API = axios.create({
  baseURL: "http://localhost:5000/api/reviews",
});

attachCustomerInterceptors(API);

/**
 * Fetch approved customer reviews and summary statistics for a product
 * @param {string} productId
 */
export const getProductReviews = (productId) => {
  return API.get(`/product/${productId}`);
};

/**
 * Submit a customer review for a product
 * @param {string} productId
 * @param {Object} reviewData - { rating, title, comment, impressions, size, fit }
 */
export const createProductReview = (productId, reviewData) => {
  return API.post(`/product/${productId}`, reviewData);
};

/**
 * Check if the currently authenticated customer can review this product
 * @param {string} productId
 */
export const checkReviewEligibility = (productId) => {
  return API.get(`/product/${productId}/eligibility`);
};

export default {
  getProductReviews,
  createProductReview,
  checkReviewEligibility,
};
