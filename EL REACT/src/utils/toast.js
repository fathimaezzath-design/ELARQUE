/**
 * ELARQUE Luxury Atelier Toast Notification Event Bus & Helpers
 */

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

/**
 * Dispatch a generic toast notification
 * @param {Object} options
 * @param {'cart'|'wishlist'|'auth'|'success'|'error'|'info'} options.type
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.image]
 * @param {string} [options.actionLabel]
 * @param {string} [options.actionLink]
 * @param {Function} [options.onAction]
 * @param {number} [options.duration] - Milliseconds (default 3800)
 */
export const showToast = ({
  type = "info",
  title = "",
  message = "",
  image = null,
  actionLabel = null,
  actionLink = null,
  onAction = null,
  duration = 3800,
}) => {
  const event = new CustomEvent("elarque_toast", {
    detail: {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      type,
      title,
      message,
      image: resolveImageUrl(image),
      actionLabel,
      actionLink,
      onAction,
      duration,
    },
  });
  window.dispatchEvent(event);
};

/**
 * Pop-up message when product is added to shopping bag
 * @param {Object} product
 * @param {string} [customMessage]
 */
export const showCartToast = (product, customMessage) => {
  const name = product?.name || "Garment";
  const image =
    product?.coverImage ||
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    null;

  showToast({
    type: "cart",
    title: "Added to Shopping Bag",
    message: customMessage || `${name} has been added to your cart.`,
    image,
    actionLabel: "VIEW BAG →",
    actionLink: "/cart",
    duration: 4000,
  });
};

/**
 * Pop-up message when product is added or removed from wishlist
 * @param {Object} product
 * @param {boolean} isAdded
 */
export const showWishlistToast = (product, isAdded) => {
  const name = product?.name || "Garment";
  const image =
    product?.coverImage ||
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    null;

  if (isAdded) {
    showToast({
      type: "wishlist",
      title: "Saved to Atelier Wishlist",
      message: `${name} has been added to your private wishlist.`,
      image,
      actionLabel: "VIEW WISHLIST →",
      actionLink: "/wishlist",
      duration: 3800,
    });
  } else {
    showToast({
      type: "wishlist",
      title: "Removed from Wishlist",
      message: `${name} was removed from your wishlist.`,
      image,
      duration: 3200,
    });
  }
};

/**
 * Pop-up message when user tries to add to cart without login
 */
export const showAuthToast = () => {
  showToast({
    type: "auth",
    title: "Sign In Required",
    message: "Please sign in to add garments to your shopping bag.",
    actionLabel: "SIGN IN →",
    actionLink: "/login",
    duration: 4500,
  });
};

export default {
  showToast,
  showCartToast,
  showWishlistToast,
  showAuthToast,
};
