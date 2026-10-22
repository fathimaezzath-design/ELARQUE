import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Tag,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import "./CouponManagement.css";

const ADMIN_API = "http://localhost:5000/api/admin/coupons";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const formatINR = (v) =>
  v != null
    ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "—";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const EMPTY_FORM = {
  code: "",
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
};

function validate(form) {
  const errs = {};
  if (!form.code.trim()) errs.code = "Code is required";
  if (!form.discountValue || Number(form.discountValue) <= 0)
    errs.discountValue = "Enter a valid discount value";
  if (!form.expiryDate) errs.expiryDate = "Expiry date is required";
  if (form.discountType === "percentage" && Number(form.discountValue) > 100)
    errs.discountValue = "Percentage cannot exceed 100";
  return errs;
}

function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await axios.get(ADMIN_API, {
        headers: adminHeader(),
        params,
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditTarget(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue || ""),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      minPurchase: String(coupon.minPurchase || "0"),
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      usageLimit: String(coupon.usageLimit || "1000"),
      userUsageLimit: String(coupon.userUsageLimit || "1"),
      isActive: Boolean(coupon.isActive),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
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
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minPurchase: Number(form.minPurchase) || 0,
        usageLimit: Number(form.usageLimit) || 1000,
        userUsageLimit: Number(form.userUsageLimit) || 1,
      };

      let res;
      if (editTarget) {
        res = await axios.put(`${ADMIN_API}/${editTarget._id}`, payload, {
          headers: adminHeader(),
        });
      } else {
        res = await axios.post(ADMIN_API, payload, { headers: adminHeader() });
      }

      showAlert("success", res.data.message || "Coupon saved successfully.");
      closeModal();
      fetchCoupons();
    } catch (err) {
      setFormErrors({ form: err.response?.data?.message || "Failed to save coupon." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      const res = await axios.patch(
        `${ADMIN_API}/${coupon._id}/toggle`,
        {},
        { headers: adminHeader() }
      );
      showAlert("success", res.data.message);
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: res.data.isActive } : c))
      );
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete privilege code "${coupon.code}"?`)) return;
    try {
      const res = await axios.delete(`${ADMIN_API}/${coupon._id}`, {
        headers: adminHeader(),
      });
      showAlert("success", res.data.message);
      fetchCoupons();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to delete coupon.");
    }
  };

  const statusOf = (coupon) => {
    if (coupon.isExpired) return "expired";
    return coupon.isActive ? "active" : "inactive";
  };

  return (
    <div className="el-cm-root">
      {/* Header */}
      <div className="el-cm-header">
        <div className="el-cm-title-group">
          <span className="el-cm-eyebrow">Admin Panel · Privilege Codes</span>
          <h1>Coupon Management</h1>
        </div>
        <button type="button" className="el-cm-btn-create" id="create-coupon-btn" onClick={openCreate}>
          <Plus size={14} />
          <span>CREATE CODE</span>
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`el-cm-alert ${alert.type}`}>
          {alert.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="el-cm-toolbar">
        <select
          className="el-cm-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Coupons</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <span className="el-cm-total-badge">{total} privilege code{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="el-cm-loading">
          <div className="el-cm-spinner" />
          <p>Loading privilege codes…</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="el-cm-empty">
          <Tag size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No coupons found. Create your first privilege code.</p>
        </div>
      ) : (
        <div className="el-cm-table-wrap">
          <table className="el-cm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Purchase</th>
                <th>Used / Limit</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span className="el-cm-code-pill">{c.code}</span>
                    {c.description && (
                      <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{c.description}</div>
                    )}
                  </td>
                  <td>
                    <span className={`el-cm-type-badge ${c.discountType === "percentage" ? "pct" : "fixed"}`}>
                      {c.discountType === "percentage" ? "%" : "₹"}
                    </span>
                  </td>
                  <td>
                    {c.discountType === "percentage"
                      ? `${c.discountValue}%`
                      : `₹${formatINR(c.discountValue)}`}
                    {c.maxDiscount ? (
                      <div style={{ fontSize: 11, color: "#666" }}>max ₹{formatINR(c.maxDiscount)}</div>
                    ) : null}
                  </td>
                  <td>₹{formatINR(c.minPurchase)}</td>
                  <td>{c.usedCount || 0} / {c.usageLimit || "∞"}</td>
                  <td>{formatDate(c.expiryDate)}</td>
                  <td>
                    <span className={`el-cm-status ${statusOf(c)}`}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                      {statusOf(c)}
                    </span>
                  </td>
                  <td>
                    <div className="el-cm-actions">
                      <button
                        type="button"
                        className={`el-cm-btn-icon toggle-${c.isActive ? "on" : "off"}`}
                        title={c.isActive ? "Deactivate" : "Activate"}
                        onClick={() => handleToggle(c)}
                      >
                        {c.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        type="button"
                        className="el-cm-btn-icon"
                        title="Edit"
                        onClick={() => openEdit(c)}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="el-cm-btn-icon del"
                        title="Delete"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="el-cm-pagination">
          <button className="el-cm-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`el-cm-page-btn ${p === page ? "active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="el-cm-page-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="el-cm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="el-cm-modal" role="dialog" aria-label={editTarget ? "Edit coupon" : "Create coupon"}>
            <div className="el-cm-modal-header">
              <h2>{editTarget ? `Edit · ${editTarget.code}` : "Create Privilege Code"}</h2>
              <button className="el-cm-modal-close" onClick={closeModal} disabled={saving}>
                <X size={18} />
              </button>
            </div>

            <div className="el-cm-modal-body">
              <form className="el-cm-form" onSubmit={handleSubmit}>

                {formErrors.form && (
                  <div className="el-cm-alert error">
                    <AlertTriangle size={14} />
                    <span>{formErrors.form}</span>
                  </div>
                )}

                {/* Code + Type */}
                <div className="el-cm-field-row">
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-code">Coupon Code *</label>
                    <input
                      id="cp-code"
                      name="code"
                      className={`el-cm-input${formErrors.code ? " error" : ""}`}
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="e.g. ELARQUE20"
                      maxLength={30}
                      disabled={Boolean(editTarget)}
                      style={editTarget ? { opacity: 0.6 } : {}}
                    />
                    {formErrors.code && <span className="el-cm-error-msg">{formErrors.code}</span>}
                  </div>
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-type">Discount Type</label>
                    <select id="cp-type" name="discountType" className="el-cm-select" value={form.discountType} onChange={handleFormChange}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Value + Max */}
                <div className="el-cm-field-row">
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-value">
                      Discount Value * {form.discountType === "percentage" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      id="cp-value"
                      name="discountValue"
                      type="number"
                      min="0"
                      max={form.discountType === "percentage" ? 100 : undefined}
                      step="any"
                      className={`el-cm-input${formErrors.discountValue ? " error" : ""}`}
                      value={form.discountValue}
                      onChange={handleFormChange}
                      placeholder={form.discountType === "percentage" ? "e.g. 15" : "e.g. 500"}
                    />
                    {formErrors.discountValue && <span className="el-cm-error-msg">{formErrors.discountValue}</span>}
                  </div>
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-maxdis">Max Discount Cap (₹)</label>
                    <input
                      id="cp-maxdis"
                      name="maxDiscount"
                      type="number"
                      min="0"
                      className="el-cm-input"
                      value={form.maxDiscount}
                      onChange={handleFormChange}
                      placeholder="Optional cap"
                    />
                  </div>
                </div>

                {/* Min Purchase + User Limit */}
                <div className="el-cm-field-row">
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-minpur">Min Purchase (₹)</label>
                    <input
                      id="cp-minpur"
                      name="minPurchase"
                      type="number"
                      min="0"
                      className="el-cm-input"
                      value={form.minPurchase}
                      onChange={handleFormChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-usrlimit">User Usage Limit</label>
                    <input
                      id="cp-usrlimit"
                      name="userUsageLimit"
                      type="number"
                      min="1"
                      className="el-cm-input"
                      value={form.userUsageLimit}
                      onChange={handleFormChange}
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="el-cm-field-row">
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-start">Start Date</label>
                    <input
                      id="cp-start"
                      name="startDate"
                      type="date"
                      className="el-cm-input"
                      value={form.startDate}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="el-cm-field">
                    <label className="el-cm-label" htmlFor="cp-expiry">Expiry Date *</label>
                    <input
                      id="cp-expiry"
                      name="expiryDate"
                      type="date"
                      className={`el-cm-input${formErrors.expiryDate ? " error" : ""}`}
                      value={form.expiryDate}
                      onChange={handleFormChange}
                    />
                    {formErrors.expiryDate && <span className="el-cm-error-msg">{formErrors.expiryDate}</span>}
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="el-cm-field">
                  <label className="el-cm-label" htmlFor="cp-uselimit">Total Usage Limit</label>
                  <input
                    id="cp-uselimit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    className="el-cm-input"
                    value={form.usageLimit}
                    onChange={handleFormChange}
                    placeholder="1000"
                  />
                </div>

                {/* Description */}
                <div className="el-cm-field">
                  <label className="el-cm-label" htmlFor="cp-desc">Description</label>
                  <textarea
                    id="cp-desc"
                    name="description"
                    className="el-cm-textarea"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Brief description shown to customers"
                    rows={2}
                  />
                </div>

                {/* Active toggle */}
                <div className="el-cm-toggle-row">
                  <input
                    type="checkbox"
                    id="cp-active"
                    name="isActive"
                    className="el-cm-checkbox"
                    checked={form.isActive}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="cp-active" className="el-cm-toggle-label">
                    Activate coupon immediately
                  </label>
                </div>

                <div className="el-cm-modal-footer">
                  <button type="button" className="el-cm-btn-cancel" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="el-cm-btn-submit" disabled={saving}>
                    {saving ? "Saving…" : editTarget ? "SAVE CHANGES" : "CREATE CODE"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponManagement;
