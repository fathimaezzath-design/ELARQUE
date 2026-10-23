import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
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

const EMPTY_FORM = {
  code: "",
  title: "",
  categoryTag: "Seasonal",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minPurchase: "",
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  usageLimit: "1000",
  userUsageLimit: "1",
  isActive: true,
};

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = "ELQ";
  let code = prefix;
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validate(form) {
  const errs = {};
  if (!form.code.trim()) errs.code = "Coupon code is required";
  if (form.code.trim().length < 3) errs.code = "Code must be at least 3 characters";
  if (!form.discountValue || Number(form.discountValue) <= 0)
    errs.discountValue = "Enter a valid discount value";
  if (form.discountType === "percentage" && Number(form.discountValue) > 100)
    errs.discountValue = "Percentage cannot exceed 100";
  if (!form.expiryDate) errs.expiryDate = "Expiry date is required";
  if (form.startDate && form.expiryDate && new Date(form.startDate) > new Date(form.expiryDate))
    errs.expiryDate = "Expiry must be after start date";
  return errs;
}

function AddCoupon() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

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

  const handleGenerateCode = () => {
    const newCode = generateCode();
    setForm((prev) => ({ ...prev, code: newCode }));
    setFormErrors((prev) => ({ ...prev, code: "" }));
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
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minPurchase: Number(form.minPurchase) || 0,
        usageLimit: Number(form.usageLimit) || 1000,
        userUsageLimit: Number(form.userUsageLimit) || 1,
      };

      const res = await axios.post(ADMIN_API, payload, {
        headers: adminHeader(),
      });

      showAlert("success", res.data.message || "Coupon created successfully.");
      setTimeout(() => navigate("/admin/coupons"), 1500);
    } catch (err) {
      showAlert(
        "error",
        err.response?.data?.message || "Failed to create coupon."
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

  // Barcode lines
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

  return (
    <div className="el-ac-root">
      <div className="el-ac-content">
        {/* Breadcrumb */}
        <div className="el-ac-breadcrumb-bar">
          <Link to="/admin/coupons" className="el-ac-back-btn">
            <ArrowLeft size={14} />
            Back to Coupons
          </Link>
          <span className="el-ac-yield-badge">Atelier Yield</span>
        </div>

        {/* Header */}
        <div className="el-ac-header">
          <span className="el-ac-header-eyebrow">
            Salon Concierge Discretionary Allocation
          </span>
          <h1>Create New Coupon</h1>
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
                Coupon Parameters · Privilege Configuration
              </div>

              <form className="el-ac-form" onSubmit={handleSubmit}>
                {/* Code */}
                <div className="el-ac-code-row">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ac-code">
                      Coupon Code *
                    </label>
                    <input
                      id="ac-code"
                      name="code"
                      className={`el-ac-input${formErrors.code ? " error" : ""}`}
                      value={form.code}
                      onChange={handleChange}
                      placeholder="e.g. ELARQUE20"
                      maxLength={30}
                      style={{ textTransform: "uppercase" }}
                    />
                    {formErrors.code && (
                      <span className="el-ac-error-msg">{formErrors.code}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="el-ac-code-gen-btn"
                    onClick={handleGenerateCode}
                    title="Generate random code"
                  >
                    <Zap size={12} style={{ marginRight: 4 }} />
                    Generate
                  </button>
                </div>

                {/* Title + Category Tag */}
                <div className="el-ac-field-grid">
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ac-title">
                      Promotion Title
                    </label>
                    <input
                      id="ac-title"
                      name="title"
                      className="el-ac-input"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. VIP SIGNATURE TIER"
                    />
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ac-category">
                      Category Tag
                    </label>
                    <select
                      id="ac-category"
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
                    <label className="el-ac-field-label" htmlFor="ac-value">
                      Discount Value *{" "}
                      {form.discountType === "percentage" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      id="ac-value"
                      name="discountValue"
                      type="number"
                      min="0"
                      max={form.discountType === "percentage" ? 100 : undefined}
                      step="any"
                      className={`el-ac-input${formErrors.discountValue ? " error" : ""}`}
                      value={form.discountValue}
                      onChange={handleChange}
                      placeholder={
                        form.discountType === "percentage" ? "e.g. 30" : "e.g. 500"
                      }
                    />
                    {formErrors.discountValue && (
                      <span className="el-ac-error-msg">
                        {formErrors.discountValue}
                      </span>
                    )}
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ac-maxdis">
                      Max Discount Ceiling (₹)
                    </label>
                    <input
                      id="ac-maxdis"
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
                    <label className="el-ac-field-label" htmlFor="ac-minpur">
                      Min Purchase (₹)
                    </label>
                    <input
                      id="ac-minpur"
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
                    <label className="el-ac-field-label" htmlFor="ac-usagelimit">
                      Total Redemptions Cap
                    </label>
                    <input
                      id="ac-usagelimit"
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
                    <label className="el-ac-field-label" htmlFor="ac-start">
                      Activation Date
                    </label>
                    <input
                      id="ac-start"
                      name="startDate"
                      type="date"
                      className="el-ac-input"
                      value={form.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="el-ac-field">
                    <label className="el-ac-field-label" htmlFor="ac-expiry">
                      Expiration Date *
                    </label>
                    <input
                      id="ac-expiry"
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
                    <label className="el-ac-field-label" htmlFor="ac-usrlimit">
                      Per-Patron Limit
                    </label>
                    <input
                      id="ac-usrlimit"
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
                  <label className="el-ac-field-label" htmlFor="ac-desc">
                    Description
                  </label>
                  <textarea
                    id="ac-desc"
                    name="description"
                    className="el-ac-textarea"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of this privilege shown to patrons at checkout..."
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
                  <Link
                    to="/admin/coupons"
                    className="el-ac-btn-discard"
                  >
                    <X size={13} />
                    Discard & Cancel
                  </Link>
                  <button
                    type="submit"
                    className="el-ac-btn-submit"
                    disabled={saving}
                  >
                    <Plus size={13} />
                    {saving
                      ? "Creating…"
                      : "Create & Activate Privilege"}
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
                          previewMax ? ` capped at ₹${formatINR(previewMax)}` : ""
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
                  <span>
                    Category: {form.categoryTag || "Seasonal"}
                  </span>
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
                    {previewUnit} {form.discountType === "percentage" ? "OFF" : "FLAT"}
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
                  ELQ-{Date.now().toString(36).toUpperCase().slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCoupon;
