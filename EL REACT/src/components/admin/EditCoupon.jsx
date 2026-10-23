import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import "./AddCoupon.css";

const ADMIN_API = "http://localhost:5000/api/admin/coupons";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const formatINR = (v) =>
  v != null
    ? Number(v).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "—";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function validate(form) {
  const errs = {};
  if (!form.discountValue || Number(form.discountValue) <= 0)
    errs.discountValue = "Enter a valid discount value";
  if (form.discountType === "percentage" && Number(form.discountValue) > 100)
    errs.discountValue = "Percentage cannot exceed 100";
  if (!form.expiryDate) errs.expiryDate = "Expiry date is required";
  if (form.startDate && form.expiryDate && new Date(form.startDate) > new Date(form.expiryDate))
    errs.expiryDate = "Expiry must be after start date";
  return errs;
}

function EditCoupon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    title: "",
    categoryTag: "Seasonal",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minPurchase: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "1000",
    userUsageLimit: "1",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    const fetchCoupon = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${ADMIN_API}/${id}`, {
          headers: adminHeader(),
        });
        if (res.data.success && res.data.coupon) {
          const c = res.data.coupon;
          setForm({
            code: c.code || "",
            title: c.title || "",
            categoryTag: c.categoryTag || "Seasonal",
            description: c.description || "",
            discountType: c.discountType || "percentage",
            discountValue: String(c.discountValue || ""),
            maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
            minPurchase: String(c.minPurchase || "0"),
            startDate: c.startDate ? c.startDate.slice(0, 10) : "",
            expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "",
            usageLimit: String(c.usageLimit || "1000"),
            userUsageLimit: String(c.userUsageLimit || "1"),
            isActive: Boolean(c.isActive),
          });
        }
      } catch (err) {
        showAlert(
          "error",
          err.response?.data?.message || "Failed to load coupon."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCoupon();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      discountType: type,
      discountValue: "",
      maxDiscount: "",
    }));
    setFormErrors((prev) => ({ ...prev, discountValue: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        categoryTag: form.categoryTag,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minPurchase: Number(form.minPurchase) || 0,
        startDate: form.startDate,
        expiryDate: form.expiryDate,
        usageLimit: Number(form.usageLimit) || 1000,
        userUsageLimit: Number(form.userUsageLimit) || 1,
        isActive: form.isActive,
      };

      const res = await axios.put(`${ADMIN_API}/${id}`, payload, {
        headers: adminHeader(),
      });

      showAlert("success", res.data.message || "Coupon updated successfully.");
      setTimeout(() => navigate("/admin/coupons"), 1500);
    } catch (err) {
      showAlert(
        "error",
        err.response?.data?.message || "Failed to update coupon."
      );
    } finally {
      setSaving(false);
    }
  };

  // Live preview data
  const previewCode = form.code.trim().toUpperCase() || "PREVIEW";
  const previewDiscount = Number(form.discountValue) || 0;
  const previewUnit = form.discountType === "percentage" ? "%" : "₹";
  const previewMin = Number(form.minPurchase) || 0;
  const previewMax = form.maxDiscount ? Number(form.maxDiscount) : null;
  const previewExpiry = form.expiryDate || null;

  const barcodeLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 28; i++) {
      lines.push({
        height: Math.floor(Math.random() * 14) + 10,
        width: Math.random() > 0.4 ? 2 : 3,
      });
    }
    return lines;
  }, []);

  if (loading) {
    return (
      <div className="el-ac-root">
        <div className="el-ac-content">
          <div style={{ textAlign: "center", padding: "80px 0", color: "#8a7a6a" }}>
            <div className="el-cm-spinner" style={{
              width: 32, height: 32,
              border: "3px solid #e8e0d5", borderTopColor: "#C5A059",
              borderRadius: "50%", animation: "el-cm-spin 0.8s linear infinite",
              margin: "0 auto 16px"
            }} />
            <p>Loading privilege code…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="el-ac-root">
      <div className="el-ac-content">
        {/* Breadcrumb */}
        <div className="el-ac-breadcrumb-bar">
          <Link to="/admin/coupons" className="el-ac-back-btn">
            <ArrowLeft size={14} />
            Back to Coupons
          </Link>
          <span className="el-ac-yield-badge">Updating Privilege</span>
        </div>

        {/* Header */}
        <div className="el-ac-header">
          <span className="el-ac-header-eyebrow">
            Modifying Existing Salon Privilege
          </span>
          <h1>Edit Coupon · {form.code}</h1>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`el-ac-alert ${alert.type}`}>
            {alert.type === "success" ? (
              <CheckCircle size={15} />
            ) : (
              <AlertTriangle size={15} />
            )}
            <span>{alert.msg}</span>
          </div>
        )}

        {/* Main Layout */}
        <div className="el-ac-layout">
          {/* Form Section */}
          <div className="el-ac-form-section">
            <div className="el-ac-form-card">
              <div className="el-ac-form-label-header">
                Privilege Parameters · Edit Configuration
              </div>

              <form className="el-ac-form" onSubmit={handleSubmit}>
                {/* Code (read-only) */}
                <div className="el-ac-field">
                  <label className="el-ac-field-label" htmlFor="ec-code">
                    Coupon Code (Immutable)
                  </label>
                  <input
                    id="ec-code"
                    name="code"
                    className="el-ac-input"
                    value={form.code}
                    disabled
                    style={{ opacity: 0.6, textTransform: "uppercase" }}
                  />
                </div>

                {/* Title + Category Tag */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-title">
                      Promotion Title
                    </label>
                    <input
                      id="ec-title"
                      name="title"
                      className="el-ac-input"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. VIP SIGNATURE TIER"
                    />
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-category">
                      Category Tag
                    </label>
                    <select
                      id="ec-category"
                      name="categoryTag"
                      className="el-ac-select"
                      value={form.categoryTag}
                      onChange={handleChange}
                    >
                      <option value="Seasonal">Seasonal</option>
                      <option value="Private Salon">Private Salon</option>
                      <option value="New Patrons">New Patrons</option>
                      <option value="Flash Sale">Flash Sale</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                {/* Discount Type Toggle */}
                <div className="el-ac-field">
                  <label className="el-ac-field-label">Discount Type</label>
                  <div className="el-ac-type-toggle">
                    <button
                      type="button"
                      className={`el-ac-type-option ${form.discountType === "percentage" ? "active" : ""}`}
                      onClick={() => handleTypeChange("percentage")}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      className={`el-ac-type-option ${form.discountType === "fixed" ? "active" : ""}`}
                      onClick={() => handleTypeChange("fixed")}
                    >
                      Fixed Amount (₹)
                    </button>
                  </div>
                </div>

                {/* Discount Value + Max Discount */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-value">
                      Discount Value *{" "}
                      {form.discountType === "percentage" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      id="ec-value"
                      name="discountValue"
                      type="number"
                      min="0"
                      max={form.discountType === "percentage" ? 100 : undefined}
                      step="any"
                      className={`el-ac-input${formErrors.discountValue ? " error" : ""}`}
                      value={form.discountValue}
                      onChange={handleChange}
                      placeholder={
                        form.discountType === "percentage"
                          ? "e.g. 30"
                          : "e.g. 500"
                      }
                    />
                    {formErrors.discountValue && (
                      <span className="el-ac-error-msg">
                        {formErrors.discountValue}
                      </span>
                    )}
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-maxdis">
                      Max Discount Ceiling (₹)
                    </label>
                    <input
                      id="ec-maxdis"
                      name="maxDiscount"
                      type="number"
                      min="0"
                      className="el-ac-input"
                      value={form.maxDiscount}
                      onChange={handleChange}
                      placeholder="No ceiling"
                    />
                  </div>
                </div>

                {/* Min Purchase + Usage Cap */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-minpur">
                      Min Purchase (₹)
                    </label>
                    <input
                      id="ec-minpur"
                      name="minPurchase"
                      type="number"
                      min="0"
                      className="el-ac-input"
                      value={form.minPurchase}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-usagelimit">
                      Total Redemptions Cap
                    </label>
                    <input
                      id="ec-usagelimit"
                      name="usageLimit"
                      type="number"
                      min="1"
                      className="el-ac-input"
                      value={form.usageLimit}
                      onChange={handleChange}
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-start">
                      Activation Date
                    </label>
                    <input
                      id="ec-start"
                      name="startDate"
                      type="date"
                      className="el-ac-input"
                      value={form.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-expiry">
                      Expiration Date *
                    </label>
                    <input
                      id="ec-expiry"
                      name="expiryDate"
                      type="date"
                      className={`el-ac-input${formErrors.expiryDate ? " error" : ""}`}
                      value={form.expiryDate}
                      onChange={handleChange}
                    />
                    {formErrors.expiryDate && (
                      <span className="el-ac-error-msg">
                        {formErrors.expiryDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Per User Limit */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ec-usrlimit">
                      Per-Patron Limit
                    </label>
                    <input
                      id="ec-usrlimit"
                      name="userUsageLimit"
                      type="number"
                      min="1"
                      className="el-ac-input"
                      value={form.userUsageLimit}
                      onChange={handleChange}
                      placeholder="1"
                    />
                  </div>
                  <div className="el-ac-field" />
                </div>

                {/* Description */}
                <div className="el-ac-field full">
                  <label className="el-ac-field-label" htmlFor="ec-desc">
                    Description
                  </label>
                  <textarea
                    id="ec-desc"
                    name="description"
                    className="el-ac-textarea"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of this privilege..."
                    rows={3}
                  />
                </div>

                {/* Active Toggle */}
                <div className="el-ac-toggle-row">
                  <label className="el-ac-toggle-switch">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                    />
                    <span className="el-ac-toggle-slider" />
                  </label>
                  <span className="el-ac-toggle-text">
                    {form.isActive
                      ? "Active — Coupon is live at checkout"
                      : "Inactive — Coupon is hidden"}
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="el-ac-footer-bar">
                  <Link to="/admin/coupons" className="el-ac-btn-discard">
                    <X size={13} />
                    Discard & Cancel
                  </Link>
                  <button
                    type="submit"
                    className="el-ac-btn-submit"
                    disabled={saving}
                  >
                    <Save size={13} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Capsule Eligibility */}
            <div className="el-ac-capsule-box">
              <div className="el-ac-capsule-header">
                Capsule Eligibility Preview
              </div>
              <p className="el-ac-capsule-desc">
                Based on the current configuration, this privilege code will be
                applicable to:
              </p>
              <div className="el-ac-capsule-list">
                <div className="el-ac-capsule-item">
                  <span className="el-ac-capsule-dot" />
                  <span>
                    All products with minimum cart value of ₹
                    {formatINR(Number(form.minPurchase) || 0)}
                  </span>
                </div>
                <div className="el-ac-capsule-item">
                  <span className="el-ac-capsule-dot" />
                  <span>
                    {form.discountType === "percentage"
                      ? `Up to ${previewDiscount}% discount${
                          previewMax
                            ? ` capped at ₹${formatINR(previewMax)}`
                            : ""
                        }`
                      : `Flat ₹${formatINR(previewDiscount)} deduction`}
                  </span>
                </div>
                <div className="el-ac-capsule-item">
                  <span className="el-ac-capsule-dot" />
                  <span>
                    Max {Number(form.usageLimit) || 1000} total redemptions,{" "}
                    {Number(form.userUsageLimit) || 1} per patron
                  </span>
                </div>
                <div className="el-ac-capsule-item">
                  <span className="el-ac-capsule-dot" />
                  <span>Category: {form.categoryTag || "Seasonal"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Ticket Preview */}
          <div className="el-ac-preview-section">
            <div className="el-ac-ticket">
              <div className="el-ac-ticket-inner">
                <div className="el-ac-ticket-label">
                  Live Couture Ticket Preview
                </div>
                <div className="el-ac-ticket-code">{previewCode}</div>
                <div className="el-ac-ticket-title">
                  {form.title || "Untitled Privilege"}
                </div>

                <div className="el-ac-ticket-discount-row">
                  <span className="el-ac-ticket-discount">
                    {previewDiscount || "—"}
                  </span>
                  <span className="el-ac-ticket-discount-unit">
                    {previewUnit}{" "}
                    {form.discountType === "percentage" ? "OFF" : "FLAT"}
                  </span>
                </div>

                <div className="el-ac-ticket-meta">
                  <div className="el-ac-ticket-meta-item">
                    <span className="el-ac-ticket-meta-label">Min Purchase</span>
                    <span className="el-ac-ticket-meta-value">
                      ₹{formatINR(previewMin)}
                    </span>
                  </div>
                  <div className="el-ac-ticket-meta-item">
                    <span className="el-ac-ticket-meta-label">Max Discount</span>
                    <span className="el-ac-ticket-meta-value">
                      {previewMax ? `₹${formatINR(previewMax)}` : "No cap"}
                    </span>
                  </div>
                  <div className="el-ac-ticket-meta-item">
                    <span className="el-ac-ticket-meta-label">Valid Till</span>
                    <span className="el-ac-ticket-meta-value">
                      {previewExpiry ? formatDate(previewExpiry) : "—"}
                    </span>
                  </div>
                  <div className="el-ac-ticket-meta-item">
                    <span className="el-ac-ticket-meta-label">Status</span>
                    <span
                      className={`el-ac-ticket-status ${
                        form.isActive ? "active" : "inactive"
                      }`}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "currentColor",
                          display: "inline-block",
                        }}
                      />
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barcode */}
              <div className="el-ac-ticket-barcode">
                <div className="el-ac-ticket-barcode-lines">
                  {barcodeLines.map((l, i) => (
                    <div
                      key={i}
                      className="el-ac-ticket-barcode-line"
                      style={{ height: l.height, width: l.width }}
                    />
                  ))}
                </div>
                <span className="el-ac-ticket-id">
                  ELQ-{id ? id.slice(-6).toUpperCase() : "000000"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditCoupon;
