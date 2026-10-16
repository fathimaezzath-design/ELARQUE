import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Sparkles,
  Shirt,
  Boxes,
  Users,
  Tag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Layers,
  ShieldCheck,
  Package,
  Flame,
  Award,
  PercentCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Radio,
} from "lucide-react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:5000/api/admin";
const AUTO_REFRESH_INTERVAL_MS = 6000; // Real-time background sync every 6 seconds

// Image resolver for atelier media
const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
};

// INR formatter
const fmt = (val) => {
  if (!val && val !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

// Number formatter with K/L abbreviations
const fmtNum = (n) => {
  if (n === undefined || n === null) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

// Get product initials
const getInitials = (name) => {
  if (!name) return "EL";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Format date nicely
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

// Format relative time (e.g. 5m ago, Just now)
const fmtRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
};

// Growth indicator component
function GrowthBadge({ current, previous }) {
  if (!previous && previous !== 0) return null;
  if (previous === 0) {
    return current > 0 ? (
      <span className="growth-badge positive">New</span>
    ) : null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const isPos = pct >= 0;
  return (
    <span className={`growth-badge ${isPos ? "positive" : "negative"}`}>
      {isPos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [activeFeedTab, setActiveFeedTab] = useState("all"); // 'all' | 'products' | 'orders'

  // Master stats fetcher
  const fetchStats = useCallback(
    async (isRefresh = false) => {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        navigate("/admin/login");
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const res = await axios.get(`${API_BASE}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentProducts(res.data.recentProducts || []);
          setRecentOrders(res.data.recentOrders || []);
          setLastRefreshed(new Date());
          setSecondsAgo(0);
        } else {
          setError("Failed to load dashboard statistics.");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
        setError(
          err.response?.data?.message ||
            "Unable to connect to the server. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time dynamic auto-polling & event listener setup
  useEffect(() => {
    // 1. Polling interval (every 6 seconds while tab is active)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchStats(true);
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    // 2. Seconds ago counter
    const tickTimer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    // 3. Immediate refetch on tab focus or visibility return
    const onFocus = () => fetchStats(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchStats(true);
    };

    // 4. Custom cross-component event listener for instant updates
    const onDataUpdated = () => fetchStats(true);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("elarque:data-updated", onDataUpdated);
    window.addEventListener("storage", onDataUpdated);

    return () => {
      clearInterval(pollTimer);
      clearInterval(tickTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("elarque:data-updated", onDataUpdated);
      window.removeEventListener("storage", onDataUpdated);
    };
  }, [fetchStats]);

  // Stock health percentage
  const stockHealthPct =
    stats && stats.variants.total > 0
      ? Math.round((stats.variants.inStock / stats.variants.total) * 100)
      : 0;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        {/* ── PAGE HEADER ── */}
        <header className="dashboard-header">
          <div className="dashboard-title-group">
            <div className="dashboard-kicker">
              <Sparkles size={12} className="kicker-icon" />
              <span>Haute Couture &middot; Ready-to-Wear Atelier</span>
            </div>
            <h1 className="dashboard-title">Atelier Executive Dashboard</h1>
            <p className="dashboard-subtitle">
              Live, real-time command center for catalog inventory, haute couture orders, and clientele.
            </p>
          </div>

          <div className="dashboard-header-actions">
            {/* Live Real-time Status Badge */}
            <div className="live-status-pill" title="Dynamic real-time sync automatically updates whenever items or orders are added">
              <span className="live-status-dot pulsing" />
              <span className="live-status-text">Live Auto-Sync</span>
              <span className="live-status-time">
                {secondsAgo <= 1 ? "Just now" : `${secondsAgo}s ago`}
              </span>
            </div>

            {/* Manual Refresh Trigger */}
            <button
              className={`dashboard-refresh-btn ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchStats(true)}
              disabled={loading || refreshing}
              title="Click to force an immediate update"
            >
              <RefreshCw size={14} />
              <span>{refreshing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>
        </header>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="dashboard-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button className="dashboard-retry-btn" onClick={() => fetchStats()}>
              Retry
            </button>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            <p>Loading real-time atelier intelligence...</p>
          </div>
        ) : stats ? (
          <>
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 1 — EXECUTIVE KPI GRID (6 Cards)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="dashboard-kpi-grid six-cards">
              {/* KPI 1: Total Atelier Revenue */}
              <div className="kpi-card kpi-gold">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-gold">
                    <IndianRupee size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Gross Salon Revenue</div>
                    <div className="kpi-value">{fmt(stats.revenue?.total || 0)}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {fmt(stats.revenue?.thisMonth || 0)} this month
                      </span>
                      <GrowthBadge
                        current={stats.revenue?.thisMonth || 0}
                        previous={stats.revenue?.lastMonth || 0}
                      />
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>From confirmed client orders</span>
                  <div className="kpi-live-indicator">
                    <span className="mini-pulse-dot" /> Live
                  </div>
                </div>
              </div>

              {/* KPI 2: Total Orders */}
              <div className="kpi-card kpi-purple">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-purple">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Salon Orders</div>
                    <div className="kpi-value">{stats.orders?.total || 0}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {(stats.orders?.placed || 0) + (stats.orders?.processing || 0)} active dispatch
                      </span>
                      <GrowthBadge
                        current={stats.orders?.newThisMonth || 0}
                        previous={stats.orders?.newLastMonth || 0}
                      />
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>
                    {stats.orders?.delivered || 0} delivered &middot; {stats.orders?.cancelled || 0} cancelled
                  </span>
                  <span className="kpi-tag-sub">Updated live</span>
                </div>
              </div>

              {/* KPI 3: Total Garment Silhouettes */}
              <div className="kpi-card kpi-burgundy">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-burgundy">
                    <Shirt size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Catalog Silhouettes</div>
                    <div className="kpi-value">{stats.products.total}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {stats.products.active} live &middot; {stats.products.inactive} draft
                      </span>
                      <GrowthBadge
                        current={stats.products.newThisMonth}
                        previous={stats.products.newLastMonth}
                      />
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>+{stats.products.newThisMonth} added this month</span>
                  <Link to="/admin/products" className="kpi-cta-link">
                    Manage <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              {/* KPI 4: Inventory Units & Valuation */}
              <div className="kpi-card kpi-gold-subtle">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-gold">
                    <Boxes size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Inventory Units</div>
                    <div className="kpi-value">{fmtNum(stats.variants.totalStock)}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {stats.variants.total} SKUs &middot; Valued {fmt(stats.variants.totalInventoryValue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>
                    {stats.variants.inStock} healthy &middot; {stats.variants.lowStock} low stock
                  </span>
                  <Link to="/admin/variants" className="kpi-cta-link">
                    Manage <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              {/* KPI 5: Clientele Base */}
              <div className="kpi-card kpi-emerald">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-emerald">
                    <Users size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Registered Clientele</div>
                    <div className="kpi-value">{fmtNum(stats.users.total)}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {stats.users.verified} verified &middot; {stats.users.googleUsers} Google
                      </span>
                      <GrowthBadge
                        current={stats.users.newThisMonth}
                        previous={stats.users.newLastMonth}
                      />
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>+{stats.users.newLast7Days} new this week</span>
                  <Link to="/admin/users" className="kpi-cta-link">
                    Directory <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              {/* KPI 6: Collections & Categories */}
              <div className="kpi-card kpi-teal">
                <div className="kpi-card-inner">
                  <div className="kpi-icon-wrap icon-teal">
                    <Tag size={20} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">Haute Collections</div>
                    <div className="kpi-value">{stats.categories.total}</div>
                    <div className="kpi-meta">
                      <span className="kpi-sub">
                        {stats.categories.active} published &middot; {stats.categories.inactive} hidden
                      </span>
                    </div>
                  </div>
                </div>
                <div className="kpi-footer">
                  <span>All seasonal atelier lines</span>
                  <Link to="/admin/categories" className="kpi-cta-link">
                    Collections <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 2 — CATALOG INTELLIGENCE & INVENTORY HEALTH
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="dashboard-details-row">
              {/* Catalog Highlights */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <BarChart3 size={15} className="detail-icon" />
                  <h2 className="detail-card-title">Catalog Highlights</h2>
                </div>
                <div className="catalog-highlights-grid">
                  <div className="highlight-item">
                    <div className="highlight-icon-wrap hl-featured">
                      <Star size={14} />
                    </div>
                    <div className="highlight-info">
                      <div className="highlight-num">{stats.products.featured}</div>
                      <div className="highlight-label">Featured</div>
                    </div>
                  </div>

                  <div className="highlight-item">
                    <div className="highlight-icon-wrap hl-bestseller">
                      <Flame size={14} />
                    </div>
                    <div className="highlight-info">
                      <div className="highlight-num">{stats.products.bestSellers}</div>
                      <div className="highlight-label">Best Sellers</div>
                    </div>
                  </div>

                  <div className="highlight-item">
                    <div className="highlight-icon-wrap hl-sale">
                      <PercentCircle size={14} />
                    </div>
                    <div className="highlight-info">
                      <div className="highlight-num">{stats.products.onSale}</div>
                      <div className="highlight-label">On Sale</div>
                    </div>
                  </div>

                  <div className="highlight-item">
                    <div className="highlight-icon-wrap hl-inactive">
                      <Package size={14} />
                    </div>
                    <div className="highlight-info">
                      <div className="highlight-num">{stats.products.inactive}</div>
                      <div className="highlight-label">Draft / Hidden</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar: active vs inactive */}
                <div className="catalog-bar-section">
                  <div className="bar-label-row">
                    <span>Active published catalog</span>
                    <span>
                      {stats.products.total > 0
                        ? Math.round((stats.products.active / stats.products.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill fill-burgundy"
                      style={{
                        width:
                          stats.products.total > 0
                            ? `${Math.round((stats.products.active / stats.products.total) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Health */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <Layers size={15} className="detail-icon" />
                  <h2 className="detail-card-title">Inventory Health</h2>
                </div>

                <div className="stock-health-donut">
                  <div className="donut-ring">
                    <svg viewBox="0 0 80 80" width="80" height="80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="rgba(223,194,141,0.12)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="#dfc28d"
                        strokeWidth="10"
                        strokeDasharray={`${(stockHealthPct / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                        style={{ transition: "stroke-dasharray 1s ease" }}
                      />
                    </svg>
                    <div className="donut-center-label">
                      <span className="donut-pct">{stockHealthPct}%</span>
                      <span className="donut-sub">Optimal</span>
                    </div>
                  </div>

                  <div className="stock-legend">
                    <div className="legend-item">
                      <span className="legend-dot dot-green" />
                      <span className="legend-text">
                        In Stock ({stats.variants.inStock})
                      </span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-amber" />
                      <span className="legend-text">
                        Low Stock ({stats.variants.lowStock})
                      </span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-red" />
                      <span className="legend-text">
                        Out of Stock ({stats.variants.outOfStock})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock bars */}
                <div className="stock-bars">
                  {stats.variants.total > 0 && (
                    <>
                      <div className="stock-bar-item">
                        <span className="sbar-label">In Stock (&gt; 5)</span>
                        <div className="sbar-track">
                          <div
                            className="sbar-fill fill-green"
                            style={{
                              width: `${Math.round((stats.variants.inStock / stats.variants.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="sbar-value">{stats.variants.inStock}</span>
                      </div>
                      <div className="stock-bar-item">
                        <span className="sbar-label">Low Stock (1-5)</span>
                        <div className="sbar-track">
                          <div
                            className="sbar-fill fill-amber"
                            style={{
                              width: `${Math.round((stats.variants.lowStock / stats.variants.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="sbar-value">{stats.variants.lowStock}</span>
                      </div>
                      <div className="stock-bar-item">
                        <span className="sbar-label">Out of Stock (0)</span>
                        <div className="sbar-track">
                          <div
                            className="sbar-fill fill-red"
                            style={{
                              width: `${Math.round((stats.variants.outOfStock / stats.variants.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="sbar-value">{stats.variants.outOfStock}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Clientele Intelligence */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <ShieldCheck size={15} className="detail-icon" />
                  <h2 className="detail-card-title">Clientèle Activity</h2>
                </div>

                <div className="customer-stats-grid">
                  <div className="cstat-item">
                    <div className="cstat-num">{stats.users.total}</div>
                    <div className="cstat-label">Total Accounts</div>
                  </div>
                  <div className="cstat-item">
                    <div className="cstat-num cstat-green">{stats.users.verified}</div>
                    <div className="cstat-label">Verified</div>
                  </div>
                  <div className="cstat-item">
                    <div className="cstat-num cstat-gold">{stats.users.googleUsers}</div>
                    <div className="cstat-label">Google Auth</div>
                  </div>
                  <div className="cstat-item">
                    <div className="cstat-num cstat-rose">{stats.users.blocked}</div>
                    <div className="cstat-label">Restricted</div>
                  </div>
                </div>

                <div className="customer-acquisition">
                  <div className="acq-row">
                    <span className="acq-label">New this month</span>
                    <span className="acq-value acq-gold">+{stats.users.newThisMonth}</span>
                  </div>
                  <div className="acq-row">
                    <span className="acq-label">New this week</span>
                    <span className="acq-value acq-emerald">+{stats.users.newLast7Days}</span>
                  </div>
                  <div className="acq-divider" />
                  <div className="acq-row">
                    <span className="acq-label">Account verification rate</span>
                    <span className="acq-value">
                      {stats.users.total > 0
                        ? `${Math.round((stats.users.verified / stats.users.total) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                </div>

                <Link to="/admin/users" className="detail-cta-btn">
                  <Users size={13} />
                  <span>Open Client Directory</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 3 — QUICK ACTIONS ATELIER SHORTCUTS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="dashboard-quick-actions">
              <div className="qa-header">
                <span className="qa-title">Atelier Management Shortcuts</span>
              </div>
              <div className="qa-grid">
                <Link to="/admin/products/add" className="qa-btn qa-primary">
                  <Shirt size={16} />
                  <span>Add New Product</span>
                </Link>
                <Link to="/admin/variants/add" className="qa-btn qa-gold">
                  <Layers size={16} />
                  <span>Add New Variant</span>
                </Link>
                <Link to="/admin/categories" className="qa-btn qa-neutral">
                  <Tag size={16} />
                  <span>Manage Collections</span>
                </Link>
                <Link to="/admin/products" className="qa-btn qa-neutral">
                  <BarChart3 size={16} />
                  <span>Product Catalog</span>
                </Link>
                <Link to="/admin/variants" className="qa-btn qa-neutral">
                  <Boxes size={16} />
                  <span>Variant Inventory</span>
                </Link>
                <Link to="/admin/users" className="qa-btn qa-neutral">
                  <Users size={16} />
                  <span>Client Directory</span>
                </Link>
              </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 4 — REAL-TIME FEEDS (NEW PRODUCTS & NEW ORDERS)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="dashboard-live-feeds">
              <div className="feed-header-bar">
                <div className="feed-title-tabs">
                  <button
                    className={`feed-tab-btn ${activeFeedTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveFeedTab("all")}
                  >
                    <Activity size={14} />
                    <span>Real-Time Overview</span>
                  </button>
                  <button
                    className={`feed-tab-btn ${activeFeedTab === "products" ? "active" : ""}`}
                    onClick={() => setActiveFeedTab("products")}
                  >
                    <Shirt size={14} />
                    <span>Recently Added Garments ({recentProducts.length})</span>
                  </button>
                  <button
                    className={`feed-tab-btn ${activeFeedTab === "orders" ? "active" : ""}`}
                    onClick={() => setActiveFeedTab("orders")}
                  >
                    <ShoppingBag size={14} />
                    <span>Recent Client Orders ({recentOrders.length})</span>
                  </button>
                </div>

                <div className="feed-auto-badge">
                  <span className="feed-pulse-dot" />
                  <span>Dynamic live sync enabled</span>
                </div>
              </div>

              {/* Feed Content Grid */}
              <div className="live-feeds-container">
                {/* 1. RECENT PRODUCTS FEED */}
                {(activeFeedTab === "all" || activeFeedTab === "products") && (
                  <div className="feed-column">
                    <div className="feed-col-header">
                      <div className="rp-title-group">
                        <Award size={15} className="rp-icon" />
                        <h2 className="rp-title">Recently Added to Catalog</h2>
                      </div>
                      <Link to="/admin/products" className="rp-see-all">
                        <span>View All</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>

                    {recentProducts.length === 0 ? (
                      <div className="empty-feed-card">
                        <p>No products in the catalog yet.</p>
                        <Link to="/admin/products/add" className="mini-cta">
                          Add First Product &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="rp-grid">
                        {recentProducts.map((product) => {
                          const imgUrl = product.image ? resolveImg(product.image) : null;
                          const initials = getInitials(product.name);
                          const activePrice =
                            product.salePrice !== null &&
                            product.salePrice !== undefined &&
                            product.salePrice < product.price
                              ? product.salePrice
                              : product.price;
                          const hasSale =
                            product.salePrice !== null &&
                            product.salePrice !== undefined &&
                            product.salePrice < product.price;

                          return (
                            <Link
                              key={product.id}
                              to={`/admin/products/edit/${product.id}`}
                              className="rp-card"
                            >
                              <div className="rp-image-wrap">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={product.name} className="rp-image" />
                                ) : (
                                  <div className="rp-image-placeholder">
                                    <span className="rp-initials">{initials}</span>
                                  </div>
                                )}
                                <div className="rp-badge-stack">
                                  {product.isFeatured && (
                                    <span className="rp-badge badge-featured">
                                      <Star size={9} /> Featured
                                    </span>
                                  )}
                                  {product.isBestSeller && (
                                    <span className="rp-badge badge-bestseller">
                                      <Flame size={9} /> Top
                                    </span>
                                  )}
                                  {hasSale && (
                                    <span className="rp-badge badge-sale">
                                      <PercentCircle size={9} /> Sale
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="rp-info">
                                <div className="rp-brand">{product.brand}</div>
                                <div className="rp-name">{product.name}</div>
                                <div className="rp-category">{product.category}</div>

                                <div className="rp-price-row">
                                  <span className="rp-price">{fmt(activePrice)}</span>
                                  {hasSale && (
                                    <span className="rp-price-struck">{fmt(product.price)}</span>
                                  )}
                                </div>

                                <div className="rp-meta-row">
                                  <span className="rp-variants">{product.variantCount} variants</span>
                                  <span className="rp-stock-badge">{product.totalStock} units</span>
                                </div>

                                <div className="rp-footer-row">
                                  <span
                                    className={`rp-status-dot ${
                                      product.status === "active" ? "status-active" : "status-inactive"
                                    }`}
                                  />
                                  <span className="rp-date">{fmtDate(product.createdAt)}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RECENT ORDERS FEED */}
                {(activeFeedTab === "all" || activeFeedTab === "orders") && (
                  <div className="feed-column">
                    <div className="feed-col-header">
                      <div className="rp-title-group">
                        <ShoppingBag size={15} className="rp-icon" />
                        <h2 className="rp-title">Recent Client Orders</h2>
                      </div>
                      <span className="live-pill-inline">
                        <span className="mini-pulse-dot" /> Auto-updates
                      </span>
                    </div>

                    {recentOrders.length === 0 ? (
                      <div className="empty-feed-card">
                        <p>No orders recorded yet. New customer orders will show here in real time.</p>
                      </div>
                    ) : (
                      <div className="recent-orders-list">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="ro-item-card">
                            <div className="ro-item-left">
                              <div className="ro-order-number">{order.orderNumber}</div>
                              <div className="ro-client-name">
                                {order.customerName}
                                {order.customerEmail ? ` (${order.customerEmail})` : ""}
                              </div>
                              <div className="ro-meta-line">
                                <span>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</span>
                                &middot;
                                <span>Payment: {order.paymentMethod}</span>
                                &middot;
                                <span className="ro-time">{fmtRelativeTime(order.createdAt)}</span>
                              </div>
                            </div>
                            <div className="ro-item-right">
                              <div className="ro-total-amount">{fmt(order.totalAmount)}</div>
                              <span className={`ro-status-badge status-${(order.orderStatus || "placed").toLowerCase()}`}>
                                {order.orderStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 5 — INVENTORY HEALTH & CRITICAL ALERTS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {(stats.variants.outOfStock > 0 || stats.variants.lowStock > 0 || stats.users.blocked > 0) && (
              <section className="dashboard-alerts">
                <div className="alerts-header">
                  <AlertTriangle size={14} className="alerts-icon" />
                  <h2 className="alerts-title">Atelier Attention &amp; Restock Alerts</h2>
                </div>
                <div className="alerts-grid">
                  {stats.variants.outOfStock > 0 && (
                    <Link
                      to="/admin/variants?stockStatus=out_of_stock"
                      className="alert-card alert-critical"
                    >
                      <div className="alert-card-icon">
                        <Package size={18} />
                      </div>
                      <div className="alert-card-content">
                        <div className="alert-count">{stats.variants.outOfStock}</div>
                        <div className="alert-label">Out-of-Stock Variants</div>
                        <div className="alert-action">
                          Restock Atelier <ArrowRight size={10} />
                        </div>
                      </div>
                    </Link>
                  )}
                  {stats.variants.lowStock > 0 && (
                    <Link
                      to="/admin/variants?stockStatus=low_stock"
                      className="alert-card alert-warning"
                    >
                      <div className="alert-card-icon">
                        <TrendingDown size={18} />
                      </div>
                      <div className="alert-card-content">
                        <div className="alert-count">{stats.variants.lowStock}</div>
                        <div className="alert-label">Low Stock Variants (&le; 5 units)</div>
                        <div className="alert-action">
                          Replenish Stock <ArrowRight size={10} />
                        </div>
                      </div>
                    </Link>
                  )}
                  {stats.users.blocked > 0 && (
                    <Link to="/admin/users" className="alert-card alert-info">
                      <div className="alert-card-icon">
                        <Users size={18} />
                      </div>
                      <div className="alert-card-content">
                        <div className="alert-count">{stats.users.blocked}</div>
                        <div className="alert-label">Restricted Client Accounts</div>
                        <div className="alert-action">
                          Review Directory <ArrowRight size={10} />
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
