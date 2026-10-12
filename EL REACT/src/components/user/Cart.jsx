import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  X,
  Heart,
  Check,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import {
  getCart,
  updateItemQuantity,
  removeItem,
} from "../../services/cartService";
import "./Cart.css";

// Color resolver for luxury swatches
const getColorHex = (color) => {
  if (!color) return "#5c061c";
  const c = color.toLowerCase().trim();
  const map = {
    black: "#111827",
    onyx: "#111827",
    "obsidian black": "#141414",
    white: "#F8FAFC",
    burgundy: "#7A1526",
    "vintage burgundy": "#6B1F2A",
    maroon: "#800000",
    cream: "#DFC28D",
    champagne: "#F5E6CA",
    gold: "#DFC28D",
    navy: "#1E3A8A",
    midnight: "#0F172A",
    blue: "#3B82F6",
    charcoal: "#374151",
    grey: "#6B7280",
    gray: "#6B7280",
    brown: "#78350F",
    taupe: "#8B7E74",
    green: "#15803D",
    emerald: "#059669",
    olive: "#556B2F",
    red: "#DC2626",
    pink: "#EC4899",
    beige: "#F5F5DC",
    "noir & champagne": "#1A1A1A",
    "ivory & bordeaux": "#DFC28D",
  };
  return map[c] || "#5c061c";
};

// Image URL resolver
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

