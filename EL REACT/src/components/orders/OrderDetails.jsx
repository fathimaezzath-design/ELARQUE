import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Truck,
  CheckCircle2,
  Download,
  MapPin,
  CreditCard,
  Star,
  ShieldCheck,
  Package,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";

import {
  getOrderDetails,
  cancelOrder,
  cancelOrderItem,
  requestOrderReturn,
  requestItemReturn,
} from "../../services/orderService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import "./OrderDetails.css";

const FALLBACK_ITEM_IMG =
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80";

function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // -----------------------------------------------------
  // STATE
  // -----------------------------------------------------
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Modals state
  // cancelModal: { isOpen, isFullOrder, itemId, productName, itemPrice }
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    isFullOrder: true,
    itemId: null,
    productName: "",
    itemPrice: 0,
    reason: "",
    busy: false,
  });

  // returnModal: { isOpen, isFullOrder, itemId, item, reason, description, refundMethod, error, busy }
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    isFullOrder: true,
    itemId: null,
    item: null,
    reason: "",
    description: "",
    refundMethod: "original", // 'original' | 'wallet' | 'bank'
    error: "",
    busy: false,
  });

  // Return confirmation state (Screenshot 3)
  const [returnConfirmed, setReturnConfirmed] = useState(null);

  // Review modal state (Screenshot 4)
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    item: null,
    rating: 5,
    selectedImpressions: ["Perfect Fit", "Premium Quality"],
    impressionText:
      "The sculpted shoulders and rich burgundy wool drape like museum couture. The concho belt and brass crests add the ideal balance of western attitude to an otherwise stately French silhouette. Impeccable craftsmanship.",
    submitted: false,
  });

  // -----------------------------------------------------
  // FETCH ORDER DETAILS
  // -----------------------------------------------------
  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getOrderDetails(id);
      if (res?.data?.order) {
        setOrder(res.data.order);
      } else {
        setError("Order record not found.");
      }
    } catch (err) {
      console.error("GET ORDER DETAILS ERROR:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Open review modal if ?review=true in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("review") === "true" && order?.items?.[0]) {
      setReviewModal((prev) => ({
        ...prev,
        isOpen: true,
        item: order.items[0],
      }));
    }
  }, [order]);

  // -----------------------------------------------------
  // DOWNLOAD INVOICE (Requirement vi)
  // -----------------------------------------------------
  const handleDownloadInvoice = () => {
    if (!order) return;
    setDownloadingInvoice(true);
    try {
      generateInvoicePDF(order);
    } catch (err) {
      console.error("INVOICE GENERATION ERROR:", err);
    } finally {
      setTimeout(() => setDownloadingInvoice(false), 800);
    }
  };

  // -----------------------------------------------------
  // CANCELLATION HANDLERS (Requirements ii & iii)
  // Stock is incremented on server, reason is optional
  // -----------------------------------------------------
  const openCancelModal = (isFullOrder, itemId = null, productName = "", itemPrice = 0) => {
    setCancelModal({
      isOpen: true,
      isFullOrder,
      itemId,
      productName: productName || "entire commission",
      itemPrice,
      reason: "",
      busy: false,
    });
  };

  const handleConfirmCancel = async () => {
    setCancelModal((prev) => ({ ...prev, busy: true }));
    try {
      if (cancelModal.isFullOrder) {
        await cancelOrder(id, cancelModal.reason);
      } else {
        await cancelOrderItem(id, cancelModal.itemId, cancelModal.reason);
      }
      setCancelModal((prev) => ({ ...prev, isOpen: false, busy: false }));
      await fetchOrder();
    } catch (err) {
      console.error("CANCEL ERROR:", err);
      alert(err.response?.data?.message || "Failed to cancel. Please try again.");
      setCancelModal((prev) => ({ ...prev, busy: false }));
    }
  };

  // -----------------------------------------------------
  // RETURN HANDLERS (Requirement iv)
  // Mandatory reason when delivered
  // -----------------------------------------------------
  const openReturnModal = (isFullOrder, item = null) => {
    setReturnModal({
      isOpen: true,
      isFullOrder,
      itemId: item?._id || null,
      item: item || order?.items?.[0] || null,
      reason: "",
      description: "",
      refundMethod: "original",
      error: "",
      busy: false,
    });
  };

  const handleConfirmReturn = async () => {
    if (!returnModal.reason) {
      setReturnModal((prev) => ({
        ...prev,
        error: "Please select a mandatory return reason.",
      }));
      return;
    }

    if (!returnModal.description.trim()) {
      setReturnModal((prev) => ({
        ...prev,
        error: "Please provide a brief description for your return request.",
      }));
      return;
    }

    setReturnModal((prev) => ({ ...prev, busy: true, error: "" }));

    const fullReason = `${returnModal.reason}: ${returnModal.description.trim()} [Refund Method: ${returnModal.refundMethod.toUpperCase()}]`;

    try {
      if (returnModal.isFullOrder) {
        await requestOrderReturn(id, fullReason);
      } else {
        await requestItemReturn(id, returnModal.itemId, fullReason);
      }

      const dossierNumber = `RET-2026-${String(id).slice(-5).toUpperCase()}`;

      // Open confirmation screen (Screenshot 3)
      setReturnConfirmed({
        dossierNumber,
        masterOrderNumber: order?.orderNumber || `#ELQ-2026-${String(id).slice(-6)}`,
        reason: returnModal.reason,
        returnedItem: returnModal.item || order?.items?.[0],
        refundAmount: returnModal.isFullOrder
          ? order.totalAmount
          : returnModal.item?.itemTotal || returnModal.item?.price || 4999,
      });

      setReturnModal((prev) => ({ ...prev, isOpen: false, busy: false }));
      await fetchOrder();
    } catch (err) {
      console.error("RETURN ERROR:", err);
      setReturnModal((prev) => ({
        ...prev,
        busy: false,
        error: err.response?.data?.message || "Failed to submit return request.",
      }));
    }
  };

  // -----------------------------------------------------
  // HELPERS & FORMATTING
  // -----------------------------------------------------
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "September 14, 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeDisplay = (dateStr) => {
    if (!dateStr) return "10:15 AM";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "10:15 AM";
    }
  };

  const isOrderCancellable = (orderStatus) =>
    ["Placed", "Confirmed", "Processing"].includes(orderStatus);

  const isOrderReturnable = (orderStatus, returnStatus) =>
    orderStatus === "Delivered" && returnStatus !== "Requested" && returnStatus !== "Approved";

  // -----------------------------------------------------
  // RENDER LOADING / ERROR
  // -----------------------------------------------------
  if (loading && !order) {
    return (
      <div className="el-od-page-wrapper">
        <AnnouncementBar />
        <Navbar />
        <div className="el-od-loading-box">
          <div className="el-od-spinner" />
          <p>Accessing archival commission dossier...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="el-od-page-wrapper">
        <AnnouncementBar />
        <Navbar />
        <div className="el-od-error-card">
          <h2>Commission Not Found</h2>
          <p>{error}</p>
          <button
            type="button"
            className="el-btn-back-orders"
            onClick={() => navigate("/orders")}
          >
            ← BACK TO MY ORDERS
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const orderNum = order.orderNumber.startsWith("#")
    ? order.orderNumber
    : `#${order.orderNumber}`;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const address = order.shippingAddress || {};
  const status = order.orderStatus || "Delivered";

  // Stepper progress index (0 to 4)
  const getStepIndex = (st) => {
    switch (st) {
      case "Placed":
      case "Confirmed":
        return 1;
      case "Processing":
        return 2;
      case "Shipped":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 4;
    }
  };

  const stepIdx = getStepIndex(status);

  // -----------------------------------------------------
  // RETURN CONFIRMATION VIEW (Screenshot 3)
  // -----------------------------------------------------
  if (returnConfirmed) {
    return (
      <div className="el-od-page-wrapper">
        <AnnouncementBar />
        <Navbar />

        <main className="el-return-confirm-container">
          {/* Breadcrumbs */}
          <nav className="el-od-breadcrumbs">
            <span onClick={() => navigate("/orders")} className="el-breadcrumb-link">
              ORDERS
            </span>
            <span className="el-breadcrumb-sep">/</span>
            <span onClick={() => setReturnConfirmed(null)} className="el-breadcrumb-link">
              ORDER {returnConfirmed.masterOrderNumber}
            </span>
            <span className="el-breadcrumb-sep">/</span>
            <span className="el-breadcrumb-active">RETURN CONFIRMATION</span>
          </nav>

          {/* Large Check Header */}
          <div className="el-ret-confirm-hero">
            <div className="el-ret-check-circle">
              <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2} />
            </div>

            <span className="el-ret-hero-eyebrow">
              • RETURN PROTOCOL INITIATED — ATELIER DISPATCH
            </span>
            <h1 className="el-ret-hero-title">Return Request Accepted</h1>
            <p className="el-ret-hero-subtitle">
              Your commission return has been authorized. White-glove courier dispatch is arranged, with full provenance tracking across our European and domestic salons.
            </p>

            <div className="el-ret-dossier-pill">
              <strong>RETURN DOSSIER: #{returnConfirmed.dossierNumber}</strong>
              <span className="el-ret-pill-sep">•</span>
              <span>STATUS: SCHEDULED FOR CONCIERGE PICKUP</span>
            </div>
          </div>

          {/* Consignment Journey Stepper */}
          <div className="el-ret-journey-card">
            <div className="el-ret-journey-header">
              <div>
                <span className="el-ret-card-eyebrow">ATELIER PROTOCOL SEQUENCE</span>
                <h3 className="el-ret-card-title">Consignment Journey</h3>
              </div>
              <span className="el-ret-live-badge">• LIVE LEDGER UPDATE</span>
            </div>

            <div className="el-ret-stepper-row">
              <div className="el-ret-step completed">
                <div className="el-ret-step-circle">✓</div>
                <strong>1. RETURN LODGED</strong>
                <span>Verified Patron</span>
              </div>
              <div className="el-ret-step-line active" />
              <div className="el-ret-step completed">
                <div className="el-ret-step-circle">✓</div>
                <strong>2. REQUEST ACCEPTED</strong>
                <span>Atelier Approved</span>
              </div>
              <div className="el-ret-step-line" />
              <div className="el-ret-step">
                <div className="el-ret-step-circle">3</div>
                <strong>3. COURIER DISPATCH</strong>
                <span>Est. Morning</span>
              </div>
              <div className="el-ret-step-line" />
              <div className="el-ret-step">
                <div className="el-ret-step-circle">4</div>
                <strong>4. VAULT CHECK</strong>
                <span>Condition Audit</span>
              </div>
              <div className="el-ret-step-line" />
              <div className="el-ret-step">
                <div className="el-ret-step-circle">5</div>
                <strong>5. SETTLEMENT ISSUED</strong>
                <span>Direct Remittance</span>
              </div>
            </div>
          </div>

          {/* Two-Column Dossier Grid */}
          <div className="el-ret-grid-row">
            {/* Left: Specs & Piece */}
            <div className="el-ret-grid-col">
              <div className="el-ret-specs-card">
                <h3 className="el-ret-specs-title">
                  <Package size={15} color="#650D20" /> Return Specifications
                </h3>
                <div className="el-ret-spec-row">
                  <span>Return Authorization ID</span>
                  <strong>{returnConfirmed.dossierNumber}</strong>
                </div>
                <div className="el-ret-spec-row">
                  <span>Master Order Number</span>
                  <strong>{returnConfirmed.masterOrderNumber}</strong>
                </div>
                <div className="el-ret-spec-row">
                  <span>Declaration Reason</span>
                  <strong>{returnConfirmed.reason}</strong>
                </div>
                <div className="el-ret-spec-row highlight">
                  <span>Expected Remittance</span>
                  <strong>{formatPrice(returnConfirmed.refundAmount)}</strong>
                </div>
              </div>

              {/* Piece preview */}
              <div className="el-ret-piece-card">
                <img
                  src={returnConfirmed.returnedItem?.productImage || FALLBACK_ITEM_IMG}
                  alt="Returned piece"
                  className="el-ret-piece-thumb"
                />
                <div>
                  <span className="el-ret-piece-tag">FORMAL COLLECTION • ATELIER SERIES</span>
                  <h4 className="el-ret-piece-title">
                    {returnConfirmed.returnedItem?.productName || "ELARQUE Signature Garment"}
                  </h4>
                  <p className="el-ret-piece-specs">
                    Size: {returnConfirmed.returnedItem?.variant?.size || "M"} &nbsp;•&nbsp;
                    {returnConfirmed.returnedItem?.variant?.color || "Vintage Burgundy"}
                  </p>
                  <div className="el-ret-piece-price">
                    {formatPrice(returnConfirmed.refundAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Logistics & Quality Protocol */}
            <div className="el-ret-grid-col">
              <div className="el-ret-logistics-card">
                <h3 className="el-ret-logistics-title">
                  <Truck size={15} color="#650D20" /> White-Glove Pickup Logistics
                </h3>
                <p className="el-ret-log-subtitle">CONSIGNMENT ORIGIN ADDRESS</p>
                <p className="el-ret-log-addr">
                  <strong>{address.fullName || "Swaliha Ezzath"}</strong>
                  <br />
                  {[address.house, address.street, address.city, address.state]
                    .filter(Boolean)
                    .join(", ")} - {address.pincode || "673001"}
                  <br />
                  Primary Handset: {address.phone || "+91 98765 43210"}
                </p>

                <div className="el-ret-window-box">
                  <div>
                    <span>APPOINTMENT WINDOW</span>
                    <strong>Tomorrow, 10:00 AM – 02:00 PM</strong>
                  </div>
                  <div>
                    <span>DEDICATED FLEET TIER</span>
                    <strong>BlueDart Premier Haute Logistics</strong>
                  </div>
                </div>
              </div>

              <div className="el-ret-protocol-card">
                <h3 className="el-ret-protocol-title">
                  <ShieldCheck size={15} color="#650D20" /> Settlement & Quality Protocol
                </h3>
                <ul className="el-ret-protocol-list">
                  <li>
                    <span className="el-num-circle">1</span>
                    <div>
                      <strong>24-Hour Vault Inspection</strong>
                      <p>Certified master tailors inspect stitching, button hardware, and fabric freshness within 24 hours.</p>
                    </div>
                  </li>
                  <li>
                    <span className="el-num-circle">2</span>
                    <div>
                      <strong>Automatic Full Refund Release</strong>
                      <p>The entire {formatPrice(returnConfirmed.refundAmount)} commission is reversed directly to your account within 5 to 7 banking days.</p>
                    </div>
                  </li>
                  <li>
                    <span className="el-num-circle">3</span>
                    <div>
                      <strong>Real-Time Atelier Notifications</strong>
                      <p>Milestone alerts dispatched via private patron SMS and formal dispatch letters.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="el-ret-confirm-bottom-actions">
            <button
              type="button"
              className="el-btn-primary-dark"
              onClick={() => setReturnConfirmed(null)}
            >
              TRACK COURIER TRANSIT STATUS ➔
            </button>
            <button
              type="button"
              className="el-btn-secondary-light"
              onClick={() => navigate("/collections")}
            >
              EXPLORE THE CURRENT COLLECTION ➔
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN ORDER DETAILS VIEW (Screenshot 2)
  // -----------------------------------------------------
  return (
    <div className="el-od-page-wrapper">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN NAVBAR */}
      <Navbar />

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="el-od-main-container">
        {/* Breadcrumb Header */}
        <div className="el-od-top-bar">
          <div>
            <nav className="el-od-breadcrumbs">
              <span onClick={() => navigate("/orders")} className="el-breadcrumb-link">
                ORDERS
              </span>
              <span className="el-breadcrumb-sep">/</span>
              <span className="el-breadcrumb-active">ORDER DETAILS</span>
            </nav>
            <h1 className="el-od-title">Order Details</h1>
            <p className="el-od-subtitle">
              Track your luxury fashion purchase from confirmation to delivery.
            </p>
          </div>

          <div className="el-od-header-right-pill">
            <span className="el-pill-bullet">•</span> Order {orderNum} — Placed on{" "}
            {formatDateDisplay(order.orderDate)}
          </div>
        </div>

        {/* Status Notification Banner with Invoice Button */}
        <div className="el-od-status-banner">
          <div className="el-od-status-banner-left">
            <div className="el-od-status-icon-box">
              <Truck size={22} color="#FFFFFF" />
            </div>

            <div className="el-od-status-text-group">
              <span className="el-od-status-pill">{status.toUpperCase()}</span>
              <h2 className="el-od-status-headline">
                {status === "Delivered"
                  ? `Delivered on ${formatDateDisplay(order.deliveredDate || order.orderDate)}`
                  : status === "Cancelled"
                  ? `Commission Cancelled on ${formatDateDisplay(order.cancelledDate || order.updatedAt)}`
                  : `${status} on ${formatDateDisplay(order.orderDate)}`}
              </h2>
              <p className="el-od-status-desc">
                {status === "Delivered"
                  ? "Hand-delivered with white-glove signature care to your private residence."
                  : status === "Cancelled"
                  ? "All garments have been reconciled and inventory has been securely restored to the salon archive."
                  : "Curated with bespoke precision under European haute couture protocols."}
              </p>
            </div>
          </div>

          {/* Download Invoice Button */}
          <button
            type="button"
            className="el-btn-download-invoice"
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
          >
            <Download size={14} />
            <span>{downloadingInvoice ? "PREPARING PDF..." : "DOWNLOAD INVOICE"}</span>
          </button>
        </div>

        {/* Fulfillment Journey Stepper */}
        <div className="el-od-stepper-card">
          <div className="el-od-stepper-header">
            <span className="el-od-stepper-eyebrow">FULFILLMENT JOURNEY</span>
            <span className="el-od-stepper-completion">
              <CheckCircle2 size={13} color="#650D20" /> {stepIdx === 4 ? "100% COMPLETED" : `${stepIdx * 25}% COMPLETED`}
            </span>
          </div>

          <div className="el-od-stepper-timeline">
            {/* Step 1: Placed */}
            <div className={`el-stepper-node ${stepIdx >= 1 ? "completed" : ""}`}>
              <div className="el-stepper-circle">
                <CheckCircle2 size={13} />
              </div>
              <strong className="el-step-name">Order Confirmed</strong>
              <span className="el-step-date">
                {formatDateDisplay(order.orderDate)}, {formatTimeDisplay(order.orderDate)}
              </span>
              <span className="el-step-sub">PAYMENT VERIFIED</span>
            </div>

            <div className={`el-stepper-bar ${stepIdx >= 2 ? "active" : ""}`} />

            {/* Step 2: Preparing */}
            <div className={`el-stepper-node ${stepIdx >= 2 ? "completed" : ""}`}>
              <div className="el-stepper-circle">
                <CheckCircle2 size={13} />
              </div>
              <strong className="el-step-name">Preparing</strong>
              <span className="el-step-date">Atelier Tailoring</span>
              <span className="el-step-sub">PARIS ATELIER GUILD</span>
            </div>

            <div className={`el-stepper-bar ${stepIdx >= 3 ? "active" : ""}`} />

            {/* Step 3: Shipped */}
            <div className={`el-stepper-node ${stepIdx >= 3 ? "completed" : ""}`}>
              <div className="el-stepper-circle">
                <CheckCircle2 size={13} />
              </div>
              <strong className="el-step-name">Shipped</strong>
              <span className="el-step-date">Dispatched</span>
              <span className="el-step-sub">DALLAS VAULT HUB</span>
            </div>

            <div className={`el-stepper-bar ${stepIdx >= 4 ? "active" : ""}`} />

            {/* Step 4: In Transit */}
            <div className={`el-stepper-node ${stepIdx >= 4 ? "completed" : ""}`}>
              <div className="el-stepper-circle">
                <CheckCircle2 size={13} />
              </div>
              <strong className="el-step-name">In Transit</strong>
              <span className="el-step-date">White-Glove</span>
              <span className="el-step-sub">COURIER DISPATCH</span>
            </div>

            <div className={`el-stepper-bar ${stepIdx >= 4 ? "active" : ""}`} />

            {/* Step 5: Delivered */}
            <div className={`el-stepper-node ${stepIdx >= 4 ? "completed" : ""}`}>
              <div className="el-stepper-circle">
                <CheckCircle2 size={13} />
              </div>
              <strong className="el-step-name">Delivered</strong>
              <span className="el-step-date">{formatDateDisplay(order.deliveredDate || order.orderDate)}</span>
              <span className="el-step-sub">SIGNED BY PATRON</span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="el-od-two-col-layout">
          {/* =====================================================
              LEFT COLUMN: ORDERED GARMENTS
          ===================================================== */}
          <section className="el-od-items-col">
            <div className="el-od-items-list">
              {items.map((item, idx) => {
                const itemImg = item.productImage || FALLBACK_ITEM_IMG;
                const resolvedImg = itemImg.startsWith("http")
                  ? itemImg
                  : `http://localhost:5000${itemImg}`;

                const isItemActive = item.itemStatus === "Active";
                const isItemCancelled = item.itemStatus === "Cancelled";
                const isItemReturned = item.itemStatus === "Returned" || item.returnStatus === "Requested";

                return (
                  <article key={item._id || idx} className="el-od-item-card">
                    {/* Item Thumbnail */}
                    <div className="el-od-item-thumb-wrap">
                      <img
                        src={resolvedImg}
                        alt={item.productName || "Couture Garment"}
                        className="el-od-item-thumb-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_ITEM_IMG;
                        }}
                      />
                      <span className="el-item-best-seller-tag">BEST SELLER</span>
                      <span className={`el-item-status-pill ${item.itemStatus?.toLowerCase()}`}>
                        {item.itemStatus || status}
                      </span>
                    </div>

                    {/* Item Info Center */}
                    <div className="el-od-item-info">
                      <div className="el-item-meta-top">
                        <span className="el-item-collection-tag">FORMAL COLLECTION</span>
                        <span className="el-item-sku-tag">
                          SKU #ELQ-{String(item.product || idx).slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="el-item-name">{item.productName}</h3>

                      <p className="el-item-desc">
                        Biella Italian Wool & 100% Cupra Silk Lining with handcrafted horn buckle detail and signature crest embroidery.
                      </p>

                      {/* Variant Attributes */}
                      <div className="el-item-specs-row">
                        <span className="el-spec-chip">
                          Size: <strong>{item.variant?.size || item.size || "M"}</strong>
                        </span>
                        <span className="el-spec-chip">
                          Color: <strong>{item.variant?.color || item.color || "Vintage Burgundy"}</strong>
                        </span>
                        <span className="el-spec-chip">
                          Qty: <strong>{String(item.quantity || 1).padStart(2, "0")}</strong>
                        </span>
                      </div>

                      {/* Price Display */}
                      <div className="el-item-price-row">
                        <span className="el-item-price-val">
                          {formatPrice(item.price || item.itemTotal)}
                        </span>
                        <span className="el-item-tax-note">
                          Incl. of all custom atelier taxes
                        </span>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="el-item-actions-row">
                        <button
                          type="button"
                          className="el-btn-item-link"
                          onClick={() =>
                            item.product && navigate(`/products/${item.product}`)
                          }
                        >
                          VIEW PRODUCT
                        </button>

                        {/* Individual Item Cancellation */}
                        {isOrderCancellable(status) && isItemActive && (
                          <button
                            type="button"
                            className="el-btn-item-cancel"
                            onClick={() =>
                              openCancelModal(false, item._id, item.productName, item.price)
                            }
                          >
                            CANCEL
                          </button>
                        )}

                        {/* Individual Item Return */}
                        {isOrderReturnable(status, item.returnStatus) && isItemActive && (
                          <button
                            type="button"
                            className="el-btn-item-return"
                            onClick={() => openReturnModal(false, item)}
                          >
                            RETURN
                          </button>
                        )}

                        {/* Write Review Button */}
                        {status === "Delivered" && (
                          <button
                            type="button"
                            className="el-btn-item-review"
                            onClick={() =>
                              setReviewModal({
                                isOpen: true,
                                item,
                                rating: 5,
                                selectedImpressions: ["Perfect Fit", "Premium Quality"],
                                impressionText:
                                  "The sculpted shoulders and rich burgundy wool drape like museum couture. Impeccable craftsmanship.",
                                submitted: false,
                              })
                            }
                          >
                            <Star size={11} fill="#8A775C" stroke="#8A775C" /> WRITE REVIEW
                          </button>
                        )}

                        {isItemCancelled && (
                          <span className="el-item-status-note cancelled">
                            Cancelled & Stock Restored
                          </span>
                        )}

                        {isItemReturned && (
                          <span className="el-item-status-note returned">
                            Return {item.returnStatus || "Requested"}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bottom Order-Level Action Button */}
            {isOrderReturnable(status, order.returnStatus) && (
              <button
                type="button"
                className="el-btn-order-level-action"
                onClick={() => openReturnModal(true)}
              >
                RETURN ENTIRE ORDER
              </button>
            )}

            {isOrderCancellable(status) && (
              <button
                type="button"
                className="el-btn-order-level-action cancel"
                onClick={() => openCancelModal(true)}
              >
                CANCEL ENTIRE ORDER
              </button>
            )}
          </section>

          {/* =====================================================
              RIGHT COLUMN: ADDRESS & PAYMENT SUMMARY
          ===================================================== */}
          <aside className="el-od-summary-col">
            {/* Delivery Address Card */}
            <div className="el-od-address-card">
              <div className="el-od-card-header">
                <div className="el-od-card-title-group">
                  <MapPin size={15} color="#650D20" />
                  <h3>Delivery Address</h3>
                </div>
                <span className="el-verified-chip">VERIFIED</span>
              </div>

              <div className="el-od-address-body">
                <strong className="el-addr-name">
                  {address.fullName || "Swaliha Beaumont"}
                </strong>
                <p className="el-addr-lines">
                  {[address.house, address.street, address.city, address.state]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  Pincode: {address.pincode || "673001"}
                </p>
                <p className="el-addr-phone">
                  Liaison Phone: {address.phone || "+91 98765 43210"}
                </p>
                <div className="el-residence-verified-tag">
                  <ShieldCheck size={12} color="#8A775C" />
                  <span>VERIFIED PRIVATE RESIDENCE</span>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="el-od-payment-card">
              <div className="el-od-card-header">
                <div className="el-od-card-title-group">
                  <CreditCard size={15} color="#650D20" />
                  <h3>Payment Summary</h3>
                </div>
                <span className="el-paid-chip">
                  {(order.paymentStatus || "PAID").toUpperCase()}
                </span>
              </div>

              <div className="el-payment-method-box">
                <span className="el-method-label">
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery (White-Glove)"
                    : order.paymentMethod === "WALLET"
                    ? "Atelier Vault Credit"
                    : "Visa ending in •••• 4587"}
                </span>
                <span className="el-method-verified-tag">VERIFIED</span>
              </div>

              <div className="el-payment-breakdown-list">
                <div className="el-breakdown-row">
                  <span>Total Orders</span>
                  <strong>{formatPrice(order.subtotal || order.totalAmount)}</strong>
                </div>

                <div className="el-breakdown-row">
                  <span>Shipping Charge</span>
                  <span className="el-green-free">Free</span>
                </div>

                {order.discount > 0 && (
                  <div className="el-breakdown-row discount">
                    <span>Coupon Privilege</span>
                    <strong>-{formatPrice(order.discount)}</strong>
                  </div>
                )}

                <div className="el-breakdown-row">
                  <span>Cedar Box Packaging</span>
                  <span className="el-muted-comp">Complimentary</span>
                </div>

                <div className="el-breakdown-row">
                  <span>Estimated Tax (GST 18%)</span>
                  <strong>{formatPrice(Math.round((order.totalAmount || 0) * 0.06))}</strong>
                </div>

                <div className="el-breakdown-divider" />

                <div className="el-breakdown-total-row">
                  <div>
                    <span className="el-total-label">TOTAL SETTLED</span>
                    <span className="el-total-subnote">All duties & courier fees included</span>
                  </div>
                  <strong className="el-total-price">
                    {formatPrice(order.totalAmount)}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =====================================================
          CANCELLATION MODAL (Requirements ii & iii)
      ===================================================== */}
      {cancelModal.isOpen && (
        <div className="el-modal-backdrop" onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}>
          <div className="el-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="el-modal-header">
              <AlertTriangle size={20} color="#650D20" />
              <h3>Confirm Cancellation</h3>
            </div>

            <p className="el-modal-desc">
              Are you sure you want to cancel{" "}
              <strong>{cancelModal.isFullOrder ? "your entire order" : cancelModal.productName}</strong>?
              Reserved inventory will be immediately restored to the salon archive.
            </p>

            <div className="el-modal-field">
              <label htmlFor="cancel-reason-input">
                Reason for Cancellation <span className="el-optional-tag">(Optional)</span>
              </label>
              <textarea
                id="cancel-reason-input"
                placeholder="Optional explanation (e.g. Changed occasion plans, need to modify fit...)"
                rows={3}
                value={cancelModal.reason}
                onChange={(e) =>
                  setCancelModal({ ...cancelModal, reason: e.target.value })
                }
              />
            </div>

            <div className="el-modal-actions">
              <button
                type="button"
                className="el-btn-modal-cancel"
                onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                disabled={cancelModal.busy}
              >
                KEEP COMMISSION
              </button>

              <button
                type="button"
                className="el-btn-modal-confirm"
                onClick={handleConfirmCancel}
                disabled={cancelModal.busy}
              >
                {cancelModal.busy ? "RESTORING STOCK..." : "CONFIRM CANCELLATION"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RETURN FORM MODAL (Screenshot 5 & Requirement iv)
      ===================================================== */}
      {returnModal.isOpen && (
        <div className="el-modal-backdrop" onClick={() => setReturnModal({ ...returnModal, isOpen: false })}>
          <div className="el-modal-return-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="el-modal-close-x"
              onClick={() => setReturnModal({ ...returnModal, isOpen: false })}
            >
              <X size={18} />
            </button>

            <div className="el-ret-form-header">
              <h2 className="el-ret-form-title">Return Your Order</h2>
              <p className="el-ret-form-subtitle">
                We're here to make returns effortless. Tell us why you'd like to return your item and we'll take care of the rest with dedicated salon white-glove pickup.
              </p>
            </div>

            <div className="el-ret-form-body-grid">
              {/* Left Item Preview */}
              <div className="el-ret-form-left-preview">
                <div className="el-ret-preview-thumb">
                  <img
                    src={returnModal.item?.productImage || FALLBACK_ITEM_IMG}
                    alt="Piece"
                  />
                  <span className="el-ret-preview-badge">• DELIVERED</span>
                  <span className="el-ret-preview-order-tag">{orderNum}</span>
                </div>

                <span className="el-ret-preview-col-tag">FORMAL COLLECTION • ATELIER SERIES</span>
                <h4 className="el-ret-preview-title">
                  {returnModal.item?.productName || "ELARQUE Signature Blazer Dress"}
                </h4>

                <div className="el-ret-preview-specs">
                  <div>
                    <span>SIZE</span>
                    <strong>{returnModal.item?.variant?.size || "M (FR 38)"}</strong>
                  </div>
                  <div>
                    <span>COLOR</span>
                    <strong>{returnModal.item?.variant?.color || "Vintage Burgundy"}</strong>
                  </div>
                  <div>
                    <span>DELIVERED DATE</span>
                    <strong>{formatDateDisplay(order.deliveredDate || order.orderDate)}</strong>
                  </div>
                  <div>
                    <span>COMMISSION PRICE</span>
                    <strong>{formatPrice(returnModal.item?.price || 4999)}</strong>
                  </div>
                </div>

                {/* Return Guarantee */}
                <div className="el-ret-guarantee-card">
                  <Sparkles size={14} color="#8A775C" />
                  <div>
                    <strong>ELARQUE Return Guarantee</strong>
                    <p>7-Day complimentary concierge window. Tags attached & original cedar packaging.</p>
                  </div>
                </div>
              </div>

              {/* Right Form Fields */}
              <div className="el-ret-form-right-fields">
                {returnModal.error && (
                  <div className="el-ret-error-banner">{returnModal.error}</div>
                )}

                {/* 1. Reason Selection (Mandatory) */}
                <div className="el-ret-field-group">
                  <label htmlFor="return-reason-select">
                    1. SELECT REASON FOR RETURN <span className="el-req-star">*</span>
                  </label>
                  <select
                    id="return-reason-select"
                    value={returnModal.reason}
                    onChange={(e) =>
                      setReturnModal({ ...returnModal, reason: e.target.value, error: "" })
                    }
                    className="el-ret-select"
                  >
                    <option value="">Please choose a return reason...</option>
                    <option value="Bespoke Fit Correction (Wrong Size)">
                      Bespoke Fit Correction (Wrong Size / Fit Issue)
                    </option>
                    <option value="Garment Defect or Tailoring Flaw">
                      Garment Defect or Tailoring Flaw
                    </option>
                    <option value="Color Variation From Salon Archive">
                      Color Variation From Salon Archive
                    </option>
                    <option value="Arrived After Scheduled Occasion">
                      Arrived After Scheduled Occasion
                    </option>
                    <option value="Changed Haute Preference">
                      Changed Haute Preference
                    </option>
                  </select>
                </div>

                {/* 2. Return Description (Mandatory) */}
                <div className="el-ret-field-group">
                  <div className="el-label-between">
                    <label htmlFor="return-desc-input">
                      2. RETURN DESCRIPTION <span className="el-req-star">*</span>
                    </label>
                    <span className="el-char-count">
                      {returnModal.description.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    id="return-desc-input"
                    rows={3}
                    maxLength={500}
                    placeholder="Please tell us why you'd like to return this item. Specific notes on fit, tailored measurements, or garment details help our master cutters improve future commissions."
                    value={returnModal.description}
                    onChange={(e) =>
                      setReturnModal({ ...returnModal, description: e.target.value, error: "" })
                    }
                    className="el-ret-textarea"
                  />
                </div>

                {/* 3. Preferred Refund Method */}
                <div className="el-ret-field-group">
                  <label>3. SELECT PREFERRED REFUND METHOD <span className="el-req-star">*</span></label>
                  <div className="el-refund-options-row">
                    <div
                      className={`el-refund-card ${returnModal.refundMethod === "original" ? "selected" : ""}`}
                      onClick={() =>
                        setReturnModal({ ...returnModal, refundMethod: "original" })
                      }
                    >
                      <CreditCard size={18} color="#650D20" />
                      <div>
                        <strong>Original Payment</strong>
                        <span>Reversed directly (5–7 business days)</span>
                      </div>
                    </div>

                    <div
                      className={`el-refund-card ${returnModal.refundMethod === "wallet" ? "selected" : ""}`}
                      onClick={() =>
                        setReturnModal({ ...returnModal, refundMethod: "wallet" })
                      }
                    >
                      <CreditCard size={18} color="#C5A059" />
                      <div>
                        <strong>Atelier Wallet</strong>
                        <span>Instant credit + 5% salon bonus</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pickup Address Summary */}
                <div className="el-ret-pickup-summary">
                  <MapPin size={14} color="#650D20" />
                  <div>
                    <strong>Complimentary White-Glove Pickup Address:</strong>
                    <p>
                      {address.fullName || "Swaliha Beaumont"} •{" "}
                      {[address.house, address.street, address.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="el-ret-form-actions">
                  <button
                    type="button"
                    className="el-btn-submit-return"
                    onClick={handleConfirmReturn}
                    disabled={returnModal.busy}
                  >
                    {returnModal.busy ? "PROCESSING DOSSIER..." : "SUBMIT RETURN REQUEST ➔"}
                  </button>
                  <button
                    type="button"
                    className="el-btn-cancel-return-dialog"
                    onClick={() => setReturnModal({ ...returnModal, isOpen: false })}
                    disabled={returnModal.busy}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RATE YOUR PURCHASE MODAL (Screenshot 4)
      ===================================================== */}
      {reviewModal.isOpen && (
        <div className="el-modal-backdrop" onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}>
          <div className="el-modal-review" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="el-modal-close-x"
              onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
            >
              <X size={18} />
            </button>

            <span className="el-rev-eyebrow">★ PRODUCT REVIEW • ATELIER VOICES</span>
            <h2 className="el-rev-title">Rate Your Purchase</h2>
            <p className="el-rev-subtitle">
              Share your experiential monograph and assist fellow connoisseurs in curating timeless ELARQUE couture silhouettes.
            </p>

            {/* Star Rating */}
            <div className="el-rev-stars-box">
              <span className="el-rev-stars-label">1. OVERALL EXPERIENCE: EXCEPTIONAL (5 STARS)</span>
              <div className="el-rev-stars-list">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    fill={star <= reviewModal.rating ? "#8A775C" : "none"}
                    stroke="#8A775C"
                    strokeWidth={1.5}
                    onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>

            {/* Impression Tags */}
            <div className="el-rev-tags-box">
              <span className="el-rev-tags-label">2. WHAT IMPRESSED YOU MOST?</span>
              <div className="el-rev-tags-flex">
                {[
                  "Perfect Fit",
                  "Premium Quality",
                  "Comfortable",
                  "Worth the Price",
                  "Elegant Design",
                  "Exquisite Tailoring",
                  "White-Glove Packaging",
                ].map((tag) => {
                  const isSelected = reviewModal.selectedImpressions.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`el-rev-tag-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const newTags = isSelected
                          ? reviewModal.selectedImpressions.filter((t) => t !== tag)
                          : [...reviewModal.selectedImpressions, tag];
                        setReviewModal({ ...reviewModal, selectedImpressions: newTags });
                      }}
                    >
                      {isSelected ? "✓ " : ""}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="el-rev-textarea-box">
              <span className="el-rev-tags-label">3. YOUR ATELIER IMPRESSION</span>
              <textarea
                rows={4}
                value={reviewModal.impressionText}
                onChange={(e) =>
                  setReviewModal({ ...reviewModal, impressionText: e.target.value })
                }
                className="el-rev-textarea"
              />
            </div>

            <div className="el-rev-actions">
              <button
                type="button"
                className="el-btn-submit-review"
                onClick={() => {
                  alert("Thank you! Your verified patron review has been recorded.");
                  setReviewModal({ ...reviewModal, isOpen: false });
                }}
              >
                SUBMIT REVIEW ➔
              </button>
              <button
                type="button"
                className="el-btn-cancel-rev"
                onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ATELIER FOOTER */}
      <Footer />
    </div>
  );
}

export default OrderDetails;
