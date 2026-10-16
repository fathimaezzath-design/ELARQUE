import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
<<<<<<< Updated upstream
  RotateCcw,
  AlertTriangle,
=======
  Download,
  Loader2,
  User,
  Heart,
  Wallet,
  Ticket,
  LogOut,
  ShoppingBag,
>>>>>>> Stashed changes
} from "lucide-react";
import {
  getOrderDetails,
  cancelOrder,
  cancelOrderItem,
  requestOrderReturn,
  requestItemReturn,
} from "../../services/orderService";
import { getProfile } from "../../services/authService";
import "./OrderDetails.css";

// =====================================================
// HELPERS
// =====================================================

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// =====================================================
// STATUS CONFIGS
// =====================================================

const orderStatusConfig = {
  Placed:      { cls: "badge-placed",      icon: <Clock size={14} />,        label: "Order Placed" },
  Confirmed:   { cls: "badge-confirmed",   icon: <CheckCircle size={14} />,  label: "Confirmed" },
  Processing:  { cls: "badge-processing",  icon: <Package size={14} />,      label: "Processing" },
  Shipped:     { cls: "badge-shipped",     icon: <Truck size={14} />,        label: "Shipped" },
  Delivered:   { cls: "badge-delivered",   icon: <CheckCircle size={14} />,  label: "Delivered" },
  Cancelled:   { cls: "badge-cancelled",   icon: <XCircle size={14} />,      label: "Cancelled" },
  Returned:    { cls: "badge-returned",    icon: <ArrowLeft size={14} />,    label: "Returned" },
};

const paymentStatusConfig = {
  Pending:   { cls: "pay-pending",   label: "Payment Pending" },
  Paid:      { cls: "pay-paid",      label: "Paid" },
  Failed:    { cls: "pay-failed",    label: "Payment Failed" },
  Refunded:  { cls: "pay-refunded",  label: "Refunded" },
};

const itemStatusConfig = {
  Active:          { cls: "item-active",      label: "Active" },
  Cancelled:       { cls: "item-cancelled",   label: "Cancelled" },
  ReturnRequested: { cls: "item-return-req",  label: "Return Requested" },
  Returned:        { cls: "item-returned",    label: "Returned" },
};

const returnStatusBadge = {
  None:      null,
  Requested: { cls: "ret-requested", label: "Return Pending Review" },
  Approved:  { cls: "ret-approved",  label: "Return Approved" },
  Rejected:  { cls: "ret-rejected",  label: "Return Rejected" },
};

// Cancellable order statuses (must match backend)
const CANCELLABLE_ORDER_STATUSES = ["Placed", "Confirmed", "Processing"];
const RETURNABLE_ORDER_STATUSES  = ["Delivered"];

// =====================================================
// CONFIRMATION MODAL
// =====================================================

