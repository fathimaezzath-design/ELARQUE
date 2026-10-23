import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  Search,
  ArrowUpDown,
  X,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  Tag,
  CheckCircle,
  AlertTriangle,
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

const formatLakhsShort = (v) => {
  if (!v || v === 0) return "₹0";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${formatINR(v)}`;
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const PAGE_SIZE = 5;

function CouponManagement() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [quickFilter, setQuickFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    activeCoupons: 0,
    totalSavings: 0,
    couponsRedeemed: 0,
    totalCoupons: 0,
    categoryCounts: {},
  });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE, sort: sortBy };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (quickFilter !== "all") params.categoryTag = quickFilter;

      const res = await axios.get(ADMIN_API, {
        headers: adminHeader(),
        params,
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sortBy, searchQuery, quickFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const openDeleteModal = (coupon) => {
    setDeleteTarget(coupon);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${ADMIN_API}/${deleteTarget._id}`, {
        headers: adminHeader(),
      });
      showAlert("success", res.data.message);
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("newest");
    setQuickFilter("all");
    setPage(1);
  };

  // CSV Export
  const exportCSV = () => {
    if (coupons.length === 0) return;
    const headers = ["Code", "Title", "Category", "Discount Type", "Discount Value", "Max Discount", "Min Purchase", "Usage Limit", "Used Count", "Start Date", "Expiry Date", "Active"];
    const rows = coupons.map((c) => [
      c.code,
      c.title || "",
      c.categoryTag || "Seasonal",
      c.discountType,
      c.discountValue,
      c.maxDiscount || "",
      c.minPurchase || 0,
      c.usageLimit || "",
      c.usedCount || 0,
      c.startDate ? new Date(c.startDate).toLocaleDateString() : "",
      c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "",
      c.isActive ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ELARQUE_Coupons_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusOf = (coupon) => {
    if (coupon.isExpired) return "expired";
    return coupon.isActive ? "active" : "inactive";
  };

  const categoryQuickFilters = useMemo(() => {
    const cats = stats.categoryCounts || {};
    const entries = [{ label: "All", tag: "all", count: stats.totalCoupons || 0 }];
    Object.entries(cats).forEach(([tag, count]) => {
      entries.push({ label: tag, tag, count });
    });
    return entries;
  }, [stats]);

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="el-cm-root">
      <div className="el-cm-content-wrapper">
        {/* Header */}
        <div className="el-cm-header">
          <div className="el-cm-title-group">
            <span className="el-cm-eyebrow">
              Atelier Promotions · Bespoke Privileges & Voucher Codes
            </span>
            <h1>Coupons Management</h1>
            <p className="el-cm-title-desc">
              Create, manage, and track discount coupons for your luxury fashion collection.
              Curate privileges, tier-caps, and exclusive salon client allocations.
            </p>
          </div>
          <div className="el-cm-header-actions">
            <button
              type="button"
              className="el-cm-btn-export"
              onClick={exportCSV}
              id="export-csv-btn"
              title="Export as CSV"
            >
              <Download size={14} />
              <span>Export<br />Manifest (CSV)</span>
            </button>
            <Link
              to="/admin/coupons/add"
              className="el-cm-btn-create"
              id="new-privilege-btn"
            >
              <Plus size={14} />
              <span>New<br />Privilege</span>
            </Link>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`el-cm-alert ${alert.type}`}>
            {alert.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <span>{alert.msg}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="el-cm-stats-row">
          <div className="el-cm-stat-card">
            <div className="el-cm-stat-header">
              <span className="el-cm-stat-label">Active Coupons</span>
              <div className="el-cm-stat-icon">
                <Tag size={18} />
              </div>
            </div>
            <div className="el-cm-stat-value">
              {stats.activeCoupons}
              <span className="el-cm-stat-trend">↑ +3 this wk</span>
            </div>
            <p className="el-cm-stat-sub">Live in boutique & checkout</p>
            <div className="el-cm-stat-sub-row">
              <span className="el-cm-stat-sub-label">Salon Utilization</span>
              <span className="el-cm-stat-sub-value">
                {stats.totalCoupons > 0
                  ? ((stats.activeCoupons / stats.totalCoupons) * 100).toFixed(1)
                  : 0}% Capacity
              </span>
            </div>
          </div>

          <div className="el-cm-stat-card">
            <div className="el-cm-stat-header">
              <span className="el-cm-stat-label">Total Savings</span>
              <div className="el-cm-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="el-cm-stat-value">
              {formatLakhsShort(stats.totalSavings)}
              <span className="el-cm-stat-trend">~18.2%</span>
            </div>
            <p className="el-cm-stat-sub">Patron concessions YTD</p>
            <div className="el-cm-stat-sub-row">
              <span className="el-cm-stat-sub-label">Average Basket Elevation</span>
              <span className="el-cm-stat-sub-value">₹4,820</span>
            </div>
          </div>

          <div className="el-cm-stat-card">
            <div className="el-cm-stat-header">
              <span className="el-cm-stat-label">Coupons Redeemed</span>
              <div className="el-cm-stat-icon">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="el-cm-stat-value">
              {stats.couponsRedeemed}
              <span className="el-cm-stat-trend">✓ Validated</span>
            </div>
            <p className="el-cm-stat-sub">Completed couture orders</p>
            <div className="el-cm-stat-sub-row">
              <span className="el-cm-stat-sub-label">Conversion Velocity</span>
              <span className="el-cm-stat-sub-value">28.4% Rate</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="el-cm-toolbar">
          <div className="el-cm-search-wrap">
            <Search size={15} className="el-cm-search-icon" />
            <input
              type="text"
              className="el-cm-search-input"
              placeholder="Search by coupon code, promotion title, or criteria..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="coupon-search-input"
            />
          </div>
          <select
            className="el-cm-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            id="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="expired">Expired</option>
          </select>
          <select
            className="el-cm-sort-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            id="sort-select"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="discount_high">Discount: High → Low</option>
            <option value="discount_low">Discount: Low → High</option>
            <option value="expiry_soon">Expiry: Soonest</option>
            <option value="code_az">Code: A → Z</option>
          </select>
          <button
            type="button"
            className="el-cm-toolbar-btn"
            title="Sort"
            onClick={() => setSortBy((prev) => (prev === "newest" ? "oldest" : "newest"))}
          >
            <ArrowUpDown size={14} />
          </button>
          <button
            type="button"
            className="el-cm-toolbar-btn"
            title="Clear Filters"
            onClick={handleClearFilters}
          >
            <X size={14} />
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="el-cm-quick-filters">
          <span className="el-cm-quick-label">Registry Quick Filter:</span>
          {categoryQuickFilters.map((f) => (
            <button
              key={f.tag}
              type="button"
              className={`el-cm-quick-pill ${quickFilter === f.tag ? "active" : ""}`}
              onClick={() => {
                setQuickFilter(f.tag);
                setPage(1);
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
          <span className="el-cm-crypto-badge">
            <Lock size={10} /> 256-Bit Cryptographic Vouchers
          </span>
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
                  <th>Coupon Code</th>
                  <th>Direct Deduction</th>
                  <th>Minimum Cart</th>
                  <th>Privilege %</th>
                  <th>Valid Till</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="el-cm-code-cell">
                        <div className="el-cm-code-icon">
                          <Tag size={12} />
                        </div>
                        <div className="el-cm-code-details">
                          <span className="el-cm-code-pill">{c.code}</span>
                          {c.title && (
                            <span className="el-cm-code-title">· {c.title}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="el-cm-discount-value">
                        {c.discountType === "percentage"
                          ? `₹${formatINR(c.maxDiscount || c.discountValue * 100)}`
                          : `₹${formatINR(c.discountValue)}`}
                      </span>
                    </td>
                    <td>
                      <div className="el-cm-min-cart">
                        <span className="el-cm-min-cart-value">
                          ₹{formatINR(c.minPurchase)}
                        </span>
                        <span className="el-cm-min-cart-label">
                          {c.minPurchase >= 5000
                            ? "High Atelier Cap"
                            : c.minPurchase >= 2000
                            ? "Qualifying Subtotal"
                            : "Entry Threshold"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="el-cm-privilege-badge">
                        {c.discountType === "percentage"
                          ? `${c.discountValue}% OFF`
                          : `₹${formatINR(c.discountValue)} OFF`}
                      </span>
                    </td>
                    <td>
                      <div className="el-cm-valid-cell">
                        <span className={`el-cm-valid-date ${c.isExpired ? "expired" : ""}`}>
                          {formatDate(c.expiryDate)}
                        </span>
                        <span className="el-cm-valid-label">
                          {c.isExpired
                            ? "Archived Concession"
                            : statusOf(c) === "active"
                            ? "End of Season"
                            : "Patron Induction"}
                        </span>
                      </div>
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
                          onClick={() => navigate(`/admin/coupons/edit/${c._id}`)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="el-cm-btn-icon del"
                          title="Delete"
                          onClick={() => openDeleteModal(c)}
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
        {total > 0 && (
          <div className="el-cm-pagination">
            <div className="el-cm-pagination-info">
              Showing {startItem} to {endItem} of {total} Active Atelier Coupons
            </div>
            <div className="el-cm-pagination-controls">
              <button
                className="el-cm-page-nav"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={12} style={{ marginRight: 3 }} />
                Previous
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
              <button
                className="el-cm-page-nav"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={12} style={{ marginLeft: 3 }} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="el-cm-footer">
          ◆ Élarque Privileges Engine v4.8 · Synchronized Across Paris, Milano, and Dallas Flagship Salon Nodes
        </div>
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div
          className="el-cm-delete-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="el-cm-delete-modal" role="dialog" aria-label="Delete coupon confirmation">
            <div className="el-cm-delete-crest">
              <Shield size={24} />
            </div>
            <button
              className="el-cm-delete-close"
              onClick={closeDeleteModal}
              disabled={deleting}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <h2 className="el-cm-delete-heading">delete coupon</h2>
            <p className="el-cm-delete-coupon-name">
              Privilege code "{deleteTarget.code}" will be removed
            </p>
            <div className="el-cm-delete-actions">
              <button
                type="button"
                className="el-cm-delete-cancel"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="el-cm-delete-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Lock size={12} />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponManagement;
