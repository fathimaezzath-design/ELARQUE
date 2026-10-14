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
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  getOrderDetails,
  cancelOrder,
  cancelOrderItem,
  requestOrderReturn,
  requestItemReturn,
} from "../../services/orderService";
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

  // Modal state
  const [modal, setModal] = useState(null);
  // { type: "cancelOrder"|"cancelItem"|"returnOrder"|"returnItem", itemId?, busy }

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

  // ── ACTION HANDLERS ───────────────────────────────

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
        <button className="od-back-btn" onClick={() => navigate("/orders")} id="back-to-orders-top">
          <ArrowLeft size={15} /> MY ORDERS
        </button>
      </header>

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
            {canCancelOrder && (
              <button
                className="od-btn-cancel-order"
                id="cancel-order-btn"
                onClick={() => setModal({ type: "cancelOrder", busy: false })}
              >
                <XCircle size={15} /> Cancel Order
              </button>
            )}
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


        <div className="od-grid">

          {/* ── LEFT COLUMN ── */}
          <div className="od-left">

            {/* ITEMS */}
            <div className="od-card">
              <h2 className="od-card-title">
                <Package size={17} /> Items Ordered
              </h2>

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
                          <p className="od-item-name">{item.productName}</p>
                          <span className={`od-item-status-badge ${iCfg.cls}`}>
                            {iCfg.label}
                          </span>
                        </div>

                        {(item.variant?.size || item.variant?.color) && (
                          <p className="od-item-variant">
                            {[item.variant.size, item.variant.color].filter(Boolean).join(" · ")}
                          </p>
                        )}

                        <div className="od-item-pricing">
                          <span className="od-item-unit">
                            {formatCurrency(item.price)} × {item.quantity}
                          </span>
                          <span className="od-item-total">
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
                </div>
              </div>
            </div>


            {/* PRICING SUMMARY */}
            <div className="od-card od-pricing-card">
              <h2 className="od-card-title">Order Summary</h2>

              <div className="od-pricing">
                <div className="od-price-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="od-price-row discount">
                    <span>Discount</span>
                    <span>−{formatCurrency(order.discount)}</span>
                  </div>
                )}

                <div className="od-price-row">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCharge > 0
                      ? formatCurrency(order.shippingCharge)
                      : "FREE"}
                  </span>
                </div>

                <div className="od-price-divider" />

                <div className="od-price-row total">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
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
  );
}

export default OrderDetails;
