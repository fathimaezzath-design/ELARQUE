import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = axios.create({
  baseURL: `${API_BASE_URL}/products`,
});

/**
 * Fetch customer-visible products with search, filters, sorting, and pagination
 * @param {Object} params - Query parameters (search, category, minPrice, maxPrice, size, brand, sort, page, limit)
 */
export const getProducts = (params = {}) => {
  return API.get("/", { params });
};

/**
 * Fetch dynamic facet categories, counts, price ranges, sizes, and brands
 */
export const getProductFacets = () => {
  return API.get("/facets");
};

/**
 * Fetch single product details by MongoDB ID
 * @param {string} id - Product ID
 */
export const getProductById = (id) => {
  return API.get(`/${id}`);
};

export default {
  getProducts,
  getProductFacets,
  getProductById,
};
