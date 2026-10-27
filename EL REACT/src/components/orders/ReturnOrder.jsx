import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Upload,
  AlertCircle,
  MapPin,
  Clock,
  Truck,
  RotateCcw,
  ShieldCheck,
  Package,
  X,
  Wallet,
  Sparkles,
  Info,
} from "lucide-react";

import { getOrderDetails, requestOrderReturn, requestItemReturn } from "../../services/orderService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";
import "./ReturnOrder.css";

const FALLBACK_ITEM_IMG =
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80";

const RETURN_REASONS = [
  "Size or fit issue",
  "Damaged item",
  "Defective product",
  "Wrong item received",
  "Product differs from description",
  "Quality issue",
  "Other",
];

function ReturnOrder() {
  const navigate = useNavigate();
  const { id: orderId, itemId: paramItemId } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = paramItemId || searchParams.get("itemId");

  const [order, setOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState({
    fullName: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch Order and Item
  const loadOrderData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getOrderDetails(orderId);
      if (res?.data?.order) {
        const orderData = res.data.order;
        setOrder(orderData);

        // Check overall return eligibility
        const isDelivered = (orderData.orderStatus || "").toLowerCase() === "delivered";

        let targetItem = null;
        if (itemId) {
          targetItem = (orderData.items || []).find(
            (i) => String(i._id) === String(itemId)
          );
        } else {
          // If no item specified, take first active or default item
          targetItem = (orderData.items || [])[0];
        }

        if (!targetItem && orderData.items?.length > 0) {
          targetItem = orderData.items[0];
        }

        setSelectedItem(targetItem);

        // Pre-fill address from order shipping address
        const addr = targetItem?.pickupAddress?.fullName
          ? targetItem.pickupAddress
          : orderData.shippingAddress || {};
        setSelectedAddress(addr);
        setCustomAddress({
          fullName: addr.fullName || "",
          phone: addr.phone || "",
          house: addr.house || "",
          street: addr.street || "",
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
        });

        // Eligibility guards
        if (!isDelivered) {
          setError(
            `This order is currently "${orderData.orderStatus}". Returns are only accepted for delivered garments within our 7-day atelier privilege window.`
          );
        } else if (targetItem && targetItem.returnStatus && targetItem.returnStatus !== "None") {
          // Return already requested for this item!
          navigate(`/orders/${orderId}/return-details${itemId ? `?itemId=${itemId}` : ""}`);
        } else if (!itemId && orderData.returnStatus && orderData.returnStatus !== "None") {
          navigate(`/orders/${orderId}/return-details`);
        }
      } else {
        setError("Order commission could not be retrieved from the archive.");
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError(
        err.response?.data?.message || "Failed to load order information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, itemId, navigate]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // Handle Photo Upload (Simulated preview & base64/URL support)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      setFormError("A maximum of 5 supporting photos may be attached.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate mandatory reason
    if (!reason || !reason.trim()) {
      setFormError("Please select a mandatory return reason to proceed.");
      return;
    }

    if (!selectedAddress || !selectedAddress.fullName || !selectedAddress.phone) {
      setFormError("A complete white-glove pickup address is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        reason: reason.trim(),
        description: description.trim(),
        photos,
        preferredRefundMethod: "ELARQUE Wallet",
        pickupAddress: selectedAddress,
      };

      let res = null;
      if (itemId && order?.items?.length > 1) {
        res = await requestItemReturn(orderId, itemId, payload);
      } else {
        res = await requestOrderReturn(orderId, payload);
      }

      if (res?.data?.success) {
        // Navigate to confirmation page
        const refParam = res.data.returnReferenceId ? `&ref=${res.data.returnReferenceId}` : "";
        navigate(
          `/orders/${orderId}/return-confirmation${itemId ? `?itemId=${itemId}` : ""}${refParam}`
        );
      } else {
        setFormError(res?.data?.message || "Failed to submit return request.");
      }
    } catch (err) {
      console.error("Return submission error:", err);
      setFormError(
        err.response?.data?.message ||
          "An error occurred while submitting your return request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="el-ret-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-ret-loading-box">
          <div className="el-ret-spinner" />
          <p>Retrieving commission dossier...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="el-ret-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-ret-error-state-card">
          <AlertCircle size={36} color="#650D20" />
          <h2>Return Request Notice</h2>
          <p>{error}</p>
          <div className="el-ret-error-btn-row">
            <button
              type="button"
              className="el-ret-btn-burgundy"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              RETURN TO ORDER
            </button>
            <button
              type="button"
              className="el-ret-btn-outline"
              onClick={() => navigate("/orders")}
            >
              VIEW MY COMMISSIONS
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const orderNum = order?.orderNumber || `#ELQ-${String(orderId).slice(-6).toUpperCase()}`;
  const itemImg = selectedItem?.productImage || FALLBACK_ITEM_IMG;
  const resolvedImg = itemImg.startsWith("http") ? itemImg : `http://localhost:5000${itemImg}`;

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "20 July 2026";
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? "20 July 2026"
      : d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  return (
    <div className="el-ret-page-root">
      <AnnouncementBar />
      <Navbar />

      <main className="el-ret-main-container">
        {/* Page Header */}
        <div className="el-ret-header-center">
          <h1 className="el-ret-page-title">Return Your Order</h1>
          <p className="el-ret-page-subtitle">
            We're here to make returns effortless. Tell us why you'd like to return your item and
            we'll take care of the rest with dedicated salon white-glove pickup.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="el-ret-content-grid">
          {/* =====================================================
              LEFT COLUMN: PRODUCT INFORMATION & GUARANTEE
          ===================================================== */}
          <aside className="el-ret-left-column">
            {/* Product Card */}
            <div className="el-ret-product-card">
              <div className="el-ret-product-thumb-container">
                <img
                  src={resolvedImg}
                  alt={selectedItem?.productName || "Atelier Piece"}
                  className="el-ret-product-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_ITEM_IMG;
                  }}
                />
                <span className="el-ret-badge-delivered">• DELIVERED</span>
                <span className="el-ret-badge-ordernum">ORDER {orderNum}</span>
                <div className="el-ret-thumb-bottom-pill">
                  <span className="el-ret-pill-dot">•</span> ATELIER NO. 048 • BIELLA WOOL
                </div>
              </div>

              <div className="el-ret-product-details">
                <span className="el-ret-collection-tag">
                  FORMAL COLLECTION • ATELIER SERIES
                </span>
                <h3 className="el-ret-product-name">
                  {selectedItem?.productName || "ELARQUE Signature Blazer Dress"}
                </h3>

                {/* Specs Grid */}
                <div className="el-ret-specs-grid">
                  <div className="el-ret-spec-item">
                    <span className="el-ret-spec-label">SIZE</span>
                    <span className="el-ret-spec-val">
                      {selectedItem?.variant?.size || selectedItem?.size || "M (FR 38)"}
                    </span>
                  </div>
                  <div className="el-ret-spec-item">
                    <span className="el-ret-spec-label">COLOR</span>
                    <span className="el-ret-spec-val color-val">
                      <span className="el-ret-color-dot" />
                      {selectedItem?.variant?.color || selectedItem?.color || "Vintage Burgundy"}
                    </span>
                  </div>
                  <div className="el-ret-spec-item">
                    <span className="el-ret-spec-label">DELIVERED DATE</span>
                    <span className="el-ret-spec-val">
                      {formatDateDisplay(order?.deliveredDate || order?.orderDate)}
                    </span>
                  </div>
                  <div className="el-ret-spec-item">
                    <span className="el-ret-spec-label">COMMISSION PRICE</span>
                    <span className="el-ret-spec-val price">
                      {formatPrice(selectedItem?.price || selectedItem?.itemTotal || order?.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Stylist Consultation Notice */}
                <div className="el-ret-stylist-box">
                  <Info size={16} className="el-ret-stylist-icon" />
                  <p>
                    Need sizing advice or alteration instead of a return? Your dedicated salon
                    stylist <strong>Camille Laurent</strong> is available for instant fitting
                    consultation.
                  </p>
                </div>
              </div>
            </div>

            {/* ELARQUE Return Guarantee Card */}
            <div className="el-ret-guarantee-card">
              <div className="el-ret-guarantee-header">
                <Sparkles size={16} color="#8A775C" />
                <h4>ELARQUE Return Guarantee</h4>
              </div>

              <div className="el-ret-guarantee-grid">
                <div className="el-ret-guarantee-item">
                  <div className="el-ret-g-icon-wrap">
                    <Clock size={16} />
                  </div>
                  <div>
                    <strong>7-Day Privilege</strong>
                    <p>Complimentary salon window</p>
                  </div>
                </div>

                <div className="el-ret-guarantee-item">
                  <div className="el-ret-g-icon-wrap">
                    <Truck size={16} />
                  </div>
                  <div>
                    <strong>Free Courier Pickup</strong>
                    <p>White-glove courier to doorstep</p>
                  </div>
                </div>

                <div className="el-ret-guarantee-item">
                  <div className="el-ret-g-icon-wrap">
                    <RotateCcw size={16} />
                  </div>
                  <div>
                    <strong>Instant Wallet Refund</strong>
                    <p>Credited to ELARQUE Wallet</p>
                  </div>
                </div>

                <div className="el-ret-guarantee-item">
                  <div className="el-ret-g-icon-wrap">
                    <Package size={16} />
                  </div>
                  <div>
                    <strong>Tags Attached</strong>
                    <p>Original seal & packaging</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* =====================================================
              RIGHT COLUMN: RETURN FORM
          ===================================================== */}
          <section className="el-ret-right-column">
            <form className="el-ret-form-card" onSubmit={handleSubmit}>
              {formError && (
                <div className="el-ret-alert-banner">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. SELECT REASON FOR RETURN */}
              <div className="el-ret-field-block">
                <label htmlFor="return-reason-input" className="el-ret-field-label">
                  1. SELECT REASON FOR RETURN <span className="el-ret-required">*</span>
                </label>
                <div className="el-ret-select-wrap">
                  <select
                    id="return-reason-input"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (formError) setFormError("");
                    }}
                    className="el-ret-select"
                    required
                  >
                    <option value="">Please choose a return reason...</option>
                    {RETURN_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. RETURN DESCRIPTION */}
              <div className="el-ret-field-block">
                <div className="el-ret-label-between">
                  <label htmlFor="return-desc-textarea" className="el-ret-field-label">
                    2. RETURN DESCRIPTION <span className="el-ret-required">*</span>
                  </label>
                  <span className="el-ret-counter">{description.length} / 500 characters</span>
                </div>
                <textarea
                  id="return-desc-textarea"
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please tell us why you'd like to return this item. Specific notes on fit, tailored measurements, or garment details help our master cutters improve future commissions."
                  className="el-ret-textarea"
                />
              </div>

              {/* 3. UPLOAD SUPPORTING PHOTOS */}
              <div className="el-ret-field-block">
                <div className="el-ret-label-between">
                  <label className="el-ret-field-label">
                    3. UPLOAD SUPPORTING PHOTOS <span className="el-ret-optional">(optional)</span>
                  </label>
                  <span className="el-ret-photo-rules">Max 5 photos • JPG, PNG, WEBP</span>
                </div>

                <div className="el-ret-upload-dropzone">
                  <input
                    type="file"
                    id="photo-upload-input"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handlePhotoUpload}
                    className="el-ret-hidden-file-input"
                    disabled={photos.length >= 5}
                  />
                  <label htmlFor="photo-upload-input" className="el-ret-dropzone-inner">
                    <div className="el-ret-upload-icon-circle">
                      <Upload size={18} color="#650D20" />
                    </div>
                    <p className="el-ret-drop-prompt">
                      <strong>Click to browse files</strong> or drag and drop leaks here
                    </p>
                    <span className="el-ret-drop-hint">
                      Helpful for fabric flaws, tag verification, or tailored drape reference
                    </span>
                  </label>
                </div>

                {/* Thumbnails Row */}
                {photos.length > 0 && (
                  <div className="el-ret-thumbnails-row">
                    {photos.map((src, index) => (
                      <div key={index} className="el-ret-photo-thumb-wrap">
                        <img src={src} alt={`Upload ${index + 1}`} className="el-ret-photo-thumb" />
                        <button
                          type="button"
                          className="el-ret-remove-photo-btn"
                          onClick={() => removePhoto(index)}
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <label htmlFor="photo-upload-input" className="el-ret-add-photo-chip">
                        <span>+ ADD</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* 4. REFUND METHOD — ELARQUE WALLET ONLY */}
              <div className="el-ret-field-block">
                <label className="el-ret-field-label">
                  4. REFUND METHOD
                </label>
                <div className="el-ret-wallet-only-panel">
                  <div className="el-ret-wallet-only-icon">
                    <Wallet size={22} color="#650D20" />
                  </div>
                  <div className="el-ret-wallet-only-body">
                    <strong className="el-ret-wallet-only-title">ELARQUE Wallet — Instant Refund</strong>
                    <p className="el-ret-wallet-only-desc">
                      All approved return refunds are credited exclusively to your ELARQUE Wallet.
                      Your balance will be updated instantly upon admin approval and can be used
                      toward any future purchase.
                    </p>
                    <span className="el-ret-wallet-only-badge">✦ SECURE · INSTANT · WALLET-ONLY</span>
                  </div>
                </div>
              </div>

              {/* Complimentary White-Glove Pickup Address */}
              <div className="el-ret-address-banner">
                <div className="el-ret-addr-left">
                  <MapPin size={16} className="el-ret-addr-icon" />
                  <div>
                    <span className="el-ret-addr-label">
                      Complimentary White-Glove Pickup Address:
                    </span>
                    <p className="el-ret-addr-text">
                      {selectedAddress?.fullName || "Swaliha Beaumont"} •{" "}
                      {[
                        selectedAddress?.house,
                        selectedAddress?.street,
                        selectedAddress?.city,
                        selectedAddress?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="el-ret-addr-change-btn"
                  onClick={() => setIsChangingAddress(!isChangingAddress)}
                >
                  {isChangingAddress ? "KEEP" : "CHANGE"}
                </button>
              </div>

              {/* Edit Address Inline (Collapsible) */}
              {isChangingAddress && (
                <div className="el-ret-address-edit-box">
                  <div className="el-ret-addr-edit-row">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={customAddress.fullName}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, fullName: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={customAddress.phone}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, phone: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                  </div>
                  <div className="el-ret-addr-edit-row">
                    <input
                      type="text"
                      placeholder="House / Villa / Suite"
                      value={customAddress.house}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, house: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                    <input
                      type="text"
                      placeholder="Street / Avenue"
                      value={customAddress.street}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, street: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                  </div>
                  <div className="el-ret-addr-edit-row three-col">
                    <input
                      type="text"
                      placeholder="City"
                      value={customAddress.city}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, city: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={customAddress.state}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, state: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={customAddress.pincode}
                      onChange={(e) =>
                        setCustomAddress({ ...customAddress, pincode: e.target.value })
                      }
                      className="el-ret-addr-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="el-ret-btn-save-addr"
                    onClick={() => {
                      setSelectedAddress({ ...customAddress });
                      setIsChangingAddress(false);
                    }}
                  >
                    APPLY PICKUP ADDRESS
                  </button>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="el-ret-buttons-row">
                <button
                  type="submit"
                  className="el-ret-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? "RECORDING DOSSIER..." : "SUBMIT RETURN REQUEST ➔"}
                </button>
                <button
                  type="button"
                  className="el-ret-btn-cancel"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  disabled={submitting}
                >
                  CANCEL
                </button>
              </div>

              {/* Security Protocol Note */}
              <div className="el-ret-security-note">
                <ShieldCheck size={13} color="#8A775C" />
                <span>256-Bit Encrypted Patron Session • Guaranteed Archival Protocol</span>
              </div>
            </form>
          </section>
        </div>

        {/* =====================================================
            BOTTOM: RETURN PROCESS TIMELINE
        ===================================================== */}
        <section className="el-ret-timeline-banner">
          <div className="el-ret-timeline-header">
            <div>
              <h3 className="el-ret-timeline-title">Return Process Timeline</h3>
              <p className="el-ret-timeline-desc">
                Standard protocol for white-glove reverse transit & atelier inspection
              </p>
            </div>
            <span className="el-ret-timeline-badge">5-STEP GUARANTEE</span>
          </div>

          <div className="el-ret-timeline-steps-row">
            {/* Step 1 */}
            <div className="el-ret-timeline-step current">
              <div className="el-ret-t-circle">1</div>
              <strong className="el-ret-t-title">Return Requested</strong>
              <span className="el-ret-t-sub">In Progress</span>
            </div>

            <div className="el-ret-t-line" />

            {/* Step 2 */}
            <div className="el-ret-timeline-step">
              <div className="el-ret-t-circle">2</div>
              <strong className="el-ret-t-title">Pickup Scheduled</strong>
              <span className="el-ret-t-sub">Within 24h</span>
            </div>

            <div className="el-ret-t-line" />

            {/* Step 3 */}
            <div className="el-ret-timeline-step">
              <div className="el-ret-t-circle">3</div>
              <strong className="el-ret-t-title">Item Collected</strong>
              <span className="el-ret-t-sub">White-Glove</span>
            </div>

            <div className="el-ret-t-line" />

            {/* Step 4 */}
            <div className="el-ret-timeline-step">
              <div className="el-ret-t-circle">4</div>
              <strong className="el-ret-t-title">Quality Check</strong>
              <span className="el-ret-t-sub">Paris Atelier</span>
            </div>

            <div className="el-ret-t-line" />

            {/* Step 5 */}
            <div className="el-ret-timeline-step">
              <div className="el-ret-t-circle">5</div>
              <strong className="el-ret-t-title">Refund Completed</strong>
              <span className="el-ret-t-sub">To ELARQUE Wallet</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ReturnOrder;
