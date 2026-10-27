import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Printer,
  Headphones,
  Check,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Download,
  MessageSquare,
  Package,
} from "lucide-react";

import { getUserReturnDetails, getOrderDetails } from "../../services/orderService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";
import "./ReturnDetails.css";

const FALLBACK_ITEM_IMG =
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80";

function ReturnDetails() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("itemId");

  const [returnDetails, setReturnDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liaisonNotice, setLiaisonNotice] = useState(false);

  const fetchDetails = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getUserReturnDetails(orderId, itemId);
      if (res?.data?.returnDetails) {
        setReturnDetails(res.data.returnDetails);
      } else {
        // Fallback to order
        const ordRes = await getOrderDetails(orderId);
        if (ordRes?.data?.order) {
          const ord = ordRes.data.order;
          const targetItem = itemId
            ? ord.items.find((i) => String(i._id) === String(itemId)) || ord.items[0]
            : ord.items[0];

          setReturnDetails({
            returnReferenceId:
              ord.returnReferenceId ||
              `RET-${ord.orderNumber ? ord.orderNumber.replace(/[^0-9]/g, "") : String(orderId).slice(-5)}`,
            orderId: ord._id,
            orderNumber: ord.orderNumber,
            orderDate: ord.orderDate,
            deliveredDate: ord.deliveredDate,
            item: targetItem,
            returnStatus: targetItem?.returnStatus || ord.returnStatus || "Requested",
            returnReason: targetItem?.returnReason || ord.returnReason || "Size or fit issue",
            returnDescription: targetItem?.returnDescription || ord.returnDescription || "",
            preferredRefundMethod: "ELARQUE Wallet",
            pickupAddress: targetItem?.pickupAddress || ord.pickupAddress || ord.shippingAddress,
            refundAmount: targetItem ? targetItem.itemTotal : ord.totalAmount,
            returnRequestedAt: targetItem?.returnRequestedAt || ord.returnRequestedAt || new Date(),
            paymentMethod: ord.paymentMethod,
          });
        } else {
          setError("No return records found for this commission.");
        }
      }
    } catch (err) {
      console.warn("Retrying with order details:", err);
      try {
        const ordRes = await getOrderDetails(orderId);
        if (ordRes?.data?.order) {
          const ord = ordRes.data.order;
          const targetItem = itemId
            ? ord.items.find((i) => String(i._id) === String(itemId)) || ord.items[0]
            : ord.items[0];

          setReturnDetails({
            returnReferenceId:
              ord.returnReferenceId ||
              `RET-${ord.orderNumber ? ord.orderNumber.replace(/[^0-9]/g, "") : String(orderId).slice(-5)}`,
            orderId: ord._id,
            orderNumber: ord.orderNumber,
            orderDate: ord.orderDate,
            deliveredDate: ord.deliveredDate,
            item: targetItem,
            returnStatus: targetItem?.returnStatus || ord.returnStatus || "Requested",
            returnReason: targetItem?.returnReason || ord.returnReason || "Size or fit issue",
            returnDescription: targetItem?.returnDescription || ord.returnDescription || "",
            preferredRefundMethod: "ELARQUE Wallet",
            pickupAddress: targetItem?.pickupAddress || ord.pickupAddress || ord.shippingAddress,
            refundAmount: targetItem ? targetItem.itemTotal : ord.totalAmount,
            returnRequestedAt: targetItem?.returnRequestedAt || ord.returnRequestedAt || new Date(),
            paymentMethod: ord.paymentMethod,
          });
        } else {
          setError("Return request record not found in archive.");
        }
      } catch (innerErr) {
        setError(
          innerErr.response?.data?.message || "Unable to retrieve return tracking information."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, itemId, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="el-rd-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-rd-loading-state">
          <div className="el-rd-spinner" />
          <p>Accessing return tracking ledger...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !returnDetails) {
    return (
      <div className="el-rd-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-rd-error-card">
          <AlertCircle size={36} color="#650D20" />
          <h2>Tracking Dossier Notice</h2>
          <p>{error || "No active return request details found."}</p>
          <div className="el-rd-btn-row">
            <button
              type="button"
              className="el-rd-btn-burgundy"
              onClick={() => navigate("/orders")}
            >
              MY COMMISSIONS
            </button>
            <button
              type="button"
              className="el-rd-btn-outline"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              ORDER DETAILS
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    returnReferenceId,
    orderNumber,
    item,
    returnStatus,
    returnReason,
    returnDescription,
    pickupAddress,
    refundAmount,
    returnRequestedAt,
    preferredRefundMethod,
    returnCustomerMessage,
    returnRejectionReason,
  } = returnDetails;

  const itemImg = item?.productImage || FALLBACK_ITEM_IMG;
  const resolvedImg = itemImg.startsWith("http") ? itemImg : `http://localhost:5000${itemImg}`;

  const formatShortDate = (dateString) => {
    if (!dateString) return "20 Jul, 02:45 PM";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "20 Jul, 02:45 PM";
    return (
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }) +
      ", " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Status mapping
  const s = (returnStatus || "").toLowerCase();
  const isApproved = ["approved", "picked up", "completed", "refunded"].includes(s);
  const isRefunded = ["completed", "refunded"].includes(s);
  const isRejected = s === "rejected";
  const isRequested = ["requested", "pending", "approved", "picked up", "completed", "refunded"].includes(s);
  const isCollected = ["picked up", "completed", "refunded"].includes(s);
  const isInspected = ["completed", "refunded"].includes(s);
  const isSettlement = isApproved;

  return (
    <div className="el-rd-page-root">
      <AnnouncementBar />
      <Navbar />

      <main className="el-rd-main-container">
        {/* Top Header Row with Breadcrumbs & Action Buttons */}
        <div className="el-rd-top-bar">
          <div>
            <nav className="el-rd-breadcrumbs">
              <span onClick={() => navigate("/orders")} className="el-rd-crumb-link">
                ORDERS
              </span>
              <span className="el-rd-crumb-sep">/</span>
              <span onClick={() => navigate(`/orders/${orderId}`)} className="el-rd-crumb-link">
                COMMISSIONS
              </span>
              <span className="el-rd-crumb-sep">/</span>
              <span className="el-rd-crumb-active">
                RETURN DOSSIER #{returnReferenceId}
              </span>
            </nav>

            <h1 className="el-rd-page-title">Return Details</h1>
            <p className="el-rd-page-subtitle">
              Track your return journey from white-glove pickup to vault settlement with complete
              provenance transparency.
            </p>
          </div>

          <div className="el-rd-top-actions">
            <button
              type="button"
              className="el-rd-btn-print"
              onClick={() => window.print()}
            >
              <Printer size={13} />
              <span>PRINT LABEL</span>
            </button>
            <button
              type="button"
              className="el-rd-btn-liaison"
              onClick={() => setLiaisonNotice(!liaisonNotice)}
            >
              <Headphones size={13} />
              <span>ATELIER LIAISON</span>
            </button>
          </div>
        </div>

        {/* Atelier Liaison Notice Banner */}
        {liaisonNotice && (
          <div className="el-rd-liaison-banner">
            <p>
              Your personal Atelier Liaison <strong>Camille Laurent</strong> has been alerted. For
              immediate inquiries regarding dossier <strong>#{returnReferenceId}</strong>, phone
              our European concierge desk at <strong>+33 1 42 68 00 00</strong>.
            </p>
          </div>
        )}

        {/* Rejection / Customer Message Alert */}
        {isRejected && (
          <div className="el-rd-rejection-banner">
            <AlertCircle size={16} />
            <div>
              <strong>Return Request Rejected</strong>
              <p>
                {returnRejectionReason ||
                  returnCustomerMessage ||
                  "This return could not be approved due to salon verification guidelines."}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Grid */}
        <div className="el-rd-grid">
          {/* =====================================================
              LEFT COLUMN: TRACKING TIMELINE & RETURNED PIECE
          ===================================================== */}
          <div className="el-rd-col-left">
            {/* Card 1: Consignment Reference & Stepper */}
            <div className="el-rd-card">
              <div className="el-rd-card-header">
                <div>
                  <span className="el-rd-header-eyebrow">CONSIGNMENT REFERENCE</span>
                  <h3 className="el-rd-ref-title">{returnReferenceId}</h3>
                </div>
                <span className={`el-rd-status-badge ${s}`}>
                  • {isRejected ? "RETURN REJECTED" : isRefunded ? "RETURN REFUNDED" : isApproved ? "RETURN APPROVED" : "PENDING REVIEW"}
                </span>
              </div>

              {/* 5-Step Stepper */}
              <div className="el-rd-stepper-list">
                {/* 1. REQUESTED */}
                <div className={`el-rd-step-node ${isRequested ? "done" : ""}`}>
                  <div className="el-rd-node-circle">
                    <Check size={13} />
                  </div>
                  <div className="el-rd-node-body">
                    <strong className="el-rd-node-title">REQUESTED</strong>
                    <span className="el-rd-node-date">{formatShortDate(returnRequestedAt)}</span>
                    <span className="el-rd-node-note">Logged in Vault</span>
                  </div>
                </div>

                {/* 2. COLLECTED */}
                <div className={`el-rd-step-node ${isCollected ? "done" : isRequested ? "current" : ""}`}>
                  <div className="el-rd-node-circle">
                    {isCollected ? <Check size={13} /> : <Truck size={13} />}
                  </div>
                  <div className="el-rd-node-body">
                    <strong className="el-rd-node-title">COLLECTED</strong>
                    <span className="el-rd-node-date">
                      {isCollected ? "Collected by Courier" : "Scheduled (Within 24h)"}
                    </span>
                    <span className="el-rd-node-note">BlueDart Secure</span>
                  </div>
                </div>

                {/* 3. INSPECTED */}
                <div className={`el-rd-step-node ${isInspected ? "done" : isCollected ? "current" : ""}`}>
                  <div className="el-rd-node-circle">
                    {isInspected ? <Check size={13} /> : <Package size={13} />}
                  </div>
                  <div className="el-rd-node-body">
                    <strong className="el-rd-node-title">INSPECTED</strong>
                    <span className="el-rd-node-date">
                      {isInspected ? "Audit Passed" : "Pending Intake"}
                    </span>
                    <span className="el-rd-node-note">Paris Atelier QA</span>
                  </div>
                </div>

                {/* 4. SETTLEMENT */}
                <div className={`el-rd-step-node ${isSettlement ? "done" : isInspected ? "current" : ""}`}>
                  <div className="el-rd-node-circle">
                    {isSettlement ? <Check size={13} /> : <Clock size={13} />}
                  </div>
                  <div className="el-rd-node-body">
                    <strong className="el-rd-node-title">SETTLEMENT</strong>
                    <span className="el-rd-node-date">
                      {isSettlement ? "Settled" : "In Progress"}
                    </span>
                    <span className="el-rd-node-note">Clearing Bureau</span>
                  </div>
                </div>

                {/* 5. COMPLETED */}
                <div className={`el-rd-step-node ${isSettlement ? "done" : ""}`}>
                  <div className="el-rd-node-circle">
                    {isSettlement ? <Check size={13} /> : <RotateCcw size={13} />}
                  </div>
                  <div className="el-rd-node-body">
                    <strong className="el-rd-node-title">COMPLETED</strong>
                    <span className="el-rd-node-date">
                      {isSettlement ? "Settlement Remitted" : "Est. 3–5 Days"}
                    </span>
                    <span className="el-rd-node-note">ELARQUE Wallet</span>
                  </div>
                </div>
              </div>

              {/* Bottom Estimated Banner */}
              <div className="el-rd-estimated-banner">
                <div className="el-rd-est-left">
                  <ShieldCheck size={16} color="#8A775C" className="el-rd-est-icon" />
                  <p>
                    Approved refunds are credited <strong>instantly</strong> to your{" "}
                    <strong>ELARQUE Wallet</strong> — usable for any future purchase.
                  </p>
                </div>
                <span className="el-rd-tls-tag">TLS 256 SECURITY SEALED</span>
              </div>
            </div>

            {/* Card 2: Returned Piece Card */}
            <div className="el-rd-card">
              <div className="el-rd-piece-layout">
                {/* Image */}
                <div className="el-rd-piece-thumb-container">
                  <img
                    src={resolvedImg}
                    alt={item?.productName || "Piece"}
                    className="el-rd-piece-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_ITEM_IMG;
                    }}
                  />
                  <span className="el-rd-piece-badge-top">RETURNED PIECE</span>
                  <div className="el-rd-piece-badge-bottom">
                    <span>ATELIER VAULT VERIFIED</span>
                  </div>
                </div>

                {/* Details */}
                <div className="el-rd-piece-content">
                  <span className="el-rd-piece-eyebrow">
                    FORMAL COLLECTION • ATELIER WESTERN SERIES
                  </span>
                  <h3 className="el-rd-piece-heading">
                    {item?.productName || "ELARQUE Signature Blazer Dress"}
                  </h3>

                  <div className="el-rd-piece-price-row">
                    <strong className="el-rd-price-current">
                      {formatPrice(item?.price || item?.itemTotal || refundAmount)}
                    </strong>
                    <span className="el-rd-price-orig">
                      {formatPrice((item?.price || refundAmount) + 401)}
                    </span>
                    <span className="el-rd-full-value-tag">FULL VALUE REFUND</span>
                  </div>

                  {/* 2x2 Specs Grid */}
                  <div className="el-rd-piece-specs-grid">
                    <div className="el-rd-spec-box">
                      <span className="el-rd-spec-title">SIZING SPEC</span>
                      <strong className="el-rd-spec-val">
                        {item?.variant?.size || item?.size || "M (FR 38 / US 6)"}
                      </strong>
                    </div>

                    <div className="el-rd-spec-box">
                      <span className="el-rd-spec-title">SILHOUETTING</span>
                      <strong className="el-rd-spec-val">
                        Structured Western Double-Breasted
                      </strong>
                    </div>

                    <div className="el-rd-spec-box">
                      <span className="el-rd-spec-title">HUE / SWATCH</span>
                      <strong className="el-rd-spec-val color">
                        <span className="el-rd-color-dot" />
                        {item?.variant?.color || item?.color || "Vintage Burgundy"}
                      </strong>
                    </div>

                    <div className="el-rd-spec-box">
                      <span className="el-rd-spec-title">HARDWARE</span>
                      <strong className="el-rd-spec-val">
                        Engraved Brass Monogram Buttons
                      </strong>
                    </div>
                  </div>

                  {/* Reason & Description Quote */}
                  <div className="el-rd-reason-quote">
                    <span className="el-rd-quote-label">Return Reason:</span>
                    <p className="el-rd-quote-text">"{returnReason}"</p>
                    {returnDescription && (
                      <p className="el-rd-quote-sub">{returnDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT COLUMN: PICKUP RESIDENCE, SETTLEMENT & ACTIONS
          ===================================================== */}
          <div className="el-rd-col-right">
            {/* Card 1: Pickup Residence */}
            <div className="el-rd-card">
              <div className="el-rd-card-header">
                <div className="el-rd-header-with-icon">
                  <Truck size={15} color="#650D20" />
                  <h4>PICKUP RESIDENCE</h4>
                </div>
                <span className="el-rd-completed-badge">
                  {isCollected ? "COMPLETED" : "SCHEDULED"}
                </span>
              </div>

              <div className="el-rd-residence-body">
                <span className="el-rd-res-label">PATRON DETAILS</span>
                <strong className="el-rd-res-name">
                  {pickupAddress?.fullName || "Swaliha Ezzath"}
                </strong>
                <p className="el-rd-res-addr">
                  {[
                    pickupAddress?.house,
                    pickupAddress?.street,
                    pickupAddress?.city,
                    pickupAddress?.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  — {pickupAddress?.pincode || "673001"}
                  <br />
                  India
                </p>
                <p className="el-rd-res-phone">
                  📞 {pickupAddress?.phone || "+91 98765 43210"}
                </p>

                <button
                  type="button"
                  className="el-rd-btn-review-logs"
                  onClick={() =>
                    alert("Courier Manifest: BlueDart White-Glove dispatch active. Tracking ref: BDX-RTN-90214-ELQ.")
                  }
                >
                  REVIEW COURIER LOGS
                </button>
              </div>
            </div>

            {/* Card 2: Wallet Refund Settlement */}
            <div className="el-rd-card">
              <div className="el-rd-card-header">
                <div className="el-rd-header-with-icon">
                  <RotateCcw size={15} color="#650D20" />
                  <h4>REFUND SETTLEMENT</h4>
                </div>
                <span className="el-rd-dot-indicator" />
              </div>

              <div className="el-rd-settlement-body">
                {/* Approved refund banner */}
                {isSettlement && (
                  <div className="el-rd-wallet-approved-banner">
                    <strong>✓ Your return has been approved.</strong>
                    <p>The refund amount has been credited to your ELARQUE Wallet.</p>
                  </div>
                )}

                <div className="el-rd-settle-row">
                  <span className="el-rd-settle-title">Settlement Method</span>
                  <strong className="el-rd-settle-val">ELARQUE Wallet</strong>
                </div>

                <div className="el-rd-settle-row">
                  <span className="el-rd-settle-title">Destination</span>
                  <span className="el-rd-settle-val">Your ELARQUE Wallet Balance</span>
                </div>

                <div className="el-rd-settle-row">
                  <span className="el-rd-settle-title">Expected Clearance</span>
                  <span className="el-rd-settle-val">
                    {isApproved ? "Credited to ELARQUE Wallet" : "Instant upon approval"}
                  </span>
                </div>

                <div className="el-rd-settle-amount-row">
                  <div>
                    <span className="el-rd-settle-amount-label">REFUND AMOUNT</span>
                    <div className="el-rd-settle-amount-val">
                      {formatPrice(refundAmount)}
                    </div>
                  </div>
                  <span className="el-rd-remittance-badge">WALLET CREDIT</span>
                </div>
              </div>
            </div>

            {/* Card 3: Concierge Commands */}
            <div className="el-rd-card">
              <span className="el-rd-commands-eyebrow">CONCIERGE COMMANDS</span>
              <div className="el-rd-commands-list">
                <button
                  type="button"
                  className="el-rd-btn-command primary"
                  onClick={() =>
                    alert(
                      "Live Transit Tracking: Courier picked up from residence and in transit to Regional Hub."
                    )
                  }
                >
                  <span>TRACK COURIER TRANSIT</span>
                  <span>➔</span>
                </button>

                <button
                  type="button"
                  className="el-rd-btn-command"
                  onClick={() => window.print()}
                >
                  <span>DOWNLOAD DOCKET (PDF)</span>
                  <Download size={13} />
                </button>

                <button
                  type="button"
                  className="el-rd-btn-command"
                  onClick={() => setLiaisonNotice(true)}
                >
                  <span>SALON CONCIERGE TICKET</span>
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ReturnDetails;
