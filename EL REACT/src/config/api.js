/**
 * API and Environment Configuration for ELARQUE
 * Handles differences between local development and production environments.
 */

const isProduction =
  import.meta.env.PROD || import.meta.env.MODE === "production";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isProduction ? "/api" : "http://localhost:5000/api");

export const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_URL ||
  (isProduction ? "" : "http://localhost:5000");

/**
 * Safely resolves product image URLs across environments:
 * - Preserves existing absolute URLs (http://, https://, data:, blob:)
 * - In development, relative /uploads/... paths use http://localhost:5000
 * - In production, relative /uploads/... paths remain relative to the website domain
 *
 * @param {string} url - Image path or URL
 * @returns {string|null} Resolved image URL
 */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Preserve absolute URLs
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Ensure path starts with a leading slash
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // In production, keep relative to domain; in development, prepend local backend
  return isProduction ? cleanPath : `http://localhost:5000${cleanPath}`;
};

export default {
  API_BASE_URL,
  SERVER_BASE_URL,
  resolveImageUrl,
};