function ConfirmModal({ title, message, reasonLabel, reasonRequired, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const handleSubmit = () => {
    if (reasonRequired && !reason.trim()) {
      setReasonError(`${reasonLabel || "Reason"} is required.`);
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="od-modal-backdrop" onClick={onCancel}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <AlertTriangle size={20} className="od-modal-icon" />
          <h3>{title}</h3>
        </div>

        <p className="od-modal-msg">{message}</p>

        <div className="od-modal-field">
          <label htmlFor="modal-reason">
            {reasonLabel || "Reason"} {reasonRequired ? "" : "(Optional)"}
          </label>
          <textarea
            id="modal-reason"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
            placeholder={reasonRequired ? "Please provide a reason…" : "Optional reason…"}
            rows={3}
          />
          {reasonError && <p className="od-modal-field-error">{reasonError}</p>}
        </div>

        <div className="od-modal-actions">
          <button className="od-modal-cancel-btn" onClick={onCancel} disabled={busy}>
            Keep Order
          </button>
          <button
            className="od-modal-confirm-btn"
            onClick={handleSubmit}
            disabled={busy}
            id="modal-confirm-btn"
          >
            {busy ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function OrderDetails() {
  const navigate  = useNavigate();
  const { id }    = useParams();

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });
<<<<<<< Updated upstream

  // Modal state
  const [modal, setModal] = useState(null);
  // { type: "cancelOrder"|"cancelItem"|"returnOrder"|"returnItem", itemId?, busy }
=======
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [user, setUser] = useState(null);

  // ── Fetch profile for sidebar ─────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    getProfile()
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, [navigate]);
>>>>>>> Stashed changes

  // ── Fetch order ───────────────────────────────────
  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await getOrderDetails(id);
      setOrder(res.data.order);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (err.response?.status === 404) {
        setError("This order was not found or does not belong to your account.");
        return;
      }
      if (err.response?.status === 400) {
        setError("Invalid order reference. Please go back to My Orders.");
        return;
      }
      setError(err.response?.data?.message || "Unable to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── Show timed action message ─────────────────────
  const showMsg = (text, type = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "" }), 5000);
  };

<<<<<<< Updated upstream
  // ── ACTION HANDLERS ───────────────────────────────
=======
  // ── Logout ────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── Download Invoice handler ──────────────────────
  const handleDownloadInvoice = async () => {
    if (!order || downloadingInvoice) return;
>>>>>>> Stashed changes

  const handleCancelOrder = async (reason) => {
    setModal((m) => ({ ...m, busy: true }));
    try {
      await cancelOrder(id, reason);
      setModal(null);
      showMsg("Order cancelled successfully.");
      await fetchOrder();
    } catch (err) {
      setModal((m) => ({ ...m, busy: false }));
      showMsg(err.response?.data?.message || "Failed to cancel order. Please try again.", "error");
    }
  };

  const handleCancelItem = async (reason) => {
    const itemId = modal.itemId;
    setModal((m) => ({ ...m, busy: true }));
    try {
      await cancelOrderItem(id, itemId, reason);
      setModal(null);
      showMsg("Item cancelled successfully.");
      await fetchOrder();
    } catch (err) {
      setModal((m) => ({ ...m, busy: false }));
      showMsg(err.response?.data?.message || "Failed to cancel item. Please try again.", "error");
    }
  };

  const handleReturnOrder = async (reason) => {
    setModal((m) => ({ ...m, busy: true }));
    try {
      await requestOrderReturn(id, reason);
      setModal(null);
      showMsg("Return request submitted. Our team will review it shortly.");
      await fetchOrder();
    } catch (err) {
      setModal((m) => ({ ...m, busy: false }));
      showMsg(err.response?.data?.message || "Failed to submit return request.", "error");
    }
  };

  const handleReturnItem = async (reason) => {
    const itemId = modal.itemId;
    setModal((m) => ({ ...m, busy: true }));
    try {
      await requestItemReturn(id, itemId, reason);
      setModal(null);
      showMsg("Item return request submitted.");
      await fetchOrder();
    } catch (err) {
      setModal((m) => ({ ...m, busy: false }));
      showMsg(err.response?.data?.message || "Failed to submit item return request.", "error");
    }
  };

  const modalConfig = modal
    ? {
        cancelOrder: {
          title: "Cancel Order",
          message: "Are you sure you want to cancel this entire order? This action cannot be undone.",
          reasonLabel: "Cancellation Reason",
          reasonRequired: false,
          onConfirm: handleCancelOrder,
        },
        cancelItem: {
          title: "Cancel Item",
          message: "Are you sure you want to cancel this item? Stock will be restored.",
          reasonLabel: "Cancellation Reason",
          reasonRequired: false,
          onConfirm: handleCancelItem,
        },
        returnOrder: {
          title: "Request Order Return",
          message: "Please provide a reason for returning this order. Our team will review your request.",
          reasonLabel: "Return Reason",
          reasonRequired: true,
          onConfirm: handleReturnOrder,
        },
        returnItem: {
          title: "Request Item Return",
          message: "Please provide a reason for returning this item. Our team will review your request.",
          reasonLabel: "Return Reason",
          reasonRequired: true,
          onConfirm: handleReturnItem,
        },
      }[modal.type]
    : null;

  // ── Loading ───────────────────────────────────────
  if (loading) {
    return (
      <div className="od-loading">
        <div className="od-loading-inner">
          <div className="od-logo" onClick={() => navigate("/")}>ELARQUE</div>
          <p>Loading order details…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────
  if (error) {
    return (
      <div className="od-error-page">
        <div className="od-error-header">
          <div className="od-logo" onClick={() => navigate("/")}>ELARQUE</div>
        </div>
        <div className="od-error-box">
          <XCircle size={40} className="od-error-icon" />
          <h2>Order Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/orders")} id="back-to-orders-btn">
            ← BACK TO MY ORDERS
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const orderCfg   = orderStatusConfig[order.orderStatus]    || { cls: "badge-placed",  icon: <Clock size={14} />,  label: order.orderStatus };
  const paymentCfg = paymentStatusConfig[order.paymentStatus] || { cls: "pay-pending",   label: order.paymentStatus };
  const addr = order.shippingAddress || {};

  const canCancelOrder = CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus);
  const canReturnOrder =
    RETURNABLE_ORDER_STATUSES.includes(order.orderStatus) &&
    order.returnStatus === "None";

  const orderReturnBadge = returnStatusBadge[order.returnStatus];

  return (
    <div className="od-page">

      {/* ── MODAL ── */}
      {modal && modalConfig && (
        <ConfirmModal
          {...modalConfig}
          busy={modal.busy}
          onCancel={() => setModal(null)}
        />
      )}

      {/* ── HEADER ── */}
      <header className="od-header">
        <div className="od-logo" onClick={() => navigate("/")}>ELARQUE</div>

        <nav className="od-nav">
          <span onClick={() => navigate("/")}>MAIN</span>
          <span onClick={() => navigate("/collections")}>COLLECTIONS</span>
          <span onClick={() => navigate("/collections?sort=bestseller")}>BEST SELLERS</span>
          <span onClick={() => navigate("/collections?sort=new")}>NEW ARRIVALS</span>
        </nav>

        <div className="od-header-icons">
          <Heart size={19} onClick={() => navigate("/wishlist")} style={{ cursor: "pointer" }} />
          <Wallet size={19} onClick={() => navigate("/wallet")} style={{ cursor: "pointer" }} />
          <div className="od-header-user" onClick={() => navigate("/profile")}>
            <User size={17} />
          </div>
        </div>
      </header>

      <div className="od-layout">

        {/* ── SIDEBAR ── */}
        <aside className="od-sidebar">
          <div className="od-sidebar-card">

            {/* Avatar */}
            <div className="od-sidebar-avatar">
              {user?.profileImage ? (
                <img
                  src={`http://localhost:5000${user.profileImage}`}
                  alt="Profile"
                  className="od-sidebar-avatar-img"
                />
              ) : (
                <div className="od-sidebar-avatar-placeholder">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <h2 className="od-sidebar-name">{user?.fullName || "User"}</h2>
            <p className="od-sidebar-label">ELARQUE PRIVATE CLIENT</p>

            <div className="od-sidebar-divider" />

            {/* Menu */}
            <div className="od-sidebar-menu">
              <button className="od-sidebar-item" onClick={() => navigate("/profile")}>
                <User size={16} /><span>MY PROFILE</span>
              </button>

              <button className="od-sidebar-item active" onClick={() => navigate("/orders")}>
                <ShoppingBag size={16} /><span>MY ORDERS</span>
                <span className="od-menu-arrow">→</span>
              </button>

              <button className="od-sidebar-item" onClick={() => navigate("/wishlist")}>
                <Heart size={16} /><span>WISHLIST</span>
                {user?.wishlistCount > 0 && (
                  <strong>{user.wishlistCount}</strong>
                )}
              </button>

              <button className="od-sidebar-item" onClick={() => navigate("/wallet")}>
                <Wallet size={16} /><span>WALLET</span>
                {user?.wallet > 0 && <strong>₹{user.wallet}</strong>}
              </button>

              <button className="od-sidebar-item" onClick={() => navigate("/coupons")}>
                <Ticket size={16} /><span>COUPONS</span>
              </button>

              <button className="od-sidebar-item" onClick={() => navigate("/addresses")}>
                <MapPin size={16} /><span>SAVED ADDRESSES</span>
              </button>

              <button className="od-sidebar-item od-logout" onClick={handleLogout}>
                <LogOut size={16} /><span>SIGN OUT</span>
              </button>
            </div>

          </div>
        </aside>

<<<<<<< Updated upstream
        {/* ── PAGE TITLE ── */}
        <div className="od-title-row">
          <div>
            <p className="od-eyebrow">ORDER DETAILS <span>•</span> PURCHASE RECORD</p>
            <h1 className="od-heading">#{order.orderNumber}</h1>
            <p className="od-date">Placed on {formatDate(order.orderDate)}</p>
          </div>

          <div className="od-status-group">
            <span className={`od-badge ${orderCfg.cls}`}>
              {orderCfg.icon} {orderCfg.label}
            </span>
            <span className={`od-pay-badge ${paymentCfg.cls}`}>
              {paymentCfg.label}
            </span>
            {orderReturnBadge && (
              <span className={`od-return-badge ${orderReturnBadge.cls}`}>
                <RotateCcw size={12} /> {orderReturnBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* ── ORDER-LEVEL ACTIONS ── */}
        {(canCancelOrder || canReturnOrder) && (
          <div className="od-order-actions">
=======
        {/* ── MAIN CONTENT ── */}
        <main className="od-main">

          {/* ── ACTION MESSAGE ── */}
          {actionMsg.text && (
            <div className={`od-action-msg od-action-${actionMsg.type}`}>
              {actionMsg.type === "success"
                ? <CheckCircle size={15} />
                : <XCircle size={15} />}
              {actionMsg.text}
            </div>
          )}

          {/* ── PAGE TITLE ── */}
          <div className="od-title-row">
            <div>
              <p className="od-eyebrow">ORDER DETAILS <span>•</span> PURCHASE RECORD</p>
              <div className="od-heading-row">
                <button className="od-back-btn" onClick={() => navigate("/orders")} id="back-to-orders-top">
                  <ArrowLeft size={15} /> MY ORDERS
                </button>
                <h1 className="od-heading">#{order.orderNumber}</h1>
              </div>
              <p className="od-date">Placed on {formatDate(order.createdAt)}</p>
            </div>

            <div className="od-status-group">
              <span className={`od-badge ${orderCfg.cls}`}>
                {orderCfg.icon} {orderCfg.label}
              </span>
              <span className={`od-pay-badge ${paymentCfg.cls}`}>
                {paymentCfg.label}
              </span>
            </div>
          </div>

          {/* ── ORDER-LEVEL ACTIONS ── */}
          <div className="od-order-actions">
            {/* Download Invoice – always available */}
            <button
              className="od-btn-download-invoice"
              id="download-invoice-btn"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              title="Download tax invoice PDF"
            >
              {downloadingInvoice ? (
                <>
                  <Loader2 size={15} className="od-spinner" /> Generating Invoice…
                </>
              ) : (
                <>
                  <Download size={15} /> Download Invoice PDF
                </>
              )}
            </button>

>>>>>>> Stashed changes
            {canCancelOrder && (
              <button
                className="od-btn-cancel-order"
                id="cancel-order-btn"
<<<<<<< Updated upstream
                onClick={() => setModal({ type: "cancelOrder", busy: false })}
=======
                disabled
                title="Order cancellation is not yet supported."
>>>>>>> Stashed changes
              >
                <XCircle size={15} /> Cancel Order
              </button>
            )}
<<<<<<< Updated upstream
            {canReturnOrder && (
              <button
                className="od-btn-return-order"
                id="return-order-btn"
                onClick={() => setModal({ type: "returnOrder", busy: false })}
              >
                <RotateCcw size={15} /> Request Return
              </button>
            )}
          </div>
        )}

        {/* Cancellation info */}
        {order.cancellationReason && (
          <div className="od-cancel-info">
            <XCircle size={14} />
            <span>Cancelled: {order.cancellationReason}</span>
          </div>
        )}
        {order.returnReason && order.returnStatus !== "None" && (
          <div className="od-return-info">
            <RotateCcw size={14} />
            <span>Return reason: {order.returnReason}</span>
          </div>
        )}
=======
          </div>
>>>>>>> Stashed changes


          <div className="od-grid">

            {/* ── LEFT COLUMN ── */}
            <div className="od-left">

              {/* ITEMS */}
              <div className="od-card">
                <h2 className="od-card-title">
                  <Package size={17} /> Items Ordered
                </h2>

<<<<<<< Updated upstream
              <div className="od-items-list">
                {order.items?.map((item) => {
                  const iCfg = itemStatusConfig[item.itemStatus] || itemStatusConfig.Active;
                  const isActive = item.itemStatus === "Active";

                  const canCancelThisItem =
                    isActive && CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus);
                  const canReturnThisItem =
                    isActive &&
                    RETURNABLE_ORDER_STATUSES.includes(order.orderStatus) &&
                    item.returnStatus === "None";

                  const itemRetBadge = returnStatusBadge[item.returnStatus];

                  return (
                    <div
                      key={item._id}
                      className={`od-item ${item.itemStatus !== "Active" ? "od-item-inactive" : ""}`}
                    >
                      {/* Image */}
                      {item.productImage ? (
                        <img
                          src={
                            item.productImage.startsWith("http")
                              ? item.productImage
                              : `http://localhost:5000${item.productImage}`
                          }
                          alt={item.productName}
=======
                <div className="od-items-list">
                  {order.items?.map((item) => (
                    <div key={item._id} className="od-item">
                      {/* Image */}
                      {item.coverImage ? (
                        <img
                          src={
                            item.coverImage.startsWith("http")
                              ? item.coverImage
                              : `http://localhost:5000${item.coverImage}`
                          }
                          alt={item.name}
>>>>>>> Stashed changes
                          className="od-item-img"
                        />
                      ) : (
                        <div className="od-item-img-ph">
                          <Package size={22} />
                        </div>
                      )}

                      {/* Details */}
                      <div className="od-item-details">
                        <div className="od-item-name-row">
<<<<<<< Updated upstream
                          <p className="od-item-name">{item.productName}</p>
                          <span className={`od-item-status-badge ${iCfg.cls}`}>
                            {iCfg.label}
                          </span>
                        </div>

                        {(item.variant?.size || item.variant?.color) && (
                          <p className="od-item-variant">
                            {[item.variant.size, item.variant.color].filter(Boolean).join(" · ")}
=======
                          <p className="od-item-name">{item.name}</p>
                        </div>

                        {(item.size || item.color) && (
                          <p className="od-item-variant">
                            {[item.size, item.color].filter(Boolean).join(" · ")}
>>>>>>> Stashed changes
                          </p>
                        )}

                        <div className="od-item-pricing">
                          <span className="od-item-unit">
                            {formatCurrency(item.price)} × {item.quantity}
                          </span>
                          <span className="od-item-total">
<<<<<<< Updated upstream
                            {formatCurrency(item.itemTotal)}
                          </span>
                        </div>

                        {/* Item cancellation / return info */}
                        {item.cancellationReason && (
                          <p className="od-item-reason cancelled-reason">
                            Cancellation reason: {item.cancellationReason}
                          </p>
                        )}
                        {item.returnReason && item.returnStatus !== "None" && (
                          <p className="od-item-reason return-reason">
                            Return reason: {item.returnReason}
                          </p>
                        )}
                        {itemRetBadge && (
                          <span className={`od-return-badge ${itemRetBadge.cls}`}>
                            <RotateCcw size={11} /> {itemRetBadge.label}
                          </span>
                        )}

                        {/* Per-item action buttons */}
                        {(canCancelThisItem || canReturnThisItem) && (
                          <div className="od-item-actions">
                            {canCancelThisItem && (
                              <button
                                className="od-item-cancel-btn"
                                id={`cancel-item-${item._id}`}
                                onClick={() => setModal({ type: "cancelItem", itemId: item._id, busy: false })}
                              >
                                <XCircle size={13} /> Cancel Item
                              </button>
                            )}
                            {canReturnThisItem && (
                              <button
                                className="od-item-return-btn"
                                id={`return-item-${item._id}`}
                                onClick={() => setModal({ type: "returnItem", itemId: item._id, busy: false })}
                              >
                                <RotateCcw size={13} /> Return Item
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


            {/* DELIVERY ADDRESS */}
            <div className="od-card">
              <h2 className="od-card-title">
                <MapPin size={17} /> Delivery Address
              </h2>

              <div className="od-address">
                <p className="od-addr-name">{addr.fullName}</p>
                <p className="od-addr-phone">{addr.phone}</p>
                <p className="od-addr-line">
                  {[addr.house, addr.street].filter(Boolean).join(", ")}
                </p>
                <p className="od-addr-line">
                  {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>

          </div>


          {/* ── RIGHT COLUMN ── */}
          <div className="od-right">

            {/* PAYMENT */}
            <div className="od-card">
              <h2 className="od-card-title">
                <CreditCard size={17} /> Payment
              </h2>

              <div className="od-payment-info">
                <div className="od-pay-row">
                  <span>Method</span>
                  <span>{order.paymentMethod}</span>
                </div>
                <div className="od-pay-row">
                  <span>Status</span>
                  <span className={`od-pay-badge ${paymentCfg.cls}`}>
                    {paymentCfg.label}
                  </span>
=======
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              {/* DELIVERY ADDRESS */}
              <div className="od-card">
                <h2 className="od-card-title">
                  <MapPin size={17} /> Delivery Address
                </h2>

                <div className="od-address">
                  <p className="od-addr-name">{addr.fullName}</p>
                  <p className="od-addr-phone">{addr.phone}</p>
                  <p className="od-addr-line">
                    {[addr.house, addr.street].filter(Boolean).join(", ")}
                  </p>
                  <p className="od-addr-line">
                    {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

            </div>


            {/* ── RIGHT COLUMN ── */}
            <div className="od-right">

              {/* PAYMENT */}
              <div className="od-card">
                <h2 className="od-card-title">
                  <CreditCard size={17} /> Payment
                </h2>

                <div className="od-payment-info">
                  <div className="od-pay-row">
                    <span>Method</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                  <div className="od-pay-row">
                    <span>Status</span>
                    <span className={`od-pay-badge ${paymentCfg.cls}`}>
                      {paymentCfg.label}
                    </span>
                  </div>
>>>>>>> Stashed changes
                </div>
              </div>


              {/* PRICING SUMMARY */}
              <div className="od-card od-pricing-card">
                <h2 className="od-card-title">Order Summary</h2>

<<<<<<< Updated upstream
              <div className="od-pricing">
                <div className="od-price-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="od-price-row discount">
                    <span>Discount</span>
                    <span>−{formatCurrency(order.discount)}</span>
=======
                <div className="od-pricing">
                  <div className="od-price-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(pricing.subtotal)}</span>
>>>>>>> Stashed changes
                  </div>

<<<<<<< Updated upstream
                <div className="od-price-row">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCharge > 0
                      ? formatCurrency(order.shippingCharge)
                      : "FREE"}
                  </span>
                </div>
=======
                  {pricing.packagingFee > 0 && (
                    <div className="od-price-row">
                      <span>Packaging</span>
                      <span>{formatCurrency(pricing.packagingFee)}</span>
                    </div>
                  )}
>>>>>>> Stashed changes

                  <div className="od-price-row">
                    <span>Shipping</span>
                    <span>
                      {pricing.shippingFee > 0
                        ? formatCurrency(pricing.shippingFee)
                        : "FREE"}
                    </span>
                  </div>

<<<<<<< Updated upstream
                <div className="od-price-row total">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
=======
                  <div className="od-price-divider" />

                  <div className="od-price-row total">
                    <span>Total</span>
                    <span>{formatCurrency(pricing.total)}</span>
                  </div>
>>>>>>> Stashed changes
                </div>
              </div>


              {/* BACK BUTTON */}
              <button
                className="od-back-full"
                onClick={() => navigate("/orders")}
                id="back-to-orders-bottom"
              >
                ← BACK TO MY ORDERS
              </button>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default OrderDetails;
