import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  Home,
  Building,
  Star,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Heart,
  Wallet,
  Ticket,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  addAddress,
  updateAddress,
  getAddresses,
  setDefaultAddress,
} from "../../services/addressService";
import { getProfile } from "../../services/authService";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./AddAddress.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `http://localhost:5000${image}`;
  return `http://localhost:5000/${image}`;
};

function AddAddress() {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode if /addresses/edit/:id
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/addresses";

  const isEditMode = Boolean(id);

  // Customer Profile State
  const [user, setUser] = useState(null);

  // Classification State
  const [classification, setClassification] = useState("HOME"); // "HOME" or "OFFICE"

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(null);

  // -------------------------------------------------------------------------
  // Auth & Profile Retrieval
  // -------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.data?.user) {
          const u = res.data.user;
          setUser(u);
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || u.fullName || "",
            phone: prev.phone || u.phoneNumber || "",
            email: prev.email || u.email || "",
          }));
        }
      } catch (err) {
        try {
          const cached = JSON.parse(localStorage.getItem("user") || "null");
          if (cached) {
            setUser(cached);
            setFormData((prev) => ({
              ...prev,
              fullName: prev.fullName || cached.fullName || "",
              phone: prev.phone || cached.phoneNumber || "",
              email: prev.email || cached.email || "",
            }));
          }
        } catch {
          // ignore
        }
      }
    };

    loadProfile();
  }, [navigate]);

  // -------------------------------------------------------------------------
  // Edit Mode: Load Address
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isEditMode) return;

    const loadAddressToEdit = async () => {
      try {
        const res = await getAddresses();
        const list = res?.data?.addresses || [];
        const target = list.find((a) => a._id === id);
        if (target) {
          const isOffice = target.house?.toLowerCase().includes("office");
          setClassification(isOffice ? "OFFICE" : "HOME");
          setFormData({
            fullName: target.fullName || "",
            phone: target.phone || "",
            email: user?.email || "",
            addressLine1: target.house || "",
            addressLine2: target.street || "",
            landmark: "",
            city: target.city || "",
            state: target.state || "",
            pincode: target.pincode || "",
            country: "India",
            isDefault: Boolean(target.isDefault),
          });
        }
      } catch (err) {
        console.error("Failed to load address to edit:", err);
      }
    };

    loadAddressToEdit();
  }, [id, isEditMode, user]);

  // -------------------------------------------------------------------------
  // Form Field Change Handler
  // -------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile contact is required";
    } else {
      const clean = formData.phone.replace(/\s|\+91/g, "").trim();
      if (!/^[0-9]{10}$/.test(clean)) {
        newErrors.phone = "Enter a valid 10-digit mobile number";
      }
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line 1 is required";
    }

    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";

    if (!formData.pincode.trim()) {
      newErrors.pincode = "PIN code is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit PIN code";
    }

    return newErrors;
  };

  // -------------------------------------------------------------------------
  // Submit Handler
  // -------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 180, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setGlobalNotice(null);

    try {
      const cleanPhone = formData.phone.replace(/\s|\+91/g, "").trim();

      // Format house with optional classification tag if desired
      const houseText = formData.addressLine1.trim();

      // Format street with optional landmark
      let streetText = formData.addressLine2.trim();
      if (formData.landmark.trim()) {
        streetText = streetText
          ? `${streetText}, Near ${formData.landmark.trim()}`
          : `Near ${formData.landmark.trim()}`;
      }
      if (!streetText) {
        streetText = formData.city.trim();
      }

      const payload = {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        house: houseText,
        street: streetText,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };

      let savedAddressId = null;

      if (isEditMode) {
        const res = await updateAddress(id, payload);
        savedAddressId = id;
      } else {
        const res = await addAddress(payload);
        savedAddressId = res?.data?.address?._id;
      }

      // If user toggled "Set as Default Address", call backend setDefaultAddress
      if (formData.isDefault && savedAddressId) {
        await setDefaultAddress(savedAddressId);
      }

      setGlobalNotice({
        type: "success",
        message: isEditMode
          ? "Address details updated successfully."
          : "Bespoke delivery destination registered successfully.",
      });

      // Smoothly navigate back after brief confirmation
      setTimeout(() => {
        navigate(redirectUrl);
      }, 1000);
    } catch (err) {
      console.error("Address save error:", err);
      setGlobalNotice({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to save delivery address. Please verify your details.",
      });
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="el-add-addr-page">
      <Navbar />

      <main className="el-add-addr-main">
        {/* ── Breadcrumb Bar (Matching Reference) ── */}
        <div className="el-add-addr-topbar">
          <nav className="el-add-addr-breadcrumb" aria-label="Breadcrumb">
            <span>CLIENT SALON</span>
            <span className="el-bc-sep">/</span>
            <Link to="/addresses">ADDRESSES</Link>
            <span className="el-bc-sep">/</span>
            <span className="el-bc-current">
              {isEditMode ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
            </span>
          </nav>

          <Link to="/addresses" className="el-add-addr-back-link">
            <ArrowLeft size={14} />
            <span>BACK TO SAVED ADDRESSES</span>
          </Link>
        </div>

        {/* ── Notification Banner ── */}
        {globalNotice && (
          <div
            className={`el-add-addr-notice ${globalNotice.type}`}
            role="alert"
          >
            {globalNotice.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{globalNotice.message}</span>
          </div>
        )}

        {/* ── Main Two-Column Layout ── */}
        <div className="el-add-addr-grid">
          {/* =========================================================
              LEFT COLUMN: Profile Sidebar
              ========================================================= */}
          <aside className="el-add-addr-sidebar">
            <div className="el-sidebar-profile-card">
              {/* Avatar with Golden Ring and Verified Badge */}
              <div className="el-sidebar-avatar-wrap">
                {user?.profileImage ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt={user.fullName || "Client"}
                    className="el-sidebar-avatar-img"
                  />
                ) : (
                  <div className="el-sidebar-avatar-placeholder">
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "S"}
                  </div>
                )}
                <div className="el-sidebar-verified-badge" title="Verified Client">
                  <CheckCircle2 size={13} color="#fff" />
                </div>
              </div>

              {/* Client Info */}
              <h2 className="el-sidebar-name">
                {user?.fullName || "Swaliha ezzath"}
              </h2>
              <p className="el-sidebar-kicker">Client since Winter 2026</p>

              {/* Divider */}
              <div className="el-sidebar-divider" />

              {/* Navigation Items */}
              <nav className="el-sidebar-nav">
                <button
                  type="button"
                  className="el-sidebar-nav-item"
                  onClick={() => navigate("/profile")}
                >
                  <div className="el-nav-left">
                    <User size={16} />
                    <span>PROFILE OVERVIEW</span>
                  </div>
                  <span className="el-nav-arrow">&gt;</span>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item"
                  onClick={() => navigate("/profile")}
                >
                  <div className="el-nav-left">
                    <Calendar size={16} />
                    <span>MY ORDERS</span>
                  </div>
                  <span className="el-nav-badge">
                    {user?.orderCount ? `${user.orderCount} ACTIVE` : "3 ACTIVE"}
                  </span>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item"
                  onClick={() => navigate("/wishlist")}
                >
                  <div className="el-nav-left">
                    <Heart size={16} />
                    <span>WISHLIST</span>
                  </div>
                  <span className="el-nav-badge">
                    {user?.wishlistCount ? `${user.wishlistCount}V` : "2V"}
                  </span>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item"
                  onClick={() => navigate("/wallet")}
                >
                  <div className="el-nav-left">
                    <Wallet size={16} />
                    <span>WALLET</span>
                  </div>
                  <span className="el-nav-val">
                    ₹{user?.wallet ? user.wallet.toLocaleString("en-IN") : "12,450"}
                  </span>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item"
                  onClick={() => navigate("/coupons")}
                >
                  <div className="el-nav-left">
                    <Ticket size={16} />
                    <span>COUPONS</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item active"
                  onClick={() => navigate("/addresses")}
                >
                  <div className="el-nav-left">
                    <MapPin size={16} />
                    <span>SAVED ADDRESSES</span>
                  </div>
                  <span className="el-nav-arrow">&rarr;</span>
                </button>

                <button
                  type="button"
                  className="el-sidebar-nav-item signout"
                  onClick={handleLogout}
                >
                  <div className="el-nav-left">
                    <LogOut size={16} />
                    <span>SIGN OUT</span>
                  </div>
                </button>
              </nav>
            </div>
          </aside>

          {/* =========================================================
              RIGHT COLUMN: Address Management Cards
              ========================================================= */}
          <div className="el-add-addr-content">
            {/* Header Box */}
            <header className="el-content-header-card">
              <span className="el-header-kicker">ADDRESS MANAGEMENT</span>
              <h1 className="el-header-title">
                {isEditMode ? "Edit Delivery Address" : "Add New Address"}
              </h1>
              <p className="el-header-desc">
                Save a bespoke delivery destination for your seasonal trunk shows,
                tailored commissions, and complimentary white-glove courier
                dispatches.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate>
              {/* ── CARD 1: Contact Verification ── */}
              <section className="el-form-card">
                <div className="el-form-card-head">
                  <span className="el-form-step-num">1</span>
                  <div>
                    <h2 className="el-form-card-title">Contact Verification</h2>
                    <p className="el-form-card-sub">
                      Used strictly for delivery notifications and hand-delivered
                      signature validation.
                    </p>
                  </div>
                </div>

                <div className="el-form-row-3">
                  {/* Full Name */}
                  <div className="el-field-group">
                    <label htmlFor="fullName">FULL NAME *</label>
                    <div className="el-field-box">
                      <User size={15} className="el-field-lead-icon" />
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        placeholder="Swaliha Beaumont"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.fullName && (
                      <span className="el-err-msg">{errors.fullName}</span>
                    )}
                  </div>

                  {/* Mobile Contact */}
                  <div className="el-field-group">
                    <label htmlFor="phone">MOBILE CONTACT *</label>
                    <div className="el-field-box">
                      <Phone size={15} className="el-field-lead-icon" />
                      <input
                        id="phone"
                        type="text"
                        name="phone"
                        placeholder="+91 98470 51234"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={15}
                      />
                    </div>
                    {errors.phone && (
                      <span className="el-err-msg">{errors.phone}</span>
                    )}
                  </div>

                  {/* Private Dispatch Email */}
                  <div className="el-field-group">
                    <label htmlFor="email">PRIVATE DISPATCH EMAIL *</label>
                    <div className="el-field-box">
                      <span className="el-field-at-symbol">@</span>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="swaliha.beaumont@salon-luxe.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CARD 2: Atelier Delivery Destination ── */}
              <section className="el-form-card">
                <div className="el-form-card-head">
                  <span className="el-form-step-num">2</span>
                  <div>
                    <h2 className="el-form-card-title">
                      Atelier Delivery Destination
                    </h2>
                    <p className="el-form-card-sub">
                      Provide precise architectural coordinates for private courier
                      transport.
                    </p>
                  </div>
                </div>

                {/* Destination Classification */}
                <div className="el-classification-section">
                  <span className="el-classification-label">
                    SELECT DESTINATION CLASSIFICATION
                  </span>
                  <div className="el-classification-buttons">
                    <button
                      type="button"
                      className={`el-btn-class ${
                        classification === "HOME" ? "active" : ""
                      }`}
                      onClick={() => setClassification("HOME")}
                    >
                      <Home size={14} />
                      <span>PRIMARY VILLA / HOME</span>
                    </button>

                    <button
                      type="button"
                      className={`el-btn-class ${
                        classification === "OFFICE" ? "active" : ""
                      }`}
                      onClick={() => setClassification("OFFICE")}
                    >
                      <Building size={14} />
                      <span>EXECUTIVE OFFICE</span>
                    </button>
                  </div>
                </div>

                {/* Address Line 1 */}
                <div className="el-field-group">
                  <label htmlFor="addressLine1">
                    ADDRESS LINE 1 (VILLA/APARTMENT NO., ESTATE, STREET) *
                  </label>
                  <div className="el-field-box">
                    <Building size={15} className="el-field-lead-icon" />
                    <input
                      id="addressLine1"
                      type="text"
                      name="addressLine1"
                      placeholder="Villa 14, Whispering Palms Estate, Beach Road"
                      value={formData.addressLine1}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.addressLine1 && (
                    <span className="el-err-msg">{errors.addressLine1}</span>
                  )}
                </div>

                {/* Address Line 2 & Landmark */}
                <div className="el-form-row-2">
                  <div className="el-field-group">
                    <label htmlFor="addressLine2">
                      ADDRESS LINE 2 (WING, FLOOR, SUITE - OPTIONAL)
                    </label>
                    <div className="el-field-box">
                      <input
                        id="addressLine2"
                        type="text"
                        name="addressLine2"
                        placeholder="Penthouse Suite, North Wing"
                        value={formData.addressLine2}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="el-field-group">
                    <label htmlFor="landmark">
                      PROMINENT ARCHITECTURAL LANDMARK (OPTIONAL)
                    </label>
                    <div className="el-field-box">
                      <input
                        id="landmark"
                        type="text"
                        name="landmark"
                        placeholder="Adjacent to Grand Promenade &amp; Palm Bay Club"
                        value={formData.landmark}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* City, State, Pin Code, Country */}
                <div className="el-form-row-4">
                  <div className="el-field-group">
                    <label htmlFor="city">CITY</label>
                    <div className="el-field-box">
                      <input
                        id="city"
                        type="text"
                        name="city"
                        placeholder="Kozhikode (Calicut)"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.city && (
                      <span className="el-err-msg">{errors.city}</span>
                    )}
                  </div>

                  <div className="el-field-group">
                    <label htmlFor="state">STATE</label>
                    <div className="el-field-box">
                      <input
                        id="state"
                        type="text"
                        name="state"
                        placeholder="Kerala"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.state && (
                      <span className="el-err-msg">{errors.state}</span>
                    )}
                  </div>

                  <div className="el-field-group">
                    <label htmlFor="pincode">PIN CODE</label>
                    <div className="el-field-box">
                      <input
                        id="pincode"
                        type="text"
                        name="pincode"
                        placeholder="673001"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.pincode && (
                      <span className="el-err-msg">{errors.pincode}</span>
                    )}
                  </div>

                  <div className="el-field-group">
                    <label htmlFor="country">COUNTRY</label>
                    <div className="el-field-box">
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      >
                        <option value="India">India</option>
                        <option value="United Arab Emirates">
                          United Arab Emirates
                        </option>
                        <option value="France">France</option>
                        <option value="United Kingdom">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CARD 3: Set as Default Address ── */}
              <section className="el-form-card el-default-toggle-card">
                <div className="el-default-toggle-info">
                  <div className="el-default-title-row">
                    <Star size={16} className="el-star-icon" />
                    <span className="el-default-title">Set as Default Address</span>
                  </div>
                  <p className="el-default-sub">
                    This destination will be automatically designated for express
                    bespoke fittings, runway previews, and complimentary annual
                    monograph gift parcels.
                  </p>
                </div>

                <label className="el-switch" aria-label="Toggle Default Address">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                  />
                  <span className="el-slider" />
                </label>
              </section>

              {/* ── Actions Row ── */}
              <div className="el-form-bottom-actions">
                <button
                  type="button"
                  className="el-btn-cancel-flat"
                  onClick={() => navigate(redirectUrl)}
                  disabled={submitting}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="el-btn-add-address-pill"
                  disabled={submitting}
                >
                  <Lock size={15} />
                  <span>
                    {submitting
                      ? "SAVING DESTINATION..."
                      : isEditMode
                      ? "UPDATE ADDRESS"
                      : "ADD NEW ADDRESS"}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AddAddress;