// Currency formatter
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const Cart = () => {
  const navigate = useNavigate();

  // Cart State
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    curationsCount: 0,
    subtotal: 0,
    shippingFee: 0,
    packagingFee: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // User Notices
  const [notice, setNotice] = useState({ type: "", text: "" });

  // Removal Modal State (supports remove_item.png & Remove_Cart.png styles)
  const [removalModal, setRemovalModal] = useState({
    isOpen: false,
    item: null,
    mode: "standard", // "standard" (remove_item.png) or "wishlist_option" (Remove_Cart.png)
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState("");

  // Privilege Code State
  const [privilegeCode, setPrivilegeCode] = useState("");
  const [privilegeNotice, setPrivilegeNotice] = useState("");

  // 1. Fetch Cart from Backend
  const fetchCustomerCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getCart();
      if (response.data?.success && response.data?.cart) {
        setCart(response.data.cart);
      } else {
        setError("Unable to load cart. Please retry.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          "Could not retrieve your cart. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCustomerCart();
  }, [fetchCustomerCart]);

  // 2. Quantity Stepper Handler
  const handleQuantityUpdate = async (item, newQty) => {
    if (newQty < 1 || newQty > item.availableStock) return;
    if (actionLoadingId) return;

    setActionLoadingId(item.id || item._id);

    try {
      const response = await updateItemQuantity(item.id || item._id, newQty);
      if (response.data?.success && response.data?.cart) {
        setCart(response.data.cart);
        window.dispatchEvent(
          new CustomEvent("elarque_cart_updated", { detail: response.data.cart })
        );
      }
    } catch (err) {
      setNotice({
        type: "error",
        text:
          err.response?.data?.message ||
          "Could not update quantity. Please check available stock.",
      });
      setTimeout(() => setNotice({ type: "", text: "" }), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Open Removal Confirmation Dialog
  const handleOpenRemoveModal = (item, mode = "standard") => {
    setRemovalModal({
      isOpen: true,
      item,
      mode,
    });
    setModalFeedback("");
  };

  const handleCloseRemoveModal = () => {
    if (modalLoading) return;
    setRemovalModal({ isOpen: false, item: null, mode: "standard" });
    setModalFeedback("");
  };

  // 4. Confirm Removal Execution
  const handleConfirmRemoval = async () => {
    const item = removalModal.item;
    if (!item) return;

    setModalLoading(true);
    setModalFeedback("");

    try {
      const response = await removeItem(item.id || item._id);
      if (response.data?.success && response.data?.cart) {
        setCart(response.data.cart);
        window.dispatchEvent(
          new CustomEvent("elarque_cart_updated", { detail: response.data.cart })
        );
        handleCloseRemoveModal();
        setNotice({
          type: "success",
          text: `Removed "${item.name}" from your luxury shopping bag.`,
        });
        setTimeout(() => setNotice({ type: "", text: "" }), 5000);
      }
    } catch (err) {
      setModalFeedback(
        err.response?.data?.message || "Failed to remove item. Please try again."
      );
    } finally {
      setModalLoading(false);
    }
  };

  // 5. Move to Wishlist Handler (Transparent handling per instructions)
  const handleMoveToWishlist = () => {
    setModalFeedback(
      "Cloud Wishlist persistence is scheduled for Step 6. You can cancel or confirm removal from your bag."
    );
  };

  // 6. Privilege Code Handler
  const handleApplyPrivilegeCode = (e) => {
    e.preventDefault();
    if (!privilegeCode.trim()) return;

    setPrivilegeNotice(
      "Privilege codes and bespoke salon vouchers will be activated at Checkout (Step 5)."
    );
    setTimeout(() => setPrivilegeNotice(""), 6000);
  };

  // 7. Proceed to Checkout Trigger
  const handleProceedCheckout = () => {
    const hasUnavailable = cart.items.some((i) => !i.isAvailable);
    if (hasUnavailable) {
      setNotice({
        type: "error",
        text:
          "Please remove unavailable silhouettes before proceeding to atelier dispatch.",
      });
      return;
    }
    setNotice({
      type: "info",
      text:
        "Atelier Express Checkout and Payment integration is scheduled for Step 5. Your bag is safely preserved.",
    });
    setTimeout(() => setNotice({ type: "", text: "" }), 6000);
  };

  const cartItemsCount = cart.items ? cart.items.length : 0;
  const hasUnavailableItems = cart.items.some((i) => !i.isAvailable);

  return (
    <div className="el-cart-page">
      {/* GLOBAL NAVBAR */}
      <Navbar cartCount={cart.itemCount} />

      <main className="el-cart-main">
        {/* EDITORIAL HEADER (MATCHING CART.PNG) */}
        <header className="el-cart-header">
          <h1 className="el-cart-title">Your Luxury Cart</h1>
          <p className="el-cart-subtitle">
            Your selected silhouettes are reserved in the atelier vault, awaiting
            bespoke dispatch to your private residence.
          </p>
        </header>

        {/* NOTICES */}
        {notice.text && (
          <div
            className={`el-cart-notice el-cart-notice-${notice.type || "info"}`}
            role="alert"
          >
            {notice.type === "success" && <Check size={16} />}
            {notice.type === "error" && <AlertCircle size={16} />}
            {notice.type === "info" && <Sparkles size={16} />}
            <span>{notice.text}</span>
            <button
              type="button"
              className="el-cart-notice-close"
              onClick={() => setNotice({ type: "", text: "" })}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="el-cart-state-box">
            <div className="el-cart-spinner" />
            <h2 className="el-cart-state-title">Retrieving Salon Vault</h2>
            <p className="el-cart-state-sub">
              Accessing your reserved garments and verifying current inventory...
            </p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="el-cart-state-box">
            <AlertCircle size={44} color="#991b1b" className="el-cart-empty-icon" />
            <h2 className="el-cart-state-title">Cart Unavailable</h2>
            <p className="el-cart-state-sub">{error}</p>
            <button
              type="button"
              className="el-btn-explore-salon"
              onClick={fetchCustomerCart}
            >
              <RotateCcw size={14} />
              <span>Retry Cart Retrieval</span>
            </button>
          </div>
        ) : cartItemsCount === 0 ? (
          /* EMPTY CART STATE */
          <div className="el-cart-state-box">
            <ShoppingBag size={48} className="el-cart-empty-icon" />
            <h2 className="el-cart-state-title">Your Atelier Bag is Empty</h2>
            <p className="el-cart-state-sub">
              You have not curated any haute couture silhouettes yet. Explore our
              permanent salon collections and limited commissions.
            </p>
            <Link to="/collections" className="el-btn-explore-salon">
              <span>EXPLORE ATELIER COLLECTIONS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* TWO-COLUMN CART LAYOUT (MATCHING CART.PNG) */
          <div className="el-cart-layout-grid">
            {/* LEFT COLUMN: CURATED CART ITEMS */}
            <div className="el-cart-items-column">
              {cart.items.map((item) => {
                const itemId = item.id || item._id;
                const coverImg = resolveImageUrl(item.coverImage);
                const isItemActionLoading = actionLoadingId === itemId;
                const swatchHex = getColorHex(item.color);

                return (
                  <article
                    key={itemId}
                    className={`el-cart-item-card ${
                      !item.isAvailable ? "unavailable" : ""
                    }`}
                  >
                    {/* Item Media / Lookbook Thumbnail */}
                    <div className="el-cart-item-media">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={item.name}
                          className="el-cart-item-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="el-cart-item-placeholder">
                          <span>ELARQUE</span>
                        </div>
                      )}
                      {item.category && (
                        <span className="el-cart-item-category-tag">
                          {item.category.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Item Specifications & Details */}
                    <div className="el-cart-item-details">
                      <div>
                        <div className="el-cart-item-header">
                          <span className="el-cart-tier-kicker">
                            {item.brand
                              ? `${item.brand.toUpperCase()} · ATELIER RUN`
                              : "PARISIAN ATELIER RUN"}
                          </span>
                          <span className="el-cart-item-price">
                            {formatINR(item.price)}
                          </span>
                        </div>

                        <h3 className="el-cart-item-title">{item.name}</h3>

                        <p className="el-cart-item-desc">
                          Premium bespoke silhouette tailored with European
                          precision and hand-finished couture detailing.
                        </p>
                      </div>

                      {/* Specs Pill Bar (Size, Tone, Stock Status) */}
                      <div className="el-cart-item-specs-bar">
                        <div className="el-specs-attributes">
                          <span>SIZE: {item.size}</span>
                          <span className="el-tone-group">
                            <span>TONE:</span>
                            <span
                              className="el-tone-dot"
                              style={{ backgroundColor: swatchHex }}
                            />
                            <span>{item.color}</span>
                          </span>
                        </div>

                        <div
                          className={`el-specs-status ${
                            !item.isAvailable
                              ? "unavailable"
                              : item.availableStock <= 5
                              ? "low"
                              : "ready"
                          }`}
                        >
                          <Sparkles size={11} />
                          <span>{item.statusMessage || "Ready to Ship"}</span>
                        </div>
                      </div>

                      {/* Bottom Controls: Quantity Stepper & Removal Dialog Trigger */}
                      <div className="el-cart-item-actions">
                        {/* Quantity Stepper */}
                        <div className="el-cart-stepper">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(item, item.quantity - 1)
                            }
                            disabled={
                              item.quantity <= 1 ||
                              !item.isAvailable ||
                              isItemActionLoading
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="el-cart-stepper-val">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(item, item.quantity + 1)
                            }
                            disabled={
                              item.quantity >= item.availableStock ||
                              !item.isAvailable ||
                              isItemActionLoading
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Removal Action Trigger */}
                        <button
                          type="button"
                          className="el-btn-cart-remove"
                          onClick={() => handleOpenRemoveModal(item, "standard")}
                        >
                          <Trash2 size={13} />
                          <span>REMOVE ITEM</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* RIGHT COLUMN: BESPOKE SUMMARY / ORDER OVERVIEW */}
            <aside className="el-cart-summary-column">
              <div className="el-cart-summary-card">
                <div className="el-summary-corner-arc" />

                <span className="el-summary-kicker">BESPOKE SUMMARY</span>
                <h2 className="el-summary-heading">Order Overview</h2>

                <div className="el-summary-rows">
                  <div className="el-summary-row">
                    <span>
                      Subtotal ({cart.curationsCount || cart.items.length}{" "}
                      {cart.items.length === 1 ? "curation" : "curations"})
                    </span>
                    <strong>{formatINR(cart.subtotal)}</strong>
                  </div>

                  <div className="el-summary-row">
                    <span>Shipping</span>
                    <span className="el-shipping-free-pill">FREE DELIVERY</span>
                  </div>

                  <div className="el-summary-row">
                    <span>Bespoke Packaging</span>
                    <strong>{formatINR(cart.packagingFee)}</strong>
                  </div>
                </div>

                {/* Privilege / Salon Code */}
                <form
                  onSubmit={handleApplyPrivilegeCode}
                  className="el-privilege-code-box"
                >
                  <label htmlFor="privilegeCode" className="el-privilege-label">
                    PRIVILEGE / SALON CODE
                  </label>
                  <div className="el-privilege-input-group">
                    <input
                      id="privilegeCode"
                      type="text"
                      placeholder="E.G. ATELIER2026"
                      value={privilegeCode}
                      onChange={(e) => setPrivilegeCode(e.target.value)}
                      className="el-privilege-input"
                    />
                    <button type="submit" className="el-btn-privilege-apply">
                      APPLY
                    </button>
                  </div>
                  {privilegeNotice && (
                    <span className="el-privilege-notice">{privilegeNotice}</span>
                  )}
                </form>

                {/* Total Payable Box */}
                <div className="el-total-payable-card">
                  <div className="el-total-row">
                    <span className="el-total-label">TOTAL PAYABLE</span>
                    <span className="el-total-amount">
                      {formatINR(cart.total)}
                    </span>
                  </div>
                  <p className="el-total-tariff-subtext">
                    All import tariffs, custom tailoring surcharges and handling
                    included.
                  </p>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  type="button"
                  className="el-btn-proceed-checkout"
                  onClick={handleProceedCheckout}
                  disabled={hasUnavailableItems || cart.items.length === 0}
                >
                  <span>PROCEED TO SECURE CHECKOUT</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------
          REMOVAL CONFIRMATION MODALS (MATCHING REMOVE_ITEM.PNG & REMOVE_CART.PNG)
          ------------------------------------------------------------------ */}
      {removalModal.isOpen && removalModal.item && (
        <div
          className="el-modal-backdrop"
          onClick={handleCloseRemoveModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="el-removal-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ESC Close Button */}
            <button
              type="button"
              className="el-modal-close-pill"
              onClick={handleCloseRemoveModal}
            >
              <span>ESC</span>
              <X size={13} />
            </button>

            {/* Top Icon Circular Badge */}
            <div className="el-modal-icon-badge">
              {removalModal.mode === "standard" ? (
                <Trash2 size={24} />
              ) : (
                <ShoppingBag size={24} />
              )}
            </div>

            {/* Modal Heading & Subtitle */}
            <h3 className="el-modal-title">
              {removalModal.mode === "standard"
                ? "Remove Item?"
                : "Remove from Cart?"}
            </h3>

            <p className="el-modal-subtext">
              {removalModal.mode === "standard"
                ? "Are you sure you want to remove this item from your shopping bag? You can always add it again later."
                : "Are you sure you want to remove this piece from your salon order? You can preserve this silhouette in your private wishlist for future curations."}
            </p>

            {/* Product Mini Preview Card */}
            <div className="el-modal-item-preview">
              <div className="el-modal-item-thumb">
                <img
                  src={resolveImageUrl(removalModal.item.coverImage)}
                  alt={removalModal.item.name}
                />
              </div>

              <div className="el-modal-item-info">
                <div className="el-modal-item-tags-row">
                  <span className="el-tag-bestseller">BEST SELLER</span>
                  <span className="el-tag-category">
                    {removalModal.item.category || "FORMAL ATELIER"}
                  </span>
                </div>

                <h4 className="el-modal-item-name">{removalModal.item.name}</h4>

                <span className="el-modal-item-meta">
                  Size: {removalModal.item.size} • Color:{" "}
                  {removalModal.item.color}
                </span>

                <div className="el-modal-item-price-row">
                  <span className="el-modal-item-rating">★ 4.9 (1,240)</span>
                  <span className="el-modal-item-amount">
                    <span>ITEM AMOUNT</span>
                    {formatINR(removalModal.item.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback / Error in modal if any */}
            {modalFeedback && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#991b1b",
                  marginBottom: "12px",
                }}
              >
                {modalFeedback}
              </div>
            )}

            {/* Modal Actions */}
            {removalModal.mode === "standard" ? (
              /* MATCHING REMOVE_ITEM.PNG: [NO, KEEP IT] + [YES, REMOVE] */
              <div className="el-modal-actions-row">
                <button
                  type="button"
                  className="el-btn-modal-cancel"
                  onClick={handleCloseRemoveModal}
                  disabled={modalLoading}
                >
                  NO, KEEP IT
                </button>

                <button
                  type="button"
                  className="el-btn-modal-confirm-remove"
                  onClick={handleConfirmRemoval}
                  disabled={modalLoading}
                >
                  <Trash2 size={13} />
                  <span>{modalLoading ? "REMOVING..." : "YES, REMOVE"}</span>
                </button>
              </div>
            ) : (
              /* MATCHING REMOVE_CART.PNG: [REMOVE ITEM] + [MOVE TO WISHLIST] */
              <div className="el-modal-actions-row">
                <button
                  type="button"
                  className="el-btn-modal-cancel"
                  onClick={handleConfirmRemoval}
                  disabled={modalLoading}
                >
                  <Trash2 size={13} />
                  <span>{modalLoading ? "REMOVING..." : "REMOVE ITEM"}</span>
                </button>

                <button
                  type="button"
                  className="el-btn-modal-wishlist"
                  onClick={handleMoveToWishlist}
                  disabled={modalLoading}
                >
                  <Heart size={13} />
                  <span>MOVE TO WISHLIST</span>
                </button>
              </div>
            )}

            {/* Bottom Security Note */}
            <p className="el-modal-security-note">
              <ShieldCheck size={14} color="#C5A265" />
              <span>
                {removalModal.mode === "standard"
                  ? "Your wishlist and shopping preferences will remain saved."
                  : "Your saved curations and bespoke fitting preferences will remain secure in your client vault."}
              </span>
            </p>

            {/* Mode switcher or cancel link */}
            {removalModal.mode === "standard" ? (
              <button
                type="button"
                className="el-modal-cancel-link"
                onClick={() =>
                  setRemovalModal((prev) => ({
                    ...prev,
                    mode: "wishlist_option",
                  }))
                }
              >
                MOVE TO WISHLIST INSTEAD
              </button>
            ) : (
              <button
                type="button"
                className="el-modal-cancel-link"
                onClick={handleCloseRemoveModal}
              >
                CANCEL &amp; KEEP IN BAG
              </button>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
};

export default Cart;
