import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  Hourglass,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  FileText,
  Download,
  BookOpen,
  Copy,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  ArrowRight,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getReturnRequests,
  quickReturnAction,
} from "../../services/adminReturnService";
import formatPrice from "../../utils/formatPrice";
import "./ReturnManagement.css";

// Helper for relative time or date formatting
function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.round((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Submitted just now";
  if (diffInHours === 1) return "Submitted 1 hour ago";
  if (diffInHours < 24) return `Submitted ${diffInHours} hours ago`;
  if (diffInHours < 48) return "Submitted yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ReturnManagement = () => {
  const navigate = useNavigate();

  // State
  const [returnRequests, setReturnRequests] = useState([]);
  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingCount: 0,
    approvedCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    totalRefundedAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    item: null,
    action: "APPROVE", // "APPROVE" | "REJECT"
    rejectionReason: "",
    adminNote: "",
    submitting: false,
    error: null,
  });

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Show temporary toast
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Return Requests
  const loadReturnRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getReturnRequests({
        page: currentPage,
        limit: 10,
        status: activeTab,
        search: debouncedSearch,
        sort: sortBy,
      });

      if (res?.success) {
        setReturnRequests(res.returns || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching return requests:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load return requests. Please verify your connection."
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, debouncedSearch, sortBy]);

  useEffect(() => {
    loadReturnRequests();
  }, [loadReturnRequests]);

  // Copy order ID helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Order #${text} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Modal openers
  const openApproveModal = (item) => {
    setActionModal({
      isOpen: true,
      item,
      action: "APPROVE",
      rejectionReason: "",
      adminNote: "",
      submitting: false,
      error: null,
    });
  };

  const openRejectModal = (item) => {
    setActionModal({
      isOpen: true,
      item,
      action: "REJECT",
      rejectionReason: "",
      adminNote: "",
      submitting: false,
      error: null,
    });
  };

  // Submit Quick Action
  const handleActionSubmit = async (forcedAction) => {
    const currentAction = forcedAction || actionModal.action;

    if (currentAction === "REJECT" && !actionModal.rejectionReason.trim()) {
      setActionModal((prev) => ({
        ...prev,
        error: "Please provide an explanation for rejecting this return request.",
      }));
      return;
    }

    try {
      setActionModal((prev) => ({ ...prev, submitting: true, error: null }));

      const res = await quickReturnAction(actionModal.item.id, {
        action: currentAction,
        rejectionReason: actionModal.rejectionReason.trim(),
        adminNote: actionModal.adminNote.trim(),
      });

      if (res?.success) {
        showToast(
          currentAction === "APPROVE"
            ? `Return request for Order #${actionModal.item.orderNumber} approved.`
            : `Return request for Order #${actionModal.item.orderNumber} rejected.`
        );
        setActionModal({
          isOpen: false,
          item: null,
          action: "APPROVE",
          rejectionReason: "",
          adminNote: "",
          submitting: false,
          error: null,
        });
        loadReturnRequests();
      }
    } catch (err) {
      console.error("Quick action error:", err);
      setActionModal((prev) => ({
        ...prev,
        submitting: false,
        error:
          err?.response?.data?.message ||
          "Failed to process return action. Please try again.",
      }));
    }
  };

  // Export Ledger CSV
  const handleExportCSV = () => {
    if (!returnRequests.length) {
      showToast("No return requests available to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Product Name",
      "Variant",
      "Return Amount",
      "Return Reason",
      "Status",
      "Requested Date",
    ];

    const rows = returnRequests.map((r) => [
      `"${r.orderNumber || ""}"`,
      `"${r.customer?.fullName || ""}"`,
      `"${r.customer?.email || ""}"`,
      `"${r.productName || ""}"`,
      `"${r.variant?.size || ""} ${r.variant?.color || ""}"`,
      r.returnAmount || 0,
      `"${(r.returnReason || "").replace(/"/g, '""')}"`,
      `"${r.returnStatus || ""}"`,
      `"${new Date(r.returnRequestedAt).toISOString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ELARQUE_Returns_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Returns ledger exported successfully.");
  };

  // Helper for image URL
  const getProductImg = (path) => {
    if (!path) return "https://placehold.co/120x150/1b0e14/dfc28d?text=ELARQUE";
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <div className="admin-returns-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner" role="alert">
          <CheckCircle2 size={16} color="#DFC28D" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="admin-returns-container">
        {/* =========================================================================
            1. PAGE HEADER
            ========================================================================= */}
        <header className="admin-returns-header">
          <div className="admin-returns-title-group">
            <h1 className="admin-returns-heading">Return Requests</h1>
            <p className="admin-returns-subheading">
              Review, approve, reject, and manage customer return requests across
              Paris, Milan, and Dallas salons.
            </p>
          </div>

          <div className="admin-returns-header-actions">
            <button
              type="button"
              className="el-btn-atelier-policies"
              onClick={() => setPolicyModalOpen(true)}
            >
              <BookOpen size={14} />
              <span>ATELIER POLICIES</span>
            </button>

            <button
              type="button"
              className="el-btn-export-ledger"
              onClick={handleExportCSV}
            >
              <Download size={14} />
              <span>EXPORT RETURNS LEDGER (CSV)</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. SUMMARY STAT CARDS (REAL DB BACKED)
            ========================================================================= */}
        <section className="admin-returns-stats-grid" aria-label="Return Metrics">
          {/* Card 1: Total Return Requests */}
          <div className="admin-return-stat-card">
            <div className="admin-stat-card-top">
              <span className="admin-stat-card-title">TOTAL RETURN REQUESTS</span>
              <div className="admin-stat-icon-wrap gold">
                <Package size={15} />
              </div>
            </div>
            <div className="admin-stat-card-value">
              <span>{stats.totalReturns}</span>
              <span className="admin-stat-growth-tag">+4% m/m</span>
            </div>
            <p className="admin-stat-card-desc">All-time catalog lifecycle</p>
          </div>

          {/* Card 2: Pending Requests */}
          <div className="admin-return-stat-card">
            <div className="admin-stat-card-top">
              <span className="admin-stat-card-title">PENDING REQUESTS</span>
              <div className="admin-stat-icon-wrap bronze">
                <Hourglass size={15} />
              </div>
            </div>
            <div className="admin-stat-card-value">
              <span>{stats.pendingCount}</span>
              {stats.pendingCount > 0 && (
                <span className="admin-stat-priority-tag">● Priority</span>
              )}
            </div>
            <p className="admin-stat-card-desc">Awaiting concierge triage</p>
          </div>

          {/* Card 3: Approved Returns */}
          <div className="admin-return-stat-card">
            <div className="admin-stat-card-top">
              <span className="admin-stat-card-title">APPROVED RETURNS</span>
              <div className="admin-stat-icon-wrap emerald">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="admin-stat-card-value">
              <span>{stats.approvedCount}</span>
              <span className="admin-stat-rate-tag">
                {stats.totalReturns > 0
                  ? `${Math.round((stats.approvedCount / stats.totalReturns) * 100)}% rate`
                  : "0% rate"}
              </span>
            </div>
            <p className="admin-stat-card-desc">Reverse logistics in transit</p>
          </div>

          {/* Card 4: Completed Refunds */}
          <div className="admin-return-stat-card">
            <div className="admin-stat-card-top">
              <span className="admin-stat-card-title">COMPLETED REFUNDS</span>
              <div className="admin-stat-icon-wrap sapphire">
                <FileText size={15} />
              </div>
            </div>
            <div className="admin-stat-card-value">
              <span>{stats.completedCount}</span>
              <span className="admin-stat-vault-tag">Vault</span>
            </div>
            <p className="admin-stat-card-desc">
              {stats.totalRefundedAmount > 0
                ? `${formatPrice(stats.totalRefundedAmount)} credited to vault & bank`
                : "Credited to vault & bank"}
            </p>
          </div>
        </section>

        {/* =========================================================================
            3. FILTER TABS & SEARCH TOOLBAR
            ========================================================================= */}
        <section className="admin-returns-toolbar" aria-label="Filters and Search">
          {/* Status Tabs */}
          <div className="admin-returns-tabs-wrapper">
            <button
              type="button"
              className={`admin-returns-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("ALL");
                setCurrentPage(1);
              }}
            >
              ALL REQUESTS ({stats.totalReturns})
            </button>

            <button
              type="button"
              className={`admin-returns-tab ${activeTab === "PENDING" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("PENDING");
                setCurrentPage(1);
              }}
            >
              PENDING ({stats.pendingCount})
            </button>

            <button
              type="button"
              className={`admin-returns-tab ${activeTab === "APPROVED" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("APPROVED");
                setCurrentPage(1);
              }}
            >
              APPROVED ({stats.approvedCount})
            </button>

            <button
              type="button"
              className={`admin-returns-tab ${activeTab === "REJECTED" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("REJECTED");
                setCurrentPage(1);
              }}
            >
              REJECTED ({stats.rejectedCount})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="admin-returns-search-sort-group">
            {/* Search Input */}
            <div className="admin-returns-search-wrap">
              <Search size={15} className="admin-returns-search-icon" />
              <input
                type="text"
                placeholder="Search by Order ID or Customer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-returns-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="admin-search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="admin-returns-sort-wrap">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-returns-sort-select"
              >
                <option value="newest">SORT: NEWEST FIRST</option>
                <option value="oldest">SORT: OLDEST FIRST</option>
                <option value="amount_high">SORT: HIGHEST AMOUNT</option>
                <option value="amount_low">SORT: LOWEST AMOUNT</option>
              </select>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. RETURN REQUESTS LIST
            ========================================================================= */}
        <section className="admin-returns-list-section">
          {loading ? (
            <div className="admin-returns-loading-state">
              <div className="el-spinner-burgundy" />
              <p>Curating Atelier Return Dossiers...</p>
            </div>
          ) : error ? (
            <div className="admin-returns-error-state">
              <AlertTriangle size={28} color="#EF4444" />
              <h3>Unable to load return dossiers</h3>
              <p>{error}</p>
              <button
                type="button"
                className="el-btn-retry"
                onClick={loadReturnRequests}
              >
                <RefreshCw size={14} /> Retry Retrieval
              </button>
            </div>
          ) : returnRequests.length === 0 ? (
            <div className="admin-returns-empty-state">
              <Package size={42} strokeWidth={1.2} color="#DFC28D" />
              <h3>No Return Requests Found</h3>
              <p>
                {searchQuery || activeTab !== "ALL"
                  ? "No dossiers match your current filter and search criteria."
                  : "All client orders remain in pristine active possession with zero pending return inquiries."}
              </p>
              {(searchQuery || activeTab !== "ALL") && (
                <button
                  type="button"
                  className="el-btn-reset-filters"
                  onClick={() => {
                    setActiveTab("ALL");
                    setSearchQuery("");
                    setSortBy("newest");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-returns-cards-grid">
              {returnRequests.map((ret, idx) => {
                const isPending = ret.returnStatus === "Pending";
                const isApproved = ret.returnStatus === "Approved" || ret.returnStatus === "Picked Up";
                const isRejected = ret.returnStatus === "Rejected";
                const isRefunded = ret.returnStatus === "Refunded";

                const city =
                  ret.customer?.shippingAddress?.city ||
                  ret.customer?.shippingAddress?.state ||
                  "PARIS";
                const salonTag = `SALON • ${city.toUpperCase()}`;

                return (
                  <article key={ret.id} className="admin-return-card">
                    {/* Left: Thumbnail with Look Badge */}
                    <div className="admin-return-media">
                      <img
                        src={getProductImg(ret.productImage)}
                        alt={ret.productName}
                        className="admin-return-thumb"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/120x150/1b0e14/dfc28d?text=ELARQUE";
                        }}
                      />
                      <span className="admin-return-look-badge">
                        {ret.variant?.size
                          ? `SIZE ${ret.variant.size}`
                          : `LOOK 0${(idx % 9) + 1}`}
                      </span>
                    </div>

                    {/* Center: Details & Reason */}
                    <div className="admin-return-body">
                      {/* Order Number & Timestamp */}
                      <div className="admin-return-meta-row">
                        <button
                          type="button"
                          className="admin-order-id-tag"
                          onClick={() => handleCopy(ret.orderNumber, ret.id)}
                          title="Click to copy order ID"
                        >
                          <span>#{ret.orderNumber}</span>
                          {copiedId === ret.id ? (
                            <Check size={11} color="#34D399" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                        <span className="admin-return-dot-separator">•</span>
                        <span className="admin-return-timestamp">
                          {formatRelativeTime(ret.returnRequestedAt)}
                        </span>
                      </div>

                      {/* Product Title */}
                      <h2 className="admin-return-product-title">
                        {ret.productName}
                      </h2>

                      {/* Customer Info & Patron Tag */}
                      <div className="admin-return-customer-row">
                        <span className="admin-return-customer-name">
                          {ret.customer?.fullName || "Private Patron"}
                        </span>
                        <span className="admin-patron-badge">
                          VIP CONCIERGE • {salonTag}
                        </span>
                      </div>

                      {/* Variant & Size */}
                      <div className="admin-return-variant-row">
                        <span>
                          Size: {ret.variant?.size || "M"}
                          {ret.variant?.color ? ` | Color: ${ret.variant.color}` : ""}
                        </span>
                      </div>

                      {/* Return Reason Callout */}
                      <div
                        className={`admin-return-reason-box ${
                          isRejected
                            ? "rejected-theme"
                            : isApproved
                            ? "approved-theme"
                            : ""
                        }`}
                      >
                        <span className="admin-reason-icon">
                          {isRejected ? (
                            <AlertTriangle size={13} color="#F87171" />
                          ) : isApproved ? (
                            <CheckCircle2 size={13} color="#34D399" />
                          ) : (
                            <AlertTriangle size={13} color="#DFC28D" />
                          )}
                        </span>
                        <p className="admin-reason-text">
                          <strong>Reason:</strong> {ret.returnReason}
                        </p>
                      </div>
                    </div>

                    {/* Right: Pricing, Status Badge & Actions */}
                    <div className="admin-return-actions-col">
                      <div className="admin-return-price-group">
                        <span className="admin-return-amount">
                          {formatPrice(ret.returnAmount)}
                        </span>
                        <span
                          className={`admin-return-status-badge ${ret.returnStatus.toLowerCase().replace(" ", "-")}`}
                        >
                          ● {ret.returnStatus.toUpperCase()}
                        </span>
                      </div>

                      <span className="admin-original-payment-label">
                        Original Payment: {ret.paymentMethod || "COD"}
                      </span>

                      {/* Action Buttons */}
                      <div className="admin-return-buttons-row">
                        {/* 1. View Details (Always available) */}
                        <button
                          type="button"
                          className="el-btn-action-view"
                          onClick={() => navigate(`/admin/returns/${ret.id}`)}
                          title="View Full Return Dossier"
                        >
                          <Eye size={13} />
                          <span>VIEW DETAILS</span>
                        </button>

                        {/* 2. Status-specific buttons */}
                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="el-btn-action-approve"
                              onClick={() => openApproveModal(ret)}
                            >
                              <CheckCircle2 size={13} />
                              <span>APPROVE</span>
                            </button>

                            <button
                              type="button"
                              className="el-btn-action-reject"
                              onClick={() => openRejectModal(ret)}
                            >
                              <XCircle size={13} />
                              <span>REJECT</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <>
                            <button
                              type="button"
                              className="el-btn-action-track"
                              onClick={() => navigate(`/admin/returns/${ret.id}`)}
                            >
                              <Truck size={13} />
                              <span>TRACK RETURN</span>
                            </button>

                            <button
                              type="button"
                              className="el-btn-action-refund"
                              onClick={() => navigate(`/admin/returns/${ret.id}`)}
                            >
                              <RotateCcw size={13} />
                              <span>ISSUE REFUND</span>
                            </button>
                          </>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            className="el-btn-action-dossier"
                            onClick={() => navigate(`/admin/returns/${ret.id}`)}
                          >
                            <FileText size={13} />
                            <span>DISPUTE DOSSIER</span>
                          </button>
                        )}

                        {isRefunded && (
                          <button
                            type="button"
                            className="el-btn-action-archived"
                            onClick={() => navigate(`/admin/returns/${ret.id}`)}
                          >
                            <ShieldCheck size={13} />
                            <span>ARCHIVED</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              5. PAGINATION CONTROLS
              ========================================================================= */}
          {!loading && !error && returnRequests.length > 0 && totalPages > 1 && (
            <div className="admin-returns-pagination">
              <button
                type="button"
                className="admin-pg-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                <span>PREVIOUS</span>
              </button>

              <div className="admin-pg-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    className={`admin-pg-number-btn ${currentPage === pg ? "active" : ""}`}
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="admin-pg-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>NEXT</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* =========================================================================
          6. ACTION REQUIRED MODAL (APPROVE / REJECT) - MATCHING SCREENSHOT 3
          ========================================================================= */}
      {actionModal.isOpen && actionModal.item && (
        <div
          className="admin-modal-backdrop"
          onClick={() =>
            !actionModal.submitting &&
            setActionModal((p) => ({ ...p, isOpen: false }))
          }
        >
          <div
            className="admin-action-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() =>
                !actionModal.submitting &&
                setActionModal((p) => ({ ...p, isOpen: false }))
              }
              disabled={actionModal.submitting}
            >
              <X size={16} />
            </button>

            {/* Modal Heading */}
            <div className="admin-action-dialog-header">
              <h2 className="admin-action-title">Action Required</h2>
              <p className="admin-action-subtitle">
                {actionModal.action === "APPROVE"
                  ? "Approve this return request and initiate reverse logistics?"
                  : "Reject this return request? Please provide justification."}
              </p>
            </div>

            {/* Product Card Preview (Matching Screenshot 3) */}
            <div className="admin-action-preview-card">
              <img
                src={getProductImg(actionModal.item.productImage)}
                alt={actionModal.item.productName}
                className="admin-action-preview-img"
              />
              <div className="admin-action-preview-info">
                <div className="admin-action-preview-top">
                  <span className="admin-action-customer-name">
                    {actionModal.item.customer?.fullName || "Private Client"}
                  </span>
                  <span className="admin-action-vip-pill">
                    Dallas Salon VIP
                  </span>
                </div>
                <h3 className="admin-action-item-name">
                  {actionModal.item.productName}
                </h3>
                <p className="admin-action-item-sub">
                  SIZE {actionModal.item.variant?.size || "M"} • SARTORIAL WOOL CREPE
                </p>

                <div className="admin-action-refund-row">
                  <span className="admin-action-refund-label">
                    REFUND CONSIDERATION
                  </span>
                  <span className="admin-action-refund-val">
                    {formatPrice(actionModal.item.returnAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Alert Banner */}
            <div className="admin-action-warning-banner">
              <AlertTriangle size={16} color="#EF4444" className="admin-warn-icon" />
              <p>
                Processing this action will notify the customer and update the
                inventory. This action <strong>cannot be undone</strong>.
              </p>
            </div>

            {/* If Rejecting: Mandatory Reason Input */}
            {actionModal.action === "REJECT" && (
              <div className="admin-action-input-group">
                <label className="admin-action-input-label">
                  REJECTION REASON (MANDATORY) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this request is being declined (e.g., return window expired, security tag detached)..."
                  value={actionModal.rejectionReason}
                  onChange={(e) =>
                    setActionModal((p) => ({
                      ...p,
                      rejectionReason: e.target.value,
                      error: null,
                    }))
                  }
                  className="admin-action-textarea"
                />
              </div>
            )}

            {/* Optional Internal Admin Note */}
            <div className="admin-action-input-group">
              <label className="admin-action-input-label">
                INTERNAL ATELIER DIRECTIVE NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="Private note for atelier records..."
                value={actionModal.adminNote}
                onChange={(e) =>
                  setActionModal((p) => ({ ...p, adminNote: e.target.value }))
                }
                className="admin-action-text-input"
              />
            </div>

            {/* Error Message */}
            {actionModal.error && (
              <div className="admin-action-error-note">
                <AlertTriangle size={13} color="#EF4444" />
                <span>{actionModal.error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="admin-action-dialog-buttons">
              <button
                type="button"
                className={`admin-btn-modal-reject ${
                  actionModal.action === "REJECT" ? "selected" : ""
                }`}
                disabled={actionModal.submitting}
                onClick={() => {
                  if (actionModal.action !== "REJECT") {
                    setActionModal((p) => ({ ...p, action: "REJECT" }));
                  } else {
                    handleActionSubmit("REJECT");
                  }
                }}
              >
                <XCircle size={15} />
                <span>
                  {actionModal.action === "REJECT" && actionModal.submitting
                    ? "REJECTING..."
                    : "REJECT RETURN"}
                </span>
              </button>

              <button
                type="button"
                className={`admin-btn-modal-approve ${
                  actionModal.action === "APPROVE" ? "selected" : ""
                }`}
                disabled={actionModal.submitting}
                onClick={() => {
                  if (actionModal.action !== "APPROVE") {
                    setActionModal((p) => ({ ...p, action: "APPROVE" }));
                  } else {
                    handleActionSubmit("APPROVE");
                  }
                }}
              >
                <CheckCircle2 size={15} />
                <span>
                  {actionModal.action === "APPROVE" && actionModal.submitting
                    ? "APPROVING..."
                    : "APPROVE RETURN"}
                </span>
              </button>
            </div>

            {/* Return to List Link */}
            <div className="admin-action-footer-link">
              <button
                type="button"
                className="admin-btn-back-link"
                onClick={() => setActionModal((p) => ({ ...p, isOpen: false }))}
                disabled={actionModal.submitting}
              >
                ← Return to List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. ATELIER POLICIES MODAL
          ========================================================================= */}
      {policyModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setPolicyModalOpen(false)}
        >
          <div
            className="admin-policies-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setPolicyModalOpen(false)}
            >
              <X size={16} />
            </button>

            <h2 className="admin-policies-title">ELARQUE Atelier Return Policies</h2>
            <p className="admin-policies-subtitle">
              Standard operating procedures for haute couture & ready-to-wear reverse logistics.
            </p>

            <div className="admin-policies-content">
              <div className="admin-policy-item">
                <h3>1. Inspection Window</h3>
                <p>
                  Returns must be initiated within 14 calendar days of confirmed white-glove
                  delivery. Archival or made-to-measure bespoke garments require senior curator authorization.
                </p>
              </div>
              <div className="admin-policy-item">
                <h3>2. Atelier Security Seal & Packaging</h3>
                <p>
                  All returned pieces must retain the original NFC tamper-evident security ribbon
                  unbroken, accompanied by the silk garment dustbag and bespoke hangar.
                </p>
              </div>
              <div className="admin-policy-item">
                <h3>3. Quality Assessment & Inventory Re-stock</h3>
                <p>
                  Upon physical arrival at the regional reverse logistics center, garments undergo
                  a multi-point inspection before restock is credited or customer wallet is reimbursed.
                </p>
              </div>
            </div>

            <div className="admin-policies-close-wrap">
              <button
                type="button"
                className="el-btn-close-policy"
                onClick={() => setPolicyModalOpen(false)}
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnManagement;
