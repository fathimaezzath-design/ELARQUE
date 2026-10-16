import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  Search,
  ArrowRight,
  User,
  Heart,
  Wallet,
  Ticket,
  MapPin,
  LogOut,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getMyOrders } from "../../services/orderService";
import { getProfile } from "../../services/authService";
import Navbar from "../common/Navbar";
import "./MyOrders.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusConfig = {
  Placed:      { cls: "mo-status-placed",     icon: <Clock size={13} />,       label: "Placed" },
  Confirmed:   { cls: "mo-status-confirmed",  icon: <CheckCircle size={13} />, label: "Confirmed" },
  Processing:  { cls: "mo-status-processing", icon: <Package size={13} />,     label: "Processing" },
  Shipped:     { cls: "mo-status-shipped",    icon: <Truck size={13} />,       label: "Shipped" },
  Delivered:   { cls: "mo-status-delivered",  icon: <CheckCircle size={13} />, label: "Delivered" },
  Cancelled:   { cls: "mo-status-cancelled",  icon: <XCircle size={13} />,     label: "Cancelled" },
  Returned:    { cls: "mo-status-returned",   icon: <RotateCcw size={13} />,   label: "Returned" },
};

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  // ── Fetch Profile ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    getProfile()
      .then((res) => {
        if (res?.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, [navigate]);

  // ── Fetch Orders ──────────────────────────────────
  const fetchOrders = useCallback(async (query = "") => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getMyOrders(query);
      if (res?.data?.orders) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("GET MY ORDERS ERROR:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          "Failed to retrieve your order history. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders(searchQuery);
  }, [fetchOrders, searchQuery]);

  // ── Search Handler ────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(searchQuery);
  };

  // ── Logout Handler ────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="mo-page">
      {/* ── CONSISTENT CUSTOMER NAVBAR ── */}
      <Navbar />

      <div className="mo-layout">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="mo-sidebar">
          <div className="mo-sidebar-card">
            <div className="mo-sidebar-avatar">
              {user?.profileImage ? (
                <img
                  src={`http://localhost:5000${user.profileImage}`}
                  alt="Profile"
                  className="mo-sidebar-avatar-img"
                />
              ) : (
                <div className="mo-sidebar-avatar-placeholder">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <h2 className="mo-sidebar-name">{user?.fullName || "User"}</h2>
            <p className="mo-sidebar-label">ELARQUE PRIVATE CLIENT</p>

            <div className="mo-sidebar-divider" />

            <div className="mo-sidebar-menu">
              <button
                className="mo-sidebar-item"
                onClick={() => navigate("/profile")}
              >
                <User size={16} />
                <span>MY PROFILE</span>
              </button>

              <button
                className="mo-sidebar-item active"
                onClick={() => navigate("/orders")}
              >
                <ShoppingBag size={16} />
                <span>MY ORDERS</span>
                <span className="mo-menu-arrow">→</span>
              </button>

              <button
                className="mo-sidebar-item"
                onClick={() => navigate("/wishlist")}
              >
                <Heart size={16} />
                <span>WISHLIST</span>
                {user?.wishlistCount > 0 && <strong>{user.wishlistCount}</strong>}
              </button>

              <button
                className="mo-sidebar-item"
                onClick={() => navigate("/wallet")}
              >
                <Wallet size={16} />
                <span>WALLET</span>
                {user?.wallet > 0 && <strong>₹{user.wallet}</strong>}
              </button>

              <button
                className="mo-sidebar-item"
                onClick={() => navigate("/coupons")}
              >
                <Ticket size={16} />
                <span>COUPONS</span>
              </button>

              <button
                className="mo-sidebar-item"
                onClick={() => navigate("/addresses")}
              >
                <MapPin size={16} />
                <span>SAVED ADDRESSES</span>
              </button>

              <button
                className="mo-sidebar-item mo-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="mo-main">
          <div className="mo-title-row">
            <div>
              <p className="mo-eyebrow">COMMISSION ARCHIVE <span>•</span> ORDERS</p>
              <h1 className="mo-heading">My Orders</h1>
            </div>

            <form onSubmit={handleSearchSubmit} className="mo-search-form">
              <Search size={16} className="mo-search-icon" />
              <input
                type="text"
                placeholder="Search by order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mo-search-input"
              />
            </form>
          </div>

          {/* ── LOADING STATE ── */}
          {loading && (
            <div className="mo-loading">
              <Loader2 size={32} className="mo-spinner" />
              <p>Retrieving your bespoke orders…</p>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {!loading && error && (
            <div className="mo-error-state">
              <AlertCircle size={36} color="#c0392b" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 8px", fontFamily: "Georgia, serif" }}>Unable to Load Orders</h3>
              <p style={{ color: "#7d706b", fontSize: "13px", marginBottom: "18px" }}>{error}</p>
              <button
                onClick={() => fetchOrders(searchQuery)}
                className="mo-shop-btn"
                style={{ padding: "8px 20px" }}
              >
                RETRY
              </button>
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!loading && !error && orders.length === 0 && (
            <div className="mo-empty-card">
              <Package size={48} className="mo-empty-icon" strokeWidth={1.5} />
              <h2 className="mo-empty-title">
                {searchQuery ? "No Matching Orders Found" : "No Orders in Your Archive"}
              </h2>
              <p className="mo-empty-desc">
                {searchQuery
                  ? `No orders matching "${searchQuery}" were found. Try searching with a different order number.`
                  : "You have not placed any orders yet. Discover our curated couture pieces and elevate your wardrobe."}
              </p>
              <button
                onClick={() => navigate("/collections")}
                className="mo-shop-btn"
              >
                EXPLORE COLLECTIONS
              </button>
            </div>
          )}

          {/* ── ORDERS LIST ── */}
          {!loading && !error && orders.length > 0 && (
            <div className="mo-orders-list">
              {orders.map((order) => {
                const sCfg =
                  statusConfig[order.orderStatus] || {
                    cls: "mo-status-placed",
                    icon: <Clock size={13} />,
                    label: order.orderStatus,
                  };

                return (
                  <div key={order._id} className="mo-order-card">
                    {/* Card Header */}
                    <div className="mo-card-header">
                      <div>
                        <span className="mo-order-ref">#{order.orderNumber}</span>
                        <div className="mo-order-date">
                          Placed on {formatDate(order.orderDate || order.createdAt)}
                        </div>
                      </div>

                      <div className="mo-card-badges">
                        <span className={`mo-status-badge ${sCfg.cls}`}>
                          {sCfg.icon}
                          <span>{sCfg.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Items */}
                    <div className="mo-card-body">
                      {order.items?.map((item, idx) => {
                        const itemImg = item.productImage || item.coverImage;
                        return (
                          <div key={item._id || idx} className="mo-item-row">
                            {itemImg ? (
                              <img
                                src={
                                  itemImg.startsWith("http")
                                    ? itemImg
                                    : `http://localhost:5000${itemImg}`
                                }
                                alt={item.productName || item.name}
                                className="mo-item-img"
                              />
                            ) : (
                              <div className="mo-item-img-ph">
                                <Package size={22} />
                              </div>
                            )}

                            <div className="mo-item-info">
                              <p className="mo-item-title">
                                {item.productName || item.name || "Haute Silhouette"}
                              </p>
                              {(item.variant?.size ||
                                item.variant?.color ||
                                item.size ||
                                item.color) && (
                                <p className="mo-item-variant">
                                  {[
                                    item.variant?.size || item.size,
                                    item.variant?.color || item.color,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                              <p className="mo-item-qty">Qty: {item.quantity}</p>
                            </div>

                            <div className="mo-item-price">
                              {formatCurrency(item.price || item.itemTotal)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer */}
                    <div className="mo-card-footer">
                      <div>
                        <span className="mo-total-label">Total:</span>
                        <span className="mo-total-val">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <button
                        className="mo-view-btn"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        <span>VIEW DETAILS</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MyOrders;
