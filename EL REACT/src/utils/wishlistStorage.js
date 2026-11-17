import { getProductById } from "../services/productService";

// Shared legacy storage key for backward compatibility
export const LEGACY_STORAGE_KEY = "elarque_session_wishlist";

/**
 * Retrieve current authenticated user object from localStorage
 */
export const getActiveUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Determine storage key scoped to active user:
 * - Logged-in user: `elarque_wishlist_<userId>`
 * - Guest visitor: `elarque_wishlist_guest`
 */
export const getWishlistStorageKey = () => {
  const user = getActiveUser();
  const userId =
    user?.id ||
    user?._id ||
    user?._doc?._id ||
    (user?.email ? encodeURIComponent(user.email) : null);

  if (userId) {
    return `elarque_wishlist_${userId}`;
  }
  return "elarque_wishlist_guest";
};

/**
 * Normalizes an array of product IDs into unique, non-empty string IDs
 */
export const normalizeWishlistIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  const normalized = ids
    .map((item) => {
      if (!item) return "";
      if (typeof item === "object") {
        return item.id || item._id ? String(item.id || item._id).trim() : "";
      }
      return String(item).trim();
    })
    .filter((id) => id.length > 0 && id !== "null" && id !== "undefined");

  return Array.from(new Set(normalized));
};

/**
 * Safely parse JSON array from localStorage
 */
const safeParseIds = (raw) => {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeWishlistIds(parsed);
  } catch {
    return [];
  }
};

/**
 * Read unique stored wishlist IDs for current user session.
 * Automatically migrates existing legacy data if scoped key is not yet set.
 */
export const getStoredWishlistIds = () => {
  try {
    const key = getWishlistStorageKey();
    const saved = localStorage.getItem(key);

    if (saved !== null) {
      return safeParseIds(saved);
    }

    // Migration fallback: if scoped key doesn't exist, check legacy storage key
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      const parsedLegacy = safeParseIds(legacy);
      localStorage.setItem(key, JSON.stringify(parsedLegacy));
      return parsedLegacy;
    }

    return [];
  } catch {
    return [];
  }
};

/**
 * Get count of unique products in current user's wishlist
 */
export const getStoredWishlistCount = () => {
  return getStoredWishlistIds().length;
};

/**
 * Dispatch cross-component and window events to update all UI counters immediately
 */
const notifyWishlistUpdated = (uniqueIds) => {
  try {
    const count = uniqueIds.length;
    window.dispatchEvent(
      new CustomEvent("elarque_wishlist_updated", {
        detail: { ids: uniqueIds, count },
      })
    );
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to broadcast wishlist update:", err);
  }
};

/**
 * Persist unique wishlist IDs to storage and broadcast change
 */
export const saveStoredWishlistIds = (ids) => {
  const uniqueIds = normalizeWishlistIds(ids);
  const key = getWishlistStorageKey();

  try {
    localStorage.setItem(key, JSON.stringify(uniqueIds));
    // Mirror to legacy key for active session compatibility
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(uniqueIds));
  } catch (err) {
    console.error("Failed to save wishlist IDs to localStorage:", err);
  }

  notifyWishlistUpdated(uniqueIds);
  return uniqueIds;
};

/**
 * Check if a product is in the current user's wishlist
 */
export const isProductInWishlist = (productId) => {
  if (!productId) return false;
  const targetId =
    typeof productId === "object"
      ? String(productId.id || productId._id || "").trim()
      : String(productId).trim();
  if (!targetId) return false;
  const ids = getStoredWishlistIds();
  return ids.includes(targetId);
};

/**
 * Add a product to the current wishlist
 */
export const addToWishlist = (productId) => {
  if (!productId) return getStoredWishlistIds();
  const targetId =
    typeof productId === "object"
      ? String(productId.id || productId._id || "").trim()
      : String(productId).trim();
  if (!targetId) return getStoredWishlistIds();

  const current = getStoredWishlistIds();
  if (!current.includes(targetId)) {
    const updated = [...current, targetId];
    return saveStoredWishlistIds(updated);
  }
  return current;
};

/**
 * Remove a product from the current wishlist
 */
export const removeFromWishlist = (productId) => {
  if (!productId) return getStoredWishlistIds();
  const targetId =
    typeof productId === "object"
      ? String(productId.id || productId._id || "").trim()
      : String(productId).trim();
  if (!targetId) return getStoredWishlistIds();

  const current = getStoredWishlistIds();
  const updated = current.filter((id) => id !== targetId);
  return saveStoredWishlistIds(updated);
};

/**
 * Toggle a product in the current wishlist
 * @returns {{ isWishlisted: boolean, ids: string[], count: number }}
 */
export const toggleWishlist = (productId) => {
  if (!productId) {
    const ids = getStoredWishlistIds();
    return { isWishlisted: false, ids, count: ids.length };
  }

  const targetId =
    typeof productId === "object"
      ? String(productId.id || productId._id || "").trim()
      : String(productId).trim();
  if (!targetId) {
    const ids = getStoredWishlistIds();
    return { isWishlisted: false, ids, count: ids.length };
  }

  const current = getStoredWishlistIds();
  const exists = current.includes(targetId);
  let updated;
  if (exists) {
    updated = current.filter((id) => id !== targetId);
  } else {
    updated = [...current, targetId];
  }

  saveStoredWishlistIds(updated);
  return {
    isWishlisted: !exists,
    ids: updated,
    count: updated.length,
  };
};

/**
 * Asynchronously validates stored wishlist IDs against live product catalog.
 * Prunes any deleted, inactive, or non-existent products so badge count
 * matches the exact count of displayable products on the Wishlist page.
 */
let inFlightValidation = null;

export const validateWishlist = async () => {
  if (inFlightValidation) return inFlightValidation;

  inFlightValidation = (async () => {
    const rawIds = getStoredWishlistIds();
    if (!rawIds.length) {
      return { validIds: [], validProducts: [] };
    }

    try {
      const results = await Promise.allSettled(
        rawIds.map((id) => getProductById(id))
      );

      const validProducts = [];
      const validIds = [];

      results.forEach((res, index) => {
        if (
          res.status === "fulfilled" &&
          res.value?.data?.success &&
          res.value?.data?.product &&
          !res.value.data.product.isDeleted
        ) {
          const prod = res.value.data.product;
          const pid = String(prod.id || prod._id || rawIds[index]).trim();
          validProducts.push(prod);
          validIds.push(pid);
        }
      });

      const uniqueValidIds = normalizeWishlistIds(validIds);

      // If any ID failed to fetch (deleted, 404, soft-deleted), prune immediately!
      if (uniqueValidIds.length !== rawIds.length) {
        saveStoredWishlistIds(uniqueValidIds);
      }

      return { validIds: uniqueValidIds, validProducts };
    } catch (err) {
      console.warn("Wishlist validation encountered an error:", err);
      return { validIds: rawIds, validProducts: [] };
    } finally {
      inFlightValidation = null;
    }
  })();

  return inFlightValidation;
};

/**
 * Handle auth login/logout state change:
 * Switches active storage key and re-syncs count
 */
export const syncWishlistOnAuthChange = () => {
  const ids = getStoredWishlistIds();
  // Ensure legacy storage mirrors the newly active session
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
  notifyWishlistUpdated(ids);
  return ids;
};
