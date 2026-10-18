import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ShoppingBag,
  User,
  Heart,
  Wallet,
  Ticket,
  MapPin,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Truck,
  Box,
  Star,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

import { getMyOrders } from "../../services/orderService";
import { getProfile } from "../../services/profileService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";
import "./MyOrders.css";

// Fallback high-fashion atelier imagery for mock/empty silhouettes
const FALLBACK_GARMENT_IMAGES = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80",
];

function MyOrders() {
  const navigate = useNavigate();

  // -----------------------------------------------------
  // STATE
  // -----------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 24,
    confirmed: 24,
    delivered: 18,
    cancelled: 4,
    returns: 2,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | CANCELED | DELIVERED | RETURNS
  const [sortBy, setSortBy] = useState("LATEST"); // LATEST | OLDEST | HIGH_TO_LOW | LOW_TO_HIGH

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  // -----------------------------------------------------
  // FETCH USER PROFILE
  // -----------------------------------------------------
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await getProfile();
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn("MyOrders profile notice:", err);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // -----------------------------------------------------
  // FETCH ORDERS
  // -----------------------------------------------------
  const fetchOrderList = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getMyOrders(searchQuery, activeTab);

      if (res?.data?.orders) {
        setOrders(res.data.orders);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("GET ORDERS ERROR:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Unable to load order archive.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, navigate, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrderList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrderList]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy]);

  // -----------------------------------------------------
  // SORTED & PAGINATED ORDERS
  // -----------------------------------------------------
  const filteredAndSortedOrders = useMemo(() => {
    const list = [...orders];

    list.sort((a, b) => {
      const dateA = new Date(a.orderDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.orderDate || b.createdAt || 0).getTime();
      const amountA = Number(a.totalAmount || 0);
      const amountB = Number(b.totalAmount || 0);

      switch (sortBy) {
        case "OLDEST":
          return dateA - dateB;
        case "HIGH_TO_LOW":
          return amountB - amountA;
        case "LOW_TO_HIGH":
          return amountA - amountB;
        case "LATEST":
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [orders, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOrders.length / pageSize));
  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedOrders.slice(start, start + pageSize);
  }, [filteredAndSortedOrders, currentPage, pageSize]);

  // -----------------------------------------------------
  // HELPERS
  // -----------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatInception = (dateStr) => {
    if (!dateStr) return "Winter 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "Winter 2026";
    }
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "September 14, 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getConsistentOrderNumber = (order) => {
    if (order.orderNumber) {
      return order.orderNumber.startsWith("#") ? order.orderNumber : `#${order.orderNumber}`;
    }
    return `#ELQ-2026-${String(order._id).slice(-6).toUpperCase()}`;
  };

  const effectiveUser = user || {};
  const effectiveWallet =
    effectiveUser.wallet !== undefined && effectiveUser.wallet !== 0
      ? effectiveUser.wallet
      : 12450;
  const effectiveWishlist = effectiveUser.wishlistCount || 8;
  const orderCountDisplay = stats.total || effectiveUser.orderCount || 24;

  return (
    <div className="el-orders-page-wrapper">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN NAVIGATION */}
      <Navbar />

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="el-orders-main-container">
        {/* =====================================================
            LEFT COLUMN: PATRON SALON CARD
        ===================================================== */}
        <aside className="el-orders-sidebar-col">
          <div className="el-patron-card">
            {/* Avatar with Gold Rim & Verified Badge */}
            <div className="el-patron-avatar-wrap">
              {effectiveUser.profileImage ? (
                <img
                  src={
                    effectiveUser.profileImage.startsWith("http")
                      ? effectiveUser.profileImage
                      : `http://localhost:5000${effectiveUser.profileImage}`
                  }
                  alt={effectiveUser.fullName || "Patron Avatar"}
                  className="el-patron-avatar-img"
                />
              ) : (
                <div className="el-patron-avatar-placeholder">
                  {effectiveUser.fullName ? effectiveUser.fullName.charAt(0).toUpperCase() : "S"}
                </div>
              )}
              <div className="el-patron-verified-badge" title="Verified Client">
                <ShieldCheck size={11} strokeWidth={2.5} color="#FFFFFF" />
              </div>
            </div>

            <h2 className="el-patron-name">{effectiveUser.fullName || "Swaliha ezzath"}</h2>
            <p className="el-patron-inception">
              Client since {formatInception(effectiveUser.createdAt)}
            </p>

            <div className="el-patron-sidebar-divider" />

            {/* Menu Items */}
            <nav className="el-patron-menu" aria-label="Patron Orders Navigation">
              {/* Profile Overview */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/profile")}
              >
                <div className="el-menu-item-left">
                  <User size={15} />
                  <span>PROFILE OVERVIEW</span>
                </div>
              </button>

              {/* My Orders (Active) */}
              <button
                type="button"
                className="el-menu-item active"
                onClick={() => navigate("/orders")}
              >
                <div className="el-menu-item-left">
                  <ShoppingBag size={15} color="#DFC28D" />
                  <span>ORDERS</span>
                </div>
                <span className="el-menu-active-pill-badge">{orderCountDisplay}</span>
              </button>

              {/* Wishlist */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/wishlist")}
              >
                <div className="el-menu-item-left">
                  <Heart size={15} />
                  <span>WISHLIST</span>
                </div>
                <strong className="el-menu-count">
                  {String(effectiveWishlist).padStart(2, "0")}
                </strong>
              </button>

              {/* Wallet */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/wallet")}
              >
                <div className="el-menu-item-left">
                  <Wallet size={15} />
                  <span>WALLET</span>
                </div>
                <strong className="el-menu-count">{formatPrice(effectiveWallet)}</strong>
              </button>

              {/* Coupons */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/coupons")}
              >
                <div className="el-menu-item-left">
                  <Ticket size={15} />
                  <span>COUPONS</span>
                </div>
              </button>

              {/* Saved Addresses */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/addresses")}
              >
                <div className="el-menu-item-left">
                  <MapPin size={15} />
                  <span>SAVED ADDRESSES</span>
                </div>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                className="el-menu-item logout"
                onClick={handleLogout}
              >
                <div className="el-menu-item-left">
                  <LogOut size={15} />
                  <span>SIGN OUT</span>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* =====================================================
            RIGHT COLUMN: COMMISSIONS & TRAJECTORIES
        ===================================================== */}
        <section className="el-orders-content-col">
          {/* Header Banner */}
          <div className="el-orders-intro-header">
            <span className="el-orders-eyebrow">
              <span className="el-eyebrow-bullet">•</span> ORDER DETAILS
            </span>
            <h1 className="el-orders-title">My Orders</h1>
            <p className="el-orders-subtitle">
              Track your luxury fashion commissions, delivery trajectories, and bespoke tailoring archives curated with white-glove devotion.
            </p>
          </div>

          {/* 4 Stat Summary Cards */}
          <div className="el-orders-stats-grid">
            {/* 1. Confirmed */}
            <div className="el-order-stat-card">
              <div className="el-stat-card-top">
                <span className="el-stat-label">CONFIRMED ORDERS</span>
                <div className="el-stat-icon-wrap">
                  <Box size={14} color="#650D20" />
                </div>
              </div>
              <div className="el-stat-value">{stats.confirmed || 24} Orders</div>
            </div>

            {/* 2. Delivered */}
            <div className="el-order-stat-card">
              <div className="el-stat-card-top">
                <span className="el-stat-label">DELIVERED</span>
                <div className="el-stat-icon-wrap">
                  <CheckCircle2 size={14} color="#650D20" />
                </div>
              </div>
              <div className="el-stat-value burgundy">{stats.delivered || 18} Delivered</div>
            </div>

            {/* 3. Canceled */}
            <div className="el-order-stat-card">
              <div className="el-stat-card-top">
                <span className="el-stat-label">CANCELED</span>
                <div className="el-stat-icon-wrap">
                  <Truck size={14} color="#A27D3A" />
                </div>
              </div>
              <div className="el-stat-value gold">{stats.cancelled || 4} Orders</div>
            </div>

            {/* 4. Returns */}
            <div className="el-order-stat-card">
              <div className="el-stat-card-top">
                <span className="el-stat-label">RETURNS</span>
                <div className="el-stat-icon-wrap">
                  <RotateCcw size={14} color="#8A775C" />
                </div>
              </div>
              <div className="el-stat-value antique">{stats.returns || 2} Orders</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="el-orders-toolbar">
            {/* Search Input */}
            <div className="el-orders-search-box">
              <Search size={14} className="el-search-icon" />
              <input
                type="text"
                placeholder="Search Orders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="el-search-input"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="el-orders-tabs">
              <button
                type="button"
                className={`el-order-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                onClick={() => setActiveTab("ALL")}
              >
                ALL ORDERS ({stats.total || 24})
              </button>
              <button
                type="button"
                className={`el-order-tab-btn ${activeTab === "CANCELED" ? "active" : ""}`}
                onClick={() => setActiveTab("CANCELED")}
              >
                CANCELED ({stats.cancelled || 4})
              </button>
              <button
                type="button"
                className={`el-order-tab-btn ${activeTab === "DELIVERED" ? "active" : ""}`}
                onClick={() => setActiveTab("DELIVERED")}
              >
                DELIVERED ({stats.delivered || 18})
              </button>
              <button
                type="button"
                className={`el-order-tab-btn ${activeTab === "RETURNS" ? "active" : ""}`}
                onClick={() => setActiveTab("RETURNS")}
              >
                RETURNS ({stats.returns || 2})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="el-orders-sort-wrap">
              <label htmlFor="orders-sort-select" className="visually-hidden">
                Sort orders
              </label>
              <div className="el-sort-custom-select">
                <select
                  id="orders-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="el-sort-native-select"
                >
                  <option value="LATEST">SORT: LATEST</option>
                  <option value="OLDEST">SORT: OLDEST</option>
                  <option value="HIGH_TO_LOW">PRICE: HIGH TO LOW</option>
                  <option value="LOW_TO_HIGH">PRICE: LOW TO HIGH</option>
                </select>
                <ChevronDown size={13} className="el-sort-chevron" />
              </div>
            </div>
          </div>

          {/* Orders List Container */}
          <div className="el-orders-list-wrapper">
            {loading ? (
              <div className="el-orders-loading-state">
                <div className="el-orders-loading-spinner" />
                <p>Curating your couture commissions...</p>
              </div>
            ) : error ? (
              <div className="el-orders-error-box">
                <p>{error}</p>
                <button
                  type="button"
                  className="el-btn-retry"
                  onClick={() => fetchOrderList()}
                >
                  RETRY ARCHIVE
                </button>
              </div>
            ) : currentOrders.length === 0 ? (
              <div className="el-orders-empty-state">
                <Package size={36} color="#8c7e79" />
                <h3>No Commissions Found</h3>
                <p>We could not find any orders matching your search or active filter tab.</p>
                <button
                  type="button"
                  className="el-btn-primary-explore"
                  onClick={() => {
                    setActiveTab("ALL");
                    setSearchQuery("");
                  }}
                >
                  VIEW ALL ORDERS
                </button>
              </div>
            ) : (
              currentOrders.map((order, idx) => {
                const firstItem = order.items?.[0] || {};
                const extraItemsCount = Math.max(0, (order.items?.length || 1) - 1);
                const orderIdDisplay = getConsistentOrderNumber(order);
                const isDelivered = order.orderStatus === "Delivered";
                const isShipped = order.orderStatus === "Shipped" || order.orderStatus === "Processing";

                // Image resolution
                const itemImage =
                  firstItem.productImage ||
                  FALLBACK_GARMENT_IMAGES[idx % FALLBACK_GARMENT_IMAGES.length];

                const resolvedImg = itemImage.startsWith("http")
                  ? itemImage
                  : `http://localhost:5000${itemImage}`;

                return (
                  <article key={order._id || idx} className="el-order-commission-card">
                    {/* Thumbnail Image */}
                    <div className="el-order-thumb-wrap">
                      <img
                        src={resolvedImg}
                        alt={firstItem.productName || "Couture Garment"}
                        className="el-order-thumb-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_GARMENT_IMAGES[idx % FALLBACK_GARMENT_IMAGES.length];
                        }}
                      />
                    </div>

                    {/* Garment Details Center */}
                    <div className="el-order-details-center">
                      <span className="el-order-collection-tag">
                        {firstItem.collectionTag || "RUNWAY COLLECTION — GUILD PIECE"}
                      </span>

                      <h3 className="el-order-garment-title">
                        {firstItem.productName || "Satin Western Evening Gown"}
                      </h3>

                      <p className="el-order-specs-line">
                        Size: {firstItem.variant?.size || "S (FR 36)"} &nbsp;•&nbsp;{" "}
                        {firstItem.variant?.color || "Champagne Gold & Burgundy Fringe"}
                      </p>

                      <p className="el-order-provenance-text">
                        Garment registered with ELARQUE Provenance Registry {orderIdDisplay}. Archival cedar preservation box dispatched on {formatOrderDate(order.orderDate)}.
                      </p>

                      {/* Action Button Row */}
                      <div className="el-order-actions-row">
                        <button
                          type="button"
                          className="el-btn-view-details"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          VIEW DETAILS
                        </button>

                        {isDelivered ? (
                          <button
                            type="button"
                            className="el-btn-write-review"
                            onClick={() => navigate(`/orders/${order._id}?review=true`)}
                          >
                            WRITE REVIEW <Star size={11} fill="#8A775C" stroke="#8A775C" />
                          </button>
                        ) : isShipped ? (
                          <button
                            type="button"
                            className="el-btn-track-shipment"
                            onClick={() => navigate(`/orders/${order._id}`)}
                          >
                            TRACK SHIPMENT
                          </button>
                        ) : null}

                        {extraItemsCount > 0 && (
                          <span className="el-order-more-items-count">
                            {extraItemsCount} MORE {extraItemsCount === 1 ? "ITEM" : "ITEMS"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Order ID Right */}
                    <div className="el-order-pricing-right">
                      <div className="el-order-price-val">
                        {formatPrice(order.totalAmount || 5999)}
                      </div>
                      <span className="el-order-fit-tag">BESPOKE FITTING</span>
                      <span className="el-order-sequence-tag">
                        #{String(idx + 1 + (currentPage - 1) * pageSize).padStart(2, "0")}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && filteredAndSortedOrders.length > 0 && (
            <div className="el-orders-pagination-bar">
              <span className="el-pagination-summary">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredAndSortedOrders.length)} of{" "}
                {filteredAndSortedOrders.length} Couture Commissions
              </span>

              <div className="el-pagination-controls">
                <button
                  type="button"
                  className="el-page-arrow-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }).map((_, pIdx) => {
                  const pageNum = pIdx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`el-page-num-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="el-page-arrow-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 4. ATELIER FOOTER */}
      <Footer />
    </div>
  );
}

export default MyOrders;
