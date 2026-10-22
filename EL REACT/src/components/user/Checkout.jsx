import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Home,
  Building,
  CheckCircle2,
  Check,
  AlertCircle,
  Truck,
  Lock,
  Gift,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  RotateCcw,
  Sparkles,
  Tag,
  Shield,
  Trash2,
} from "lucide-react";
import {
  getAddresses,
  addAddress,
  updateAddress,
} from "../../services/addressService";
import { getCart } from "../../services/cartService";
import { getProfile } from "../../services/authService";
import {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon,
} from "../../services/couponService";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./Checkout.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  house: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

function validateAddress(form) {
  const errs = {};
  if (!form.fullName.trim()) errs.fullName = "Full name is required";
  if (!form.phone.trim()) {
    errs.phone = "Phone number is required";
  } else {
    const clean = form.phone.replace(/\s|\+91/g, "").trim();
    if (!/^[0-9]{10}$/.test(clean)) {
      errs.phone = "Enter a valid 10-digit number";
    }
  }
  if (!form.house.trim()) errs.house = "Address / House details are required";
  if (!form.city.trim()) errs.city = "City is required";
  if (!form.state.trim()) errs.state = "State is required";
  if (!form.pincode.trim()) {
    errs.pincode = "Pincode is required";
  } else if (!/^[0-9]{6}$/.test(form.pincode.trim())) {
    errs.pincode = "Enter a valid 6-digit pincode";
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Checkout Component
// ---------------------------------------------------------------------------
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // User Profile
  const [userProfile, setUserProfile] = useState(null);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [selectedId, setSelectedId] = useState(null);



  // Quick Address Form (Card 1)
  const [quickForm, setQuickForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    newsletter: true,
  });
  const [quickErrors, setQuickErrors] = useState({});
  const [savingQuick, setSavingQuick] = useState(false);

  // Edit / Add Address Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [modalForm, setModalForm] = useState(INITIAL_FORM);
  const [modalErrors, setModalErrors] = useState({});
  const [modalSaving, setModalSaving] = useState(false);

  // Cart State
  const [cart, setCart] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState("");

  // Coupon & Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [promoFeedback, setPromoFeedback] = useState("");
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Order Placement Feedback
  const [orderNotice, setOrderNotice] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Fetch available coupons on mount
  useEffect(() => {
    const fetchCouponsList = async () => {
      setLoadingCoupons(true);
      try {
        const res = await getAvailableCoupons();
        if (res?.data?.coupons) {
          setAvailableCoupons(res.data.coupons);
        }
      } catch (err) {
        console.warn("Available coupons retrieval:", err.message);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCouponsList();
  }, []);

  // Check if arrived from Payment Failure retry
  useEffect(() => {
    if (location.state?.retryPayment) {
      setOrderNotice({
        type: "info",
        title: "Payment Authorization Retry",
        message:
          "You were redirected from an interrupted transaction. You can proceed to payment again or adjust your order.",
      });
    }
  }, [location.state]);

  // -------------------------------------------------------------------------
  // Auth & Profile Fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchCustomerProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data?.user) {
          const u = res.data.user;
          setUserProfile(u);
          setQuickForm((prev) => ({
            ...prev,
            fullName: u.fullName || prev.fullName,
            email: u.email || prev.email,
            phone: u.phoneNumber || prev.phone,
          }));
        }
      } catch (err) {
        // Fallback to local storage user
        try {
          const cached = JSON.parse(localStorage.getItem("user") || "null");
          if (cached) {
            setUserProfile(cached);
            setQuickForm((prev) => ({
              ...prev,
              fullName: cached.fullName || prev.fullName,
              email: cached.email || prev.email,
              phone: cached.phoneNumber || prev.phone,
            }));
          }
        } catch {
          // ignore
        }
      }
    };

    fetchCustomerProfile();
  }, [navigate]);

  // -------------------------------------------------------------------------
  // Fetch Saved Addresses
  // -------------------------------------------------------------------------
  const fetchAddresses = useCallback(async (preferId) => {
    setLoadingAddresses(true);
    setAddressError("");
    try {
      const res = await getAddresses();
      const list = res?.data?.addresses || [];
      setAddresses(list);

      if (preferId) {
        setSelectedId(preferId);
      } else {
        setSelectedId((current) => {
          if (current && list.some((a) => a._id === current)) return current;
          const def = list.find((a) => a.isDefault);
          return def ? def._id : (list[0]?._id || null);
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setAddressError(
        err.response?.data?.message ||
          "Unable to load saved addresses. Please refresh."
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // -------------------------------------------------------------------------
  // Fetch Cart
  // -------------------------------------------------------------------------
  const fetchCustomerCart = useCallback(async () => {
    setLoadingCart(true);
    setCartError("");
    try {
      const res = await getCart();
      if (res?.data?.success && res?.data?.cart) {
        setCart(res.data.cart);
      } else {
        setCartError("Unable to retrieve cart information.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setCartError(
        err.response?.data?.message ||
          "Could not retrieve cart items. Please check your connection."
      );
    } finally {
      setLoadingCart(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCustomerCart();
  }, [fetchCustomerCart]);

  // -------------------------------------------------------------------------
  // Quick Address Save (Card 1)
  // -------------------------------------------------------------------------
  const handleQuickFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuickForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setQuickErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleQuickAddressSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!quickForm.fullName.trim()) errs.fullName = "Full name is required";
    if (!quickForm.phone.trim()) errs.phone = "Phone number is required";
    if (!quickForm.address.trim()) errs.address = "Address is required";
    if (!quickForm.postalCode.trim()) errs.postalCode = "Postal code required";
    if (!quickForm.city.trim()) errs.city = "City is required";

    if (Object.keys(errs).length > 0) {
      setQuickErrors(errs);
      return;
    }

    setSavingQuick(true);
    try {
      const cleanPhone = quickForm.phone.replace(/\s|\+91/g, "").trim();
      const payload = {
        fullName: quickForm.fullName.trim(),
        phone: cleanPhone,
        house: quickForm.address.trim(),
        street: quickForm.city.trim(),
        city: quickForm.city.trim(),
        state: quickForm.state.trim() || "Kerala",
        pincode: quickForm.postalCode.trim(),
      };

      const res = await addAddress(payload);
      const newAddr = res?.data?.address;

      await fetchAddresses(newAddr?._id);

      setOrderNotice({
        type: "success",
        title: "Address Saved",
        message: "Your new delivery address has been saved and selected.",
      });
      setTimeout(() => setOrderNotice(null), 5000);
    } catch (err) {
      setOrderNotice({
        type: "error",
        title: "Save Failed",
        message:
          err.response?.data?.message || "Failed to save address. Please retry.",
      });
      setTimeout(() => setOrderNotice(null), 6000);
    } finally {
      setSavingQuick(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit / Add Address Modal Handlers
  // -------------------------------------------------------------------------
  const handleOpenEdit = (addr, e) => {
    if (e) e.stopPropagation();
    setEditingAddr(addr);
    setModalForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      house: addr.house || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    });
    setModalErrors({});
    setModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingAddr(null);
    setModalForm({
      fullName: userProfile?.fullName || "",
      phone: userProfile?.phoneNumber || "",
      house: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
    setModalErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (modalSaving) return;
    setModalOpen(false);
    setEditingAddr(null);
    setModalForm(INITIAL_FORM);
    setModalErrors({});
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    const errs = validateAddress(modalForm);
    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    setModalSaving(true);
    try {
      const cleanPhone = modalForm.phone.replace(/\s|\+91/g, "").trim();
      const payload = {
        fullName: modalForm.fullName.trim(),
        phone: cleanPhone,
        house: modalForm.house.trim(),
        street: modalForm.street.trim() || modalForm.city.trim(),
        city: modalForm.city.trim(),
        state: modalForm.state.trim(),
        pincode: modalForm.pincode.trim(),
      };

      let preferId = null;
      if (editingAddr) {
        await updateAddress(editingAddr._id, payload);
        preferId = editingAddr._id;
        setOrderNotice({
          type: "success",
          title: "Address Updated",
          message: "Delivery coordinates updated successfully.",
        });
      } else {
        const res = await addAddress(payload);
        preferId = res?.data?.address?._id;
        setOrderNotice({
          type: "success",
          title: "New Destination Saved",
          message: "Delivery address added and selected.",
        });
      }

      handleCloseModal();
      await fetchAddresses(preferId);
      setTimeout(() => setOrderNotice(null), 5000);
    } catch (err) {
      setModalErrors({
        form: err.response?.data?.message || "Failed to save address details.",
      });
    } finally {
      setModalSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // Promo Code Handlers (Apply & Remove with Single-Coupon Enforcement)
  // -------------------------------------------------------------------------
  const handleApplyPromo = async (e, directCode = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const codeToApply = (directCode || promoCode || "").trim().toUpperCase();

    if (!codeToApply) {
      setPromoFeedback("Please enter a promotional coupon code.");
      return;
    }

    // Rule: Prevent multiple coupon applications
    if (appliedCoupon) {
      if (appliedCoupon.code === codeToApply) {
        setPromoFeedback(`Privilege code "${codeToApply}" is already applied.`);
        return;
      }
      setPromoFeedback(
        `Privilege code "${appliedCoupon.code}" is already active. Please remove it first to apply another coupon.`
      );
      return;
    }

    setApplyingCoupon(true);
    setPromoFeedback("");

    try {
      const res = await applyCoupon(codeToApply, calculatedSubtotal);
      if (res?.data?.success && res?.data?.coupon) {
        setAppliedCoupon(res.data.coupon);
        setPromoFeedback(
          res.data.message || `Privilege code "${codeToApply}" applied successfully!`
        );
        setPromoCode("");
      } else {
        setPromoFeedback(res?.data?.message || "Invalid coupon code.");
      }
    } catch (err) {
      setPromoFeedback(
        err.response?.data?.message || "Failed to apply privilege code. Please check requirements."
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch {
      // client-side reset fallback
    }
    const removedCode = appliedCoupon?.code;
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoFeedback(`Privilege code "${removedCode}" removed. Total updated.`);
    setTimeout(() => setPromoFeedback(""), 4500);
  };

  // -------------------------------------------------------------------------
  // Navigate to Payment Page (validates checkout data first)
  // -------------------------------------------------------------------------
  const handleContinueToPayment = () => {
    const selected = addresses.find((a) => a._id === selectedId);
    if (!selected) {
      setOrderNotice({
        type: "error",
        title: "Address Required",
        message: "Please select a delivery destination before proceeding to payment.",
      });
      return;
    }

    if (cartItems.length === 0) {
      setOrderNotice({
        type: "error",
        title: "Empty Bag",
        message: "Your shopping bag is empty. Add items before proceeding.",
      });
      return;
    }

    if (hasUnavailableItems) {
      setOrderNotice({
        type: "error",
        title: "Unavailable Items",
        message: "Please remove unavailable items from your bag before proceeding.",
      });
      return;
    }

    // Navigate to separate payment page with all required checkout data
    navigate("/payment", {
      state: {
        addressId: selectedId,
        address: selected,
        couponCode: appliedCoupon?.code || "",
        appliedCoupon: appliedCoupon || null,
        cartItems,
        subtotal: calculatedSubtotal,
        couponDiscount,
        packagingFee,
        shippingFee,
        estimatedTotal,
        userProfile,
      },
    });
  };

  // -------------------------------------------------------------------------
  // Derived Calculations
  // -------------------------------------------------------------------------
  const selectedAddress = addresses.find((a) => a._id === selectedId) || null;
  const cartItems = cart?.items || [];
  const totalItemQuantity =
    cart?.itemCount ??
    cartItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

  const calculatedSubtotal = useMemo(() => {
    if (cart?.subtotal !== undefined && cart.subtotal !== null) {
      return Number(cart.subtotal);
    }
    return cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  }, [cart, cartItems]);

  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount) || 0 : 0;

  const packagingFee =
    cart?.packagingFee !== undefined && cart?.packagingFee !== null
      ? Number(cart.packagingFee)
      : cartItems.length > 0
      ? 199
      : 0;

  const shippingFee =
    cart?.shippingFee !== undefined && cart?.shippingFee !== null
      ? Number(cart.shippingFee)
      : 0;

  const estimatedTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - couponDiscount + packagingFee + shippingFee);
  }, [calculatedSubtotal, couponDiscount, packagingFee, shippingFee]);

  const hasUnavailableItems = cartItems.some((i) => !i.isAvailable);

  return (
    <div className="el-co-page">
      <Navbar cartCount={totalItemQuantity} />

      <main className="el-co-main-container">
        {/* ── Page Header ── */}
        <header className="el-co-page-header">
          <div className="el-co-title-group">
            <h1 className="el-co-main-title">Complete Your Order</h1>
            <p className="el-co-main-subtitle">
              Your selected luxury pieces are almost yours. Complete your purchase
              securely with a premium checkout experience.
            </p>
          </div>
          <div className="el-co-transit-badge">
            <span className="el-co-transit-dot">•</span>
            <Truck size={14} className="el-co-transit-icon" />
            <span>Insured Transit</span>
          </div>
        </header>

        {/* ── Notification Banner ── */}
        {orderNotice && (
          <div className={`el-co-global-notice ${orderNotice.type}`} role="alert">
            <div className="el-co-notice-icon">
              {orderNotice.type === "success" && <CheckCircle2 size={18} />}
              {orderNotice.type === "error" && <AlertCircle size={18} />}
              {orderNotice.type === "info" && <Sparkles size={18} />}
            </div>
            <div className="el-co-notice-body">
              <strong>{orderNotice.title}</strong>
              <p>{orderNotice.message}</p>
            </div>
            <button
              type="button"
              className="el-co-notice-close"
              onClick={() => setOrderNotice(null)}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ── Unavailable Items Warning ── */}
        {hasUnavailableItems && (
          <div className="el-co-global-notice error" role="alert">
            <AlertCircle size={18} />
            <div className="el-co-notice-body">
              <strong>Unavailable Silhouettes Detected</strong>
              <p>
                One or more items in your cart are currently out of stock. Please
                return to your bag to adjust your curations before placing an
                order.
              </p>
            </div>
            <Link to="/cart" className="el-co-notice-link">
              Return to Bag
            </Link>
          </div>
        )}

        {/* ── Cart Empty State ── */}
        {!loadingCart && cartItems.length === 0 ? (
          <div className="el-co-empty-card">
            <h2>Your Shopping Bag is Empty</h2>
            <p>
              Please curate silhouettes from our collections before proceeding
              to checkout.
            </p>
            <Link to="/collections" className="el-co-btn-primary">
              <span>EXPLORE ATELIER COLLECTIONS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* ── Main Two-Column Layout (Matching Checkout Reference) ── */
          <div className="el-co-layout-grid">
            {/* =========================================================
                LEFT COLUMN: Contact Information + Shipping Addresses
                ========================================================= */}
            <div className="el-co-left-col">
              {/* ── Card 1: Contact Information ── */}
              <section className="el-co-card el-co-contact-card">
                <div className="el-co-card-header">
                  <div className="el-co-card-title-wrap">
                    <span className="el-co-step-badge">1</span>
                    <h2 className="el-co-card-title">Contact Information</h2>
                  </div>
                  <span className="el-co-express-label">
                    EXPRESS CLIENT ENTRY
                  </span>
                </div>

                <form
                  onSubmit={handleQuickAddressSubmit}
                  className="el-co-contact-form"
                  noValidate
                >
                  {/* Full Name */}
                  <div className="el-co-input-group">
                    <label htmlFor="co-fullname">FULL NAME *</label>
                    <div className="el-co-input-wrapper">
                      <input
                        id="co-fullname"
                        type="text"
                        name="fullName"
                        placeholder="e.g. Peter Swaliha"
                        value={quickForm.fullName}
                        onChange={handleQuickFormChange}
                      />
                      <User size={16} className="el-co-input-icon" />
                    </div>
                    {quickErrors.fullName && (
                      <span className="el-co-field-err">
                        {quickErrors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Email & Phone Row */}
                  <div className="el-co-input-row">
                    <div className="el-co-input-group">
                      <label htmlFor="co-email">EMAIL ADDRESS *</label>
                      <div className="el-co-input-wrapper">
                        <input
                          id="co-email"
                          type="email"
                          name="email"
                          placeholder="client@elarque.com"
                          value={quickForm.email}
                          onChange={handleQuickFormChange}
                        />
                        <Mail size={16} className="el-co-input-icon" />
                      </div>
                      {quickErrors.email && (
                        <span className="el-co-field-err">
                          {quickErrors.email}
                        </span>
                      )}
                    </div>

                    <div className="el-co-input-group">
                      <label htmlFor="co-phone">PHONE NUMBER *</label>
                      <div className="el-co-phone-wrapper">
                        <div className="el-co-phone-prefix">
                          <span>||</span>
                          <span>+91</span>
                        </div>
                        <input
                          id="co-phone"
                          type="text"
                          name="phone"
                          placeholder="98470 51234"
                          maxLength={10}
                          value={quickForm.phone}
                          onChange={handleQuickFormChange}
                        />
                      </div>
                      {quickErrors.phone && (
                        <span className="el-co-field-err">
                          {quickErrors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address Line */}
                  <div className="el-co-input-group">
                    <div className="el-co-input-wrapper">
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={quickForm.address}
                        onChange={handleQuickFormChange}
                      />
                    </div>
                    {quickErrors.address && (
                      <span className="el-co-field-err">
                        {quickErrors.address}
                      </span>
                    )}
                  </div>

                  {/* Postal Code & City */}
                  <div className="el-co-input-row">
                    <div className="el-co-input-group">
                      <div className="el-co-input-wrapper">
                        <input
                          type="text"
                          name="postalCode"
                          placeholder="Postal Code"
                          maxLength={6}
                          value={quickForm.postalCode}
                          onChange={handleQuickFormChange}
                        />
                      </div>
                      {quickErrors.postalCode && (
                        <span className="el-co-field-err">
                          {quickErrors.postalCode}
                        </span>
                      )}
                    </div>

                    <div className="el-co-input-group">
                      <div className="el-co-input-wrapper">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={quickForm.city}
                          onChange={handleQuickFormChange}
                        />
                      </div>
                      {quickErrors.city && (
                        <span className="el-co-field-err">
                          {quickErrors.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Newsletter Checkbox */}
                  <label className="el-co-checkbox-label">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={quickForm.newsletter}
                      onChange={handleQuickFormChange}
                    />
                    <span>
                      Keep me updated on private salon debuts, seasonal lookbook
                      monographs, and archival bespoke drops.
                    </span>
                  </label>

                  {/* Add New Address Action */}
                  <button
                    type="submit"
                    className="el-co-btn-full-burgundy"
                    disabled={savingQuick}
                  >
                    <span>
                      {savingQuick ? "SAVING DESTINATION..." : "ADD NEW ADDRESS"}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              </section>

              {/* ── Card 2: Shipping Address & Saved Addresses ── */}
              <section className="el-co-card el-co-saved-addresses-card">
                <div className="el-co-card-header">
                  <div className="el-co-card-title-wrap">
                    <span className="el-co-step-badge">2</span>
                    <h2 className="el-co-card-title">
                      Shipping Address &amp; Saved Addresses
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="el-co-btn-outline-pill"
                    onClick={handleOpenAdd}
                  >
                    <span>+ ADD NEW ADDRESS</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="el-co-loading-box">
                    <div className="el-co-spinner" />
                    <p>Loading your saved addresses...</p>
                  </div>
                ) : addressError ? (
                  <div className="el-co-field-err">{addressError}</div>
                ) : addresses.length === 0 ? (
                  <div className="el-co-no-addresses">
                    <p>
                      No saved addresses yet. Enter your details above or click
                      "+ ADD NEW ADDRESS".
                    </p>
                  </div>
                ) : (
                  <div className="el-co-address-cards-grid">
                    {addresses.map((addr) => {
                      const isSelected = addr._id === selectedId;
                      const isHome =
                        addr.house?.toLowerCase().includes("home") ||
                        addr.street?.toLowerCase().includes("villa") ||
                        addr.isDefault;

                      return (
                        <div
                          key={addr._id}
                          className={`el-co-address-select-card ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => setSelectedId(addr._id)}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                        >
                          {/* Card Top: Tag + Radio Check */}
                          <div className="el-co-addr-card-top">
                            {addr.isDefault ? (
                              <span className="el-co-tag-default">
                                DEFAULT ADDRESS
                              </span>
                            ) : (
                              <span className="el-co-tag-office">
                                {isHome ? "HOME" : "OFFICE"}
                              </span>
                            )}

                            {isSelected ? (
                              <div className="el-co-checked-circle">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="el-co-unchecked-circle" />
                            )}
                          </div>

                          {/* Address Title */}
                          <h3 className="el-co-addr-title">
                            {isHome ? "Home" : "Office"} -{" "}
                            {addr.city || "Calicut"}
                            {addr.state ? `, ${addr.state}` : ""}
                          </h3>

                          {/* Address Details */}
                          <p className="el-co-addr-lines">
                            {addr.house}
                            <br />
                            {addr.street}
                            {addr.street ? `, ${addr.city}` : addr.city}
                            {addr.state ? `, ${addr.state}` : ""}{" "}
                            {addr.pincode}
                            <br />
                            India • Tel: +91 {addr.phone}
                          </p>

                          {/* Edit Address Link */}
                          <button
                            type="button"
                            className="el-co-edit-addr-link"
                            onClick={(e) => handleOpenEdit(addr, e)}
                          >
                            EDIT ADDRESS
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>


            </div>

            {/* =========================================================
                RIGHT COLUMN: Order Summary Card (Matching Reference)
                ========================================================= */}
            <aside className="el-co-right-col">
              <div className="el-co-summary-card">
                {/* Header */}
                <div className="el-co-summary-header">
                  <h2 className="el-co-summary-title">Order Summary</h2>
                  <span className="el-co-item-badge">
                    {totalItemQuantity}{" "}
                    {totalItemQuantity === 1 ? "ITEM" : "ITEMS"}
                  </span>
                </div>

                {/* Items List */}
                <div className="el-co-summary-items">
                  {cartItems.map((item) => {
                    const itemId = item.id || item._id;
                    const coverImg = resolveImageUrl(item.coverImage);
                    const originalPrice = item.originalPrice || item.price;
                    const hasDiscount = originalPrice > item.price;
                    const discountPercent = hasDiscount
                      ? Math.round(
                          ((originalPrice - item.price) / originalPrice) * 100
                        )
                      : 0;

                    return (
                      <article key={itemId} className="el-co-summary-item-row">
                        {/* Thumbnail with Size Pill */}
                        <div className="el-co-item-thumb-box">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={item.name}
                              className="el-co-item-thumb"
                            />
                          ) : (
                            <div className="el-co-thumb-placeholder">
                              <span>ELARQUE</span>
                            </div>
                          )}
                          <span className="el-co-thumb-size-pill">
                            Size: {item.size}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="el-co-item-info">
                          <span className="el-co-item-bestseller-tag">
                            BEST SELLER
                          </span>
                          <h3 className="el-co-item-name">{item.name}</h3>
                          <p className="el-co-item-variant-meta">
                            Color: {item.color} • Size: {item.size}
                          </p>
                          <div className="el-co-item-price-line">
                            <span className="el-co-effective-price">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </span>
                            {hasDiscount && (
                              <span className="el-co-original-price">
                                ₹
                                {Number(originalPrice).toLocaleString("en-IN")}
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="el-co-discount-tag">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Available Coupons Accordion */}
                <div className="el-co-coupons-accordion">
                  <button
                    type="button"
                    className="el-co-coupons-trigger"
                    onClick={() => setShowCoupons((prev) => !prev)}
                  >
                    <div className="el-co-coupons-title-row">
                      <Gift size={16} className="el-co-gift-icon" />
                      <span>
                        AVAILABLE PRIVILEGE COUPONS{" "}
                        {availableCoupons.length > 0 && `(${availableCoupons.length})`}
                      </span>
                    </div>
                    {showCoupons ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>

                  {showCoupons && (
                    <div className="el-co-coupons-dropdown">
                      {loadingCoupons ? (
                        <p style={{ fontSize: "12px", color: "#888", margin: "8px 0" }}>
                          Loading eligible privilege coupons...
                        </p>
                      ) : availableCoupons.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#888", margin: "8px 0" }}>
                          No additional salon privileges currently listed.
                        </p>
                      ) : (
                        availableCoupons.map((cpn) => {
                          const isCurrentlyApplied = appliedCoupon?.code === cpn.code;
                          const meetsMin = calculatedSubtotal >= (cpn.minPurchase || 0);

                          return (
                            <div key={cpn.code} className="el-co-coupon-chip">
                              <div>
                                <strong>{cpn.code}</strong>
                                <p>{cpn.description}</p>
                                {cpn.minPurchase > 0 && (
                                  <span style={{ fontSize: "11px", color: "#8A775C" }}>
                                    Min. commission: ₹{formatINR(cpn.minPurchase)}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={isCurrentlyApplied || !meetsMin || applyingCoupon}
                                onClick={() => handleApplyPromo(null, cpn.code)}
                              >
                                {isCurrentlyApplied ? "APPLIED" : meetsMin ? "APPLY" : "UNMET"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Applied Coupon Display (Single Coupon Enforced) */}
                {appliedCoupon ? (
                  <div className="el-co-applied-coupon-card">
                    <div className="el-co-applied-coupon-left">
                      <Tag size={18} className="el-co-applied-coupon-icon" />
                      <div>
                        <div className="el-co-applied-coupon-code">
                          <span>{appliedCoupon.code}</span>
                          <Check size={14} color="#16A34A" strokeWidth={3} />
                        </div>
                        <p className="el-co-applied-coupon-savings">
                          Privilege discount applied: -₹{formatINR(appliedCoupon.discountAmount)}
                        </p>
                        <p className="el-co-applied-coupon-note">
                          Single coupon active • Removes automatically on change
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="el-co-btn-remove-coupon"
                      onClick={handleRemoveCoupon}
                      title="Remove applied coupon"
                    >
                      <Trash2 size={13} />
                      <span>REMOVE</span>
                    </button>
                  </div>
                ) : (
                  /* Promo Code Input Form */
                  <form onSubmit={handleApplyPromo} className="el-co-promo-form">
                    <label htmlFor="promoCode">PROMO CODE</label>
                    <div className="el-co-promo-input-group">
                      <input
                        id="promoCode"
                        type="text"
                        placeholder="e.g. ATELIER10"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={applyingCoupon}
                      />
                      <button
                        type="submit"
                        className="el-co-btn-apply"
                        disabled={!promoCode.trim() || applyingCoupon}
                      >
                        {applyingCoupon ? "CHECKING..." : "APPLY"}
                      </button>
                    </div>
                  </form>
                )}

                {promoFeedback && (
                  <p className="el-co-promo-feedback">{promoFeedback}</p>
                )}

                {/* Cost Breakdown with Discount */}
                <div className="el-co-cost-breakdown">
                  <div className="el-co-cost-row">
                    <span>Subtotal</span>
                    <span>₹{formatINR(calculatedSubtotal)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="el-co-cost-row discount-row">
                      <span>
                        Privilege Discount ({appliedCoupon?.code})
                      </span>
                      <span className="el-co-disc-amt">
                        -₹{formatINR(couponDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="el-co-cost-row">
                    <span>Insured Shipping</span>
                    <span className="el-co-free-text">Complimentary</span>
                  </div>

                  <div className="el-co-cost-row">
                    <span>Signature Packaging</span>
                    <span>₹{formatINR(packagingFee)}</span>
                  </div>

                  <div className="el-co-cost-row">
                    <span>Tax</span>
                    <span>All taxes included</span>
                  </div>

                  <div className="el-co-cost-divider" />

                  {/* Total Row */}
                  <div className="el-co-total-row">
                    <div>
                      <span className="el-co-total-title">Total</span>
                      <p className="el-co-total-subtitle">All taxes included</p>
                    </div>
                    <span className="el-co-total-amount">
                      ₹{formatINR(estimatedTotal)}
                    </span>
                  </div>
                </div>

                {/* Continue to Payment CTA */}
                <button
                  type="button"
                  className="el-co-btn-place-order"
                  disabled={
                    !selectedId ||
                    cartItems.length === 0 ||
                    hasUnavailableItems ||
                    loadingCart
                  }
                  onClick={handleContinueToPayment}
                >
                  <span>
                    CONTINUE TO PAYMENT • ₹{formatINR(estimatedTotal)}
                  </span>
                  <ArrowRight size={16} />
                </button>

                {/* Trust Badges & Guarantees */}
                <p className="el-co-guarantee-text">
                  SECURE PAYMENT • EASY RETURNS • PREMIUM PACKAGING
                </p>

                <div className="el-co-trust-badge-bar">
                  <div className="el-co-badge-item">
                    <Lock size={13} className="el-co-badge-icon" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="el-co-badge-divider">|</div>
                  <div className="el-co-badge-item">
                    <Truck size={13} className="el-co-badge-icon" />
                    <span>Free Shipping</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />

      {/* ── Modal: Add / Edit Delivery Destination ── */}
      {modalOpen && (
        <div
          className="el-co-modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="el-co-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="el-co-modal-head">
              <h2>
                {editingAddr ? "Edit Delivery Address" : "Add Delivery Destination"}
              </h2>
              <button
                type="button"
                className="el-co-modal-close"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="el-co-modal-form" noValidate>
              {modalErrors.form && (
                <div className="el-co-field-err">{modalErrors.form}</div>
              )}

              <div className="el-co-input-group">
                <label>FULL NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Swaliha ezzath"
                  value={modalForm.fullName}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                />
                {modalErrors.fullName && (
                  <span className="el-co-field-err">
                    {modalErrors.fullName}
                  </span>
                )}
              </div>

              <div className="el-co-input-group">
                <label>MOBILE CONTACT *</label>
                <input
                  type="text"
                  placeholder="e.g. 9847051234"
                  maxLength={10}
                  value={modalForm.phone}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                {modalErrors.phone && (
                  <span className="el-co-field-err">{modalErrors.phone}</span>
                )}
              </div>

              <div className="el-co-input-group">
                <label>ADDRESS LINE 1 (VILLA / FLAT / STREET) *</label>
                <input
                  type="text"
                  placeholder="e.g. Villa 14, Whispering Palms Estate"
                  value={modalForm.house}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, house: e.target.value }))
                  }
                />
                {modalErrors.house && (
                  <span className="el-co-field-err">{modalErrors.house}</span>
                )}
              </div>

              <div className="el-co-input-group">
                <label>ADDRESS LINE 2 (OPTIONAL / LOCALITY)</label>
                <input
                  type="text"
                  placeholder="e.g. Beach Road"
                  value={modalForm.street}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, street: e.target.value }))
                  }
                />
              </div>

              <div className="el-co-input-row">
                <div className="el-co-input-group">
                  <label>CITY *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kozhikode"
                    value={modalForm.city}
                    onChange={(e) =>
                      setModalForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                  {modalErrors.city && (
                    <span className="el-co-field-err">{modalErrors.city}</span>
                  )}
                </div>

                <div className="el-co-input-group">
                  <label>STATE *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kerala"
                    value={modalForm.state}
                    onChange={(e) =>
                      setModalForm((p) => ({ ...p, state: e.target.value }))
                    }
                  />
                  {modalErrors.state && (
                    <span className="el-co-field-err">{modalErrors.state}</span>
                  )}
                </div>
              </div>

              <div className="el-co-input-group">
                <label>PIN CODE *</label>
                <input
                  type="text"
                  placeholder="e.g. 673001"
                  maxLength={6}
                  value={modalForm.pincode}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, pincode: e.target.value }))
                  }
                />
                {modalErrors.pincode && (
                  <span className="el-co-field-err">
                    {modalErrors.pincode}
                  </span>
                )}
              </div>

              <div className="el-co-modal-actions">
                <button
                  type="button"
                  className="el-co-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={modalSaving}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="el-co-btn-save"
                  disabled={modalSaving}
                >
                  <Save size={14} />
                  <span>{modalSaving ? "SAVING..." : "SAVE DESTINATION"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
