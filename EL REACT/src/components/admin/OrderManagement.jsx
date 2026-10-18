import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  X,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import formatPrice from "../../utils/formatPrice";
import "./OrderManagement.css";

const API_ORDERS_URL = "http://localhost:5000/api/admin/orders";

// Status configuration for badges
const STATUS_CONFIG = {
  Placed: { label: "Placed", className: "admin-badge-placed" },
  Confirmed: { label: "Confirmed", className: "admin-badge-confirmed" },
  Processing: { label: "Processing", className: "admin-badge-processing" },
  Shipped: { label: "Shipped", className: "admin-badge-shipped" },
  Delivered: { label: "Delivered", className: "admin-badge-delivered" },
  Cancelled: { label: "Cancelled", className: "admin-badge-cancelled" },
  Returned: { label: "Returned", className: "admin-badge-returned" },
};

const STATUS_TABS = [
  "All",
  "Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    returnedCount: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Modals
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, order: null });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    order: null,
    nextStatus: "",
    note: "",
    submitting: false,
  });
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    order: null,
    action: "Approve",
    submitting: false,
  });

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_ORDERS_URL}/stats`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (res?.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn("Could not fetch order stats from API:", err);
    }
  };

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem("adminToken");

      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab !== "All" ? activeTab : undefined,
        paymentStatus: paymentFilter !== "All" ? paymentFilter : undefined,
        search: searchQuery.trim() || undefined,
      };

      const res = await axios.get(API_ORDERS_URL, {
        params,
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });

      if (res?.data?.orders) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages || 1);
        setTotalOrders(res.data.totalOrders || res.data.orders.length);
      }
    } catch (err) {
      console.warn("Could not fetch orders from API:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, paymentFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders]);

  // Handle Search Input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Open Details Modal
  const handleOpenDetails = async (order) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_ORDERS_URL}/${order._id}`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (res?.data?.order) {
        setDetailsModal({ isOpen: true, order: res.data.order });
      } else {
        setDetailsModal({ isOpen: true, order });
      }
    } catch {
      setDetailsModal({ isOpen: true, order });
    }
  };

  // Open Status Modal
  const handleOpenStatusModal = (order) => {
    setStatusModal({
      isOpen: true,
      order,
      nextStatus: order.orderStatus,
      note: "",
      submitting: false,
    });
  };

  // Submit Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusModal.order || !statusModal.nextStatus) return;

    try {
      setStatusModal((prev) => ({ ...prev, submitting: true }));
      const adminToken = localStorage.getItem("adminToken");

      await axios.patch(
        `${API_ORDERS_URL}/${statusModal.order._id}/status`,
        {
          orderStatus: statusModal.nextStatus,
          note: statusModal.note,
        },
        {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        }
      );

      setStatusModal({ isOpen: false, order: null, nextStatus: "", note: "", submitting: false });
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      alert(err.response?.data?.message || "Failed to update order status.");
      setStatusModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Open Return Review Modal
  const handleOpenReturnModal = (order) => {
    setReturnModal({
      isOpen: true,
      order,
      action: "Approve",
      submitting: false,
    });
  };

  // Submit Return Action
  const handleConfirmReturnAction = async () => {
    if (!returnModal.order) return;

    try {
      setReturnModal((prev) => ({ ...prev, submitting: true }));
      const adminToken = localStorage.getItem("adminToken");

      await axios.patch(
        `${API_ORDERS_URL}/${returnModal.order._id}/return`,
        {
          action: returnModal.action,
        },
        {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        }
      );

      setReturnModal({ isOpen: false, order: null, action: "Approve", submitting: false });
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error("RETURN ACTION ERROR:", err);
      alert(err.response?.data?.message || "Failed to process return request.");
      setReturnModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Date Formatter
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        {/* Header */}
        <header className="admin-orders-header">
          <div className="admin-orders-title-group">
            <h1>Order Management</h1>
            <p>Monitor client commissions, order status transitions, and atelier dispatches.</p>
          </div>

          {/* Quick Stats Strip */}
          <div className="admin-stats-strip">
            <div className="admin-stat-card">
              <Package size={18} color="#dfc28d" />
              <div>
                <div className="admin-stat-number">{stats.totalOrders}</div>
                <div className="admin-stat-label">Total Orders</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <Clock size={18} color="#facc15" />
              <div>
                <div className="admin-stat-number">{stats.activeOrders}</div>
                <div className="admin-stat-label">Active / In Flow</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <Truck size={18} color="#4ade80" />
              <div>
                <div className="admin-stat-number">{stats.deliveredCount}</div>
                <div className="admin-stat-label">Delivered</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <DollarSign size={18} color="#dfc28d" />
              <div>
                <div className="admin-stat-number">{formatPrice(stats.totalRevenue || 0)}</div>
                <div className="admin-stat-label">Atelier Revenue</div>
              </div>
            </div>
          </div>
        </header>

        {/* Status Filter Tabs */}
        <div className="admin-status-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-status-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Search & Filters Toolbar */}
        <section className="admin-toolbar-card">
          <div className="admin-search-wrapper">
            <span className="admin-search-icon">
              <Search size={17} strokeWidth={2} />
            </span>
            <input
              type="text"
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by order #, client name, email, or city..."
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="admin-filters-right">
            <select
              className="admin-select-filter"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Payment Status"
            >
              <option value="All">Payment: All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </section>

        {/* Orders Table */}
        <section className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Client</th>
                  <th>Items Preview</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.orderStatus] || {
                      label: order.orderStatus,
                      className: "admin-badge-placed",
                    };
                    const firstItem = order.items?.[0] || {};
                    const isReturnRequested =
                      order.returnStatus === "Requested" ||
                      order.items?.some((i) => i.returnStatus === "Requested");

                    return (
                      <tr key={order._id}>
                        {/* Order Reference */}
                        <td>
                          <div className="admin-order-num-cell">
                            <span className="admin-order-id">#{order.orderNumber}</span>
                            <span className="admin-order-date">{formatDate(order.orderDate || order.createdAt)}</span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="admin-customer-cell">
                            <span className="admin-customer-name">
                              {order.shippingAddress?.fullName || order.user?.fullName || "Guest Client"}
                            </span>
                            <span className="admin-customer-sub">
                              {order.shippingAddress?.phone || order.user?.phoneNumber || order.user?.email || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Items Preview */}
                        <td>
                          <div className="admin-items-preview">
                            {firstItem.productImage && (
                              <img
                                src={
                                  firstItem.productImage.startsWith("http")
                                    ? firstItem.productImage
                                    : `http://localhost:5000${firstItem.productImage}`
                                }
                                alt={firstItem.productName || "Product"}
                                className="admin-item-thumb"
                              />
                            )}
                            <div className="admin-item-info">
                              <span className="admin-item-name">{firstItem.productName || "Atelier Silhouette"}</span>
                              <span className="admin-item-meta">
                                {order.items?.length || 1} item{order.items?.length > 1 ? "s" : ""}
                                {firstItem.variant?.size ? ` • Size: ${firstItem.variant.size}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Payment */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "11px", color: "#a8927e", fontWeight: "600" }}>
                              {order.paymentMethod || "COD"}
                            </span>
                            <span
                              className={
                                order.paymentStatus === "Paid"
                                  ? "admin-pay-badge-paid"
                                  : order.paymentStatus === "Refunded"
                                  ? "admin-pay-badge-refunded"
                                  : "admin-pay-badge-pending"
                              }
                            >
                              {order.paymentStatus || "Pending"}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td>
                          <strong style={{ color: "#dfc28d" }}>{formatPrice(order.totalAmount)}</strong>
                        </td>

                        {/* Order Status */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span className={`admin-badge ${statusInfo.className}`}>
                              <span className="admin-badge-dot" />
                              {statusInfo.label}
                            </span>
                            {isReturnRequested && (
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  color: "#fb923c",
                                  fontWeight: "600",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <AlertCircle size={11} /> Return Requested
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="admin-action-group">
                            <button
                              type="button"
                              className="admin-btn-action"
                              onClick={() => handleOpenDetails(order)}
                              title="View Order Dossier"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="admin-btn-status-change"
                              onClick={() => handleOpenStatusModal(order)}
                              title="Change Lifecycle Status"
                            >
                              <span>Update</span>
                            </button>

                            {isReturnRequested && (
                              <button
                                type="button"
                                style={{
                                  background: "rgba(249, 115, 22, 0.2)",
                                  border: "1px solid rgba(249, 115, 22, 0.4)",
                                  color: "#fdba74",
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                onClick={() => handleOpenReturnModal(order)}
                                title="Review Return Request"
                              >
                                <RotateCcw size={12} />
                                <span>Return</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="admin-empty-state">
                        <Package size={36} strokeWidth={1.5} color="#dfc28d" />
                        <p>{loading ? "Loading salon orders..." : "No orders found matching your filter criteria."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <footer className="admin-pagination-bar">
            <div>
              Showing {orders.length} of {totalOrders} order{totalOrders === 1 ? "" : "s"}
            </div>

            <div className="admin-pagination-nav">
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ margin: "0 8px", fontSize: "12px", color: "#dfc28d" }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </section>

        {/* =========================================================================
            ORDER DETAILS MODAL
        ========================================================================= */}
        {detailsModal.isOpen && detailsModal.order && (
          <div className="admin-modal-overlay" onClick={() => setDetailsModal({ isOpen: false, order: null })}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <div>
                  <h3>Order Dossier #{detailsModal.order.orderNumber}</h3>
                  <span style={{ fontSize: "11.5px", color: "#a8927e" }}>
                    Placed on {formatDate(detailsModal.order.orderDate || detailsModal.order.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setDetailsModal({ isOpen: false, order: null })}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                {/* Client & Shipping Grid */}
                <div className="admin-modal-grid-2">
                  <div className="admin-modal-info-box">
                    <div className="admin-modal-info-label">Client Information</div>
                    <div className="admin-modal-info-val">
                      {detailsModal.order.user?.fullName || detailsModal.order.shippingAddress?.fullName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#a8927e", marginTop: "4px" }}>
                      {detailsModal.order.user?.email || "No email on file"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#a8927e" }}>
                      {detailsModal.order.shippingAddress?.phone || detailsModal.order.user?.phoneNumber}
                    </div>
                  </div>

                  <div className="admin-modal-info-box">
                    <div className="admin-modal-info-label">Shipping Destination</div>
                    <div className="admin-modal-info-val">
                      {detailsModal.order.shippingAddress?.fullName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#a8927e", marginTop: "4px" }}>
                      {[
                        detailsModal.order.shippingAddress?.house,
                        detailsModal.order.shippingAddress?.street,
                        detailsModal.order.shippingAddress?.city,
                        detailsModal.order.shippingAddress?.state,
                        detailsModal.order.shippingAddress?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <div className="admin-modal-section-title">Commissions & Silhouettes</div>
                  <div className="admin-modal-items-list">
                    {detailsModal.order.items?.map((item, idx) => (
                      <div key={item._id || idx} className="admin-modal-item-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {item.productImage && (
                            <img
                              src={
                                item.productImage.startsWith("http")
                                  ? item.productImage
                                  : `http://localhost:5000${item.productImage}`
                              }
                              alt={item.productName}
                              className="admin-item-thumb"
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: "600", color: "#f7f1eb" }}>{item.productName}</div>
                            <div style={{ fontSize: "11.5px", color: "#a8927e" }}>
                              {item.variant?.size ? `Size: ${item.variant.size}` : ""}
                              {item.variant?.color ? ` • Color: ${item.variant.color}` : ""}
                              {` • Qty: ${item.quantity}`}
                            </div>
                            {item.itemStatus && item.itemStatus !== "Active" && (
                              <span style={{ fontSize: "11px", color: "#f87171", fontWeight: "600" }}>
                                Item Status: {item.itemStatus}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#dfc28d" }}>{formatPrice(item.itemTotal)}</strong>
                          <div style={{ fontSize: "11px", color: "#a8927e" }}>
                            {formatPrice(item.price)} each
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="admin-modal-grid-2">
                  <div className="admin-modal-info-box">
                    <div className="admin-modal-info-label">Payment & Method</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <span style={{ color: "#dfc28d", fontWeight: "600" }}>
                        {detailsModal.order.paymentMethod}
                      </span>
                      <span
                        className={
                          detailsModal.order.paymentStatus === "Paid"
                            ? "admin-pay-badge-paid"
                            : "admin-pay-badge-pending"
                        }
                      >
                        {detailsModal.order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="admin-modal-info-box">
                    <div className="admin-modal-info-label">Total Commission Amount</div>
                    <div style={{ fontSize: "18px", color: "#dfc28d", fontWeight: "700" }}>
                      {formatPrice(detailsModal.order.totalAmount)}
                    </div>
                    {detailsModal.order.discount > 0 && (
                      <div style={{ fontSize: "11.5px", color: "#4ade80" }}>
                        Includes {formatPrice(detailsModal.order.discount)} discount
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-modal-btn-cancel"
                  onClick={() => setDetailsModal({ isOpen: false, order: null })}
                >
                  Close Dossier
                </button>

                <button
                  type="button"
                  className="admin-modal-btn-confirm"
                  onClick={() => {
                    const ord = detailsModal.order;
                    setDetailsModal({ isOpen: false, order: null });
                    handleOpenStatusModal(ord);
                  }}
                >
                  Update Lifecycle Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATUS UPDATE MODAL
        ========================================================================= */}
        {statusModal.isOpen && statusModal.order && (
          <div className="admin-modal-overlay" onClick={() => setStatusModal({ isOpen: false, order: null, nextStatus: "", note: "", submitting: false })}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
              <div className="admin-modal-header">
                <h3>Update Order Status</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setStatusModal({ isOpen: false, order: null, nextStatus: "", note: "", submitting: false })}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div style={{ fontSize: "13px", color: "#b59f8c" }}>
                  Current Order: <strong style={{ color: "#dfc28d" }}>#{statusModal.order.orderNumber}</strong>
                  <br />
                  Current Status: <strong style={{ color: "#f7f1eb" }}>{statusModal.order.orderStatus}</strong>
                </div>

                <div>
                  <label className="admin-modal-section-title" style={{ display: "block", marginBottom: "8px" }}>
                    Select New Lifecycle State
                  </label>
                  <select
                    className="admin-select-filter"
                    style={{ width: "100%", padding: "12px 14px", fontSize: "13.5px" }}
                    value={statusModal.nextStatus}
                    onChange={(e) => setStatusModal((prev) => ({ ...prev, nextStatus: e.target.value }))}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>

                {statusModal.nextStatus === "Cancelled" && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "12.5px",
                      color: "#fca5a5",
                    }}
                  >
                    <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                    Cancelling this order will automatically restore reserved stock to inventory and refund paid funds to the client&apos;s wallet.
                  </div>
                )}

                <div>
                  <label className="admin-modal-section-title" style={{ display: "block", marginBottom: "8px" }}>
                    Status Transition Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="admin-search-input"
                    style={{ padding: "10px 14px", borderRadius: "10px", resize: "vertical" }}
                    placeholder="Enter dispatch notes, tracking reference, or cancellation reason..."
                    value={statusModal.note}
                    onChange={(e) => setStatusModal((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-modal-btn-cancel"
                  disabled={statusModal.submitting}
                  onClick={() => setStatusModal({ isOpen: false, order: null, nextStatus: "", note: "", submitting: false })}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-btn-confirm"
                  disabled={statusModal.submitting || statusModal.nextStatus === statusModal.order.orderStatus}
                  onClick={handleConfirmStatusChange}
                >
                  {statusModal.submitting ? "Updating..." : "Commit Status Change"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            RETURN REVIEW MODAL
        ========================================================================= */}
        {returnModal.isOpen && returnModal.order && (
          <div className="admin-modal-overlay" onClick={() => setReturnModal({ isOpen: false, order: null, action: "Approve", submitting: false })}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
              <div className="admin-modal-header">
                <h3>Review Return Request</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setReturnModal({ isOpen: false, order: null, action: "Approve", submitting: false })}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-return-alert-box">
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>
                    Return Request for Order #{returnModal.order.orderNumber}
                  </div>
                  <div style={{ fontSize: "12.5px" }}>
                    Client Reason: &quot;{returnModal.order.returnReason || "Customer requested return"}&quot;
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: "#b59f8c" }}>
                  Approving this return will mark the commission as <strong>Returned</strong>, return the inventory to warehouse stock, and credit{" "}
                  <strong style={{ color: "#dfc28d" }}>{formatPrice(returnModal.order.totalAmount)}</strong> back into the client&apos;s wallet.
                </div>

                <div>
                  <label className="admin-modal-section-title" style={{ display: "block", marginBottom: "8px" }}>
                    Action Decision
                  </label>
                  <select
                    className="admin-select-filter"
                    style={{ width: "100%", padding: "12px 14px", fontSize: "13.5px" }}
                    value={returnModal.action}
                    onChange={(e) => setReturnModal((prev) => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="Approve">Approve Return &amp; Refund to Wallet</option>
                    <option value="Reject">Reject Return Request</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-modal-btn-cancel"
                  disabled={returnModal.submitting}
                  onClick={() => setReturnModal({ isOpen: false, order: null, action: "Approve", submitting: false })}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-btn-confirm"
                  disabled={returnModal.submitting}
                  onClick={handleConfirmReturnAction}
                >
                  {returnModal.submitting ? "Processing..." : `Confirm ${returnModal.action}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
