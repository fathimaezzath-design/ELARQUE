import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PlusCircle,
  Download,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Gift,
  Layers,
} from "lucide-react";
import "./OffersManagement.css";

const API_BASE = "http://localhost:5000/api/admin/offers";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const formatDateDisplay = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const OffersManagement = () => {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Modal inspection
  const [inspectOffer, setInspectOffer] = useState(null);

  // Fetch offers
  const fetchOffers = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page: targetPage,
          limit: 6,
          search: searchQuery,
          status: statusFilter,
          type: typeFilter,
          sort: sortBy,
        };

        const res = await axios.get(API_BASE, {
          headers: adminHeader(),
          params,
        });

        if (res.data?.success) {
          setOffers(res.data.offers || []);
          setTotal(res.data.total || 0);
          setPages(res.data.pages || 1);
          setPage(res.data.page || 1);
        } else {
          setError(res.data?.message || "Failed to retrieve promotional offers.");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
          return;
        }
        setError(err.response?.data?.message || "Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, typeFilter, sortBy, navigate]
  );

  useEffect(() => {
    fetchOffers(page);
  }, [fetchOffers, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("recent");
    setPage(1);
  };

  const handleToggleActive = async (offer) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/${offer._id}/toggle`,
        {},
        { headers: adminHeader() }
      );
      if (res.data?.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o._id === offer._id ? { ...o, isActive: res.data.isActive } : o
          )
        );
      }
    } catch (err) {
      alert("Failed to toggle offer status.");
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this promotional offer?"))
      return;

    try {
      const res = await axios.delete(`${API_BASE}/${offerId}`, {
        headers: adminHeader(),
      });
      if (res.data?.success) {
        fetchOffers(page);
      }
    } catch (err) {
      alert("Failed to delete offer.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!offers.length) {
      alert("No offers available to export.");
      return;
    }

    const headers = [
      "Offer Title",
      "Code",
      "Type",
      "Target Class",
      "Discount",
      "Start Date",
      "End Date",
      "Status",
    ];

    const rows = offers.map((o) => [
      o.title,
      o.code || "",
      o.offerType,
      o.targetClass,
      o.offerType === "percentage" ? `${o.discountValue}%` : `₹${o.discountValue}`,
      formatDateDisplay(o.startDate),
      formatDateDisplay(o.endDate),
      o.computedStatus || (o.isActive ? "ACTIVE" : "DRAFT"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ELARQUE_Offers_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="el-om-root">
      <div className="el-om-container">
        {/* ── 1. Page Header ── */}
        <header className="el-om-header">
          <div className="el-om-title-group">
            <h1>Offers Management</h1>
            <p className="el-om-title-desc">
              Create, manage, and track promotional offers for your luxury fashion collection.
            </p>
          </div>

          <div className="el-om-header-actions">
            <button className="el-om-btn-export" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export Report (CSV)</span>
            </button>

            <Link to="/admin/offers/add" className="el-om-btn-create">
              <PlusCircle size={14} />
              <span>Create New Offer</span>
            </Link>
          </div>
        </header>

        {/* ── 2. Toolbar ── */}
        <div className="el-om-toolbar">
          <div className="el-om-search-wrap">
            <Search size={15} className="el-om-search-icon" />
            <input
              type="text"
              className="el-om-search-input"
              placeholder="Search by offer title, type, or target..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="el-om-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </select>

          <select
            className="el-om-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Type: All Types</option>
            <option value="percentage">Percentage</option>
            <option value="flat">Fixed Amount</option>
          </select>

          <select
            className="el-om-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="recent">Sort: Recent</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="discount_high">Discount: High → Low</option>
            <option value="discount_low">Discount: Low → High</option>
            <option value="expiry_soon">Expiring Soon</option>
          </select>

          <button
            className="el-om-btn-reset"
            onClick={handleResetFilters}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* ── 3. Table Card ── */}
        <div className="el-om-table-card">
          {loading ? (
            <div className="el-om-loading">
              <div className="el-om-spinner" />
              <p>Curating Bespoke Atelier Offers...</p>
            </div>
          ) : error ? (
            <div className="el-om-empty">
              <AlertCircle size={32} style={{ color: "#f87171", marginBottom: 12 }} />
              <p>{error}</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="el-om-empty">
              <Gift size={36} style={{ opacity: 0.35, marginBottom: 14 }} />
              <p>No promotional offers match your criteria.</p>
            </div>
          ) : (
            <div className="el-om-table-wrap">
              <table className="el-om-table">
                <thead>
                  <tr>
                    <th>OFFER TITLE</th>
                    <th>TYPE</th>
                    <th>TARGET</th>
                    <th>DISCOUNT</th>
                    <th>START DATE</th>
                    <th>END DATE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => {
                    // Compute target label
                    let targetLabel = "All Products";
                    if (offer.targetClass === "category") {
                      targetLabel =
                        offer.targetCategories?.length > 0
                          ? offer.targetCategories.map((c) => c.name).join(", ")
                          : "Category Offer";
                    } else if (offer.targetClass === "product") {
                      targetLabel =
                        offer.targetProducts?.length > 0
                          ? offer.targetProducts.map((p) => p.name).join(", ")
                          : "Selected Products";
                    } else if (offer.targetClass === "referral") {
                      targetLabel = "Referral Protocol";
                    }

                    // Format discount display
                    let discountDisplay =
                      offer.offerType === "percentage"
                        ? `${offer.discountValue}%`
                        : `₹${offer.discountValue.toLocaleString("en-IN")}`;

                    return (
                      <tr key={offer._id}>
                        <td>
                          <div className="el-om-title-cell">
                            <span className="el-om-offer-title">{offer.title}</span>
                            <div className="el-om-offer-code-pill">
                              <span className="el-om-code-badge">{offer.code}</span>
                              <span style={{ color: "#7d6b5d" }}>
                                {offer.targetClass === "category"
                                  ? "Category Concession"
                                  : offer.targetClass === "referral"
                                  ? "Patron Referral"
                                  : "Bespoke Silhouette"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="el-om-type-pill">
                            {offer.offerType === "percentage"
                              ? "PERCENTAGE"
                              : "FIXED AMOUNT"}
                          </span>
                        </td>

                        <td>
                          <span className="el-om-target-text" title={targetLabel}>
                            {targetLabel}
                          </span>
                        </td>

                        <td>
                          <span className="el-om-discount-cell">
                            {discountDisplay}
                          </span>
                        </td>

                        <td>
                          <span className="el-om-date-cell">
                            {formatDateDisplay(offer.startDate)}
                          </span>
                        </td>

                        <td>
                          <span className="el-om-date-cell">
                            {formatDateDisplay(offer.endDate)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`el-om-status-badge ${
                              offer.computedStatus || "active"
                            }`}
                          >
                            {offer.computedStatus?.toUpperCase() || "ACTIVE"}
                          </span>
                        </td>

                        <td>
                          <div className="el-om-actions">
                            <button
                              className="el-om-action-btn"
                              onClick={() => setInspectOffer(offer)}
                              title="View Offer Details"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>

                            <Link
                              to={`/admin/offers/edit/${offer._id}`}
                              className="el-om-action-btn"
                              title="Edit Offer"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </Link>

                            <button
                              className="el-om-action-btn del"
                              onClick={() => handleDelete(offer._id)}
                              title="Delete Offer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 4. Pagination Footer ── */}
          {total > 0 && (
            <div className="el-om-pagination">
              <div className="el-om-pagination-info">
                SHOWING {(page - 1) * 6 + 1} TO {Math.min(page * 6, total)} OF {total}{" "}
                PROMOTIONAL OFFERS
              </div>

              <div className="el-om-pagination-controls">
                <button
                  className="el-om-page-nav"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  PREVIOUS
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`el-om-page-btn ${p === page ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  className="el-om-page-nav"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Inspection Modal ── */}
      {inspectOffer && (
        <div
          className="el-om-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectOffer(null);
          }}
        >
          <div className="el-om-modal">
            <button
              className="el-om-modal-close"
              onClick={() => setInspectOffer(null)}
            >
              <X size={18} />
            </button>
            <h3>{inspectOffer.title}</h3>

            <div className="el-om-modal-body">
              <div className="el-om-modal-row">
                <span className="el-om-modal-label">Code:</span>
                <span className="el-om-modal-val">{inspectOffer.code}</span>
              </div>
              <div className="el-om-modal-row">
                <span className="el-om-modal-label">Target Class:</span>
                <span className="el-om-modal-val" style={{ textTransform: "capitalize" }}>
                  {inspectOffer.targetClass} Offer
                </span>
              </div>
              <div className="el-om-modal-row">
                <span className="el-om-modal-label">Discount Concession:</span>
                <span className="el-om-modal-val" style={{ color: "#dfc28d" }}>
                  {inspectOffer.offerType === "percentage"
                    ? `${inspectOffer.discountValue}% Off`
                    : `₹${inspectOffer.discountValue} Flat Deduction`}
                </span>
              </div>
              <div className="el-om-modal-row">
                <span className="el-om-modal-label">Status:</span>
                <span className="el-om-modal-val" style={{ textTransform: "uppercase" }}>
                  {inspectOffer.computedStatus}
                </span>
              </div>
              <div className="el-om-modal-row">
                <span className="el-om-modal-label">Validity Window:</span>
                <span className="el-om-modal-val">
                  {formatDateDisplay(inspectOffer.startDate)} – {formatDateDisplay(inspectOffer.endDate)}
                </span>
              </div>

              {inspectOffer.targetClass === "referral" && inspectOffer.referralConfig && (
                <div className="el-om-modal-row">
                  <span className="el-om-modal-label">Referral Rewards:</span>
                  <span className="el-om-modal-val">
                    Referrer: ₹{inspectOffer.referralConfig.referrerAmount} | Referee: ₹{inspectOffer.referralConfig.refereeAmount}
                  </span>
                </div>
              )}

              {inspectOffer.targetClass === "category" && inspectOffer.targetCategories?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span className="el-om-modal-label">Applied Categories:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {inspectOffer.targetCategories.map((c) => (
                      <span
                        key={c._id}
                        style={{
                          background: "rgba(223, 194, 141, 0.1)",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          color: "#dfc28d",
                        }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectOffer.targetClass === "product" && inspectOffer.targetProducts?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span className="el-om-modal-label">Applied Garments:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {inspectOffer.targetProducts.map((p) => (
                      <span
                        key={p._id}
                        style={{
                          background: "rgba(223, 194, 141, 0.1)",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          color: "#dfc28d",
                        }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManagement;
