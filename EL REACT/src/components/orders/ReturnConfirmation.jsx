import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  ShieldCheck,
  Package,
  MapPin,
  ChevronRight,
  Sparkles,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { getUserReturnDetails, getOrderDetails } from "../../services/orderService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";
import "./ReturnConfirmation.css";

const FALLBACK_ITEM_IMG =
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80";

function ReturnConfirmation() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("itemId");
  const refParam = searchParams.get("ref");

  const [returnDetails, setReturnDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReturnData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First try to fetch actual return details from the backend
      const res = await getUserReturnDetails(orderId, itemId);
      if (res?.data?.returnDetails) {
        setReturnDetails(res.data.returnDetails);
      } else {
        // Fallback to order details if return was just submitted
        const orderRes = await getOrderDetails(orderId);
        if (orderRes?.data?.order) {
          const ord = orderRes.data.order;
          const targetItem = itemId
            ? ord.items.find((i) => String(i._id) === String(itemId)) || ord.items[0]
            : ord.items[0];

          setReturnDetails({
            returnReferenceId:
              refParam ||
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
            preferredRefundMethod: targetItem?.preferredRefundMethod || ord.preferredRefundMethod || "Original Payment",
            pickupAddress: targetItem?.pickupAddress || ord.pickupAddress || ord.shippingAddress,
            refundAmount: targetItem ? targetItem.itemTotal : ord.totalAmount,
            returnRequestedAt: targetItem?.returnRequestedAt || ord.returnRequestedAt || new Date(),
            paymentMethod: ord.paymentMethod,
          });
        }
      }
    } catch (err) {
      console.warn("Falling back to order retrieval:", err);
      try {
        const orderRes = await getOrderDetails(orderId);
        if (orderRes?.data?.order) {
          const ord = orderRes.data.order;
          const targetItem = itemId
            ? ord.items.find((i) => String(i._id) === String(itemId)) || ord.items[0]
            : ord.items[0];

          setReturnDetails({
            returnReferenceId:
              refParam ||
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
            preferredRefundMethod: targetItem?.preferredRefundMethod || ord.preferredRefundMethod || "Original Payment",
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
          innerErr.response?.data?.message ||
            "Unable to load verified return dossier. Please verify through My Orders."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, itemId, refParam, navigate]);

  useEffect(() => {
    fetchReturnData();
  }, [fetchReturnData]);

  if (loading) {
    return (
      <div className="el-conf-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-conf-loading-state">
          <div className="el-conf-spinner" />
          <p>Verifying atelier dispatch protocol...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !returnDetails) {
    return (
      <div className="el-conf-page-root">
        <AnnouncementBar />
        <Navbar />
        <div className="el-conf-error-card">
          <AlertCircle size={36} color="#650D20" />
          <h2>Dossier Retrieval Error</h2>
          <p>{error || "No active return request details found."}</p>
          <div className="el-conf-btn-group">
            <button
              type="button"
              className="el-conf-btn-primary"
              onClick={() => navigate("/orders")}
            >
              MY COMMISSIONS
            </button>
            <button
              type="button"
              className="el-conf-btn-outline"
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
    pickupAddress,
    refundAmount,
    returnRequestedAt,
    preferredRefundMethod,
  } = returnDetails;

  const itemImg = item?.productImage || FALLBACK_ITEM_IMG;
  const resolvedImg = itemImg.startsWith("http") ? itemImg : `http://localhost:5000${itemImg}`;

  const formatTimestamp = (dateString) => {
    if (!dateString) return "20 July 2026, 02:45 PM";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "20 July 2026, 02:45 PM";
    return (
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const isApproved =
    returnStatus &&
    ["Approved", "Picked Up", "Completed", "Refunded"].includes(returnStatus);

  return (
    <div className="el-conf-page-root">
      <AnnouncementBar />
      <Navbar />

      <main className="el-conf-main-container">
        {/* Breadcrumb Navigation */}
        <nav className="el-conf-breadcrumbs">
          <span onClick={() => navigate("/orders")} className="el-conf-crumb-link">
            ORDERS
          </span>
          <span className="el-conf-crumb-sep">/</span>
          <span onClick={() => navigate(`/orders/${orderId}`)} className="el-conf-crumb-link">
            ORDER {orderNumber || `#${orderId}`}
          </span>
          <span className="el-conf-crumb-sep">/</span>
          <span className="el-conf-crumb-link">RETURN REQUEST #{returnReferenceId}</span>
          <span className="el-conf-crumb-sep">/</span>
          <span className="el-conf-crumb-active">CONFIRMATION</span>
        </nav>

        {/* Central Hero Header */}
        <div className="el-conf-hero-center">
          <div className="el-conf-check-circle">
            <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
          </div>

          <span className="el-conf-pretitle">
            <span className="el-conf-dot">•</span> RETURN PROTOCOL INITIATED • ATELIER DISPATCH
          </span>

          <h1 className="el-conf-title">Return Request Accepted</h1>

          <p className="el-conf-subtitle">
            Your commission return has been authorized. White-glove courier dispatch is arranged,
            with full provenance tracking across our European and domestic salons.
          </p>

          <div className="el-conf-dossier-pill">
            <span>RETURN DOSSIER: #{returnReferenceId}</span>
            <span className="el-conf-pill-divider">•</span>
            <span className="el-conf-pill-status">
              <Clock size={12} className="el-conf-clock-icon" />
              STATUS: {isApproved ? "CONCIERGE PICKUP AUTHORIZED" : `RETURN ${returnStatus.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Stepper Card: Atelier Protocol Sequence */}
        <section className="el-conf-stepper-card">
          <div className="el-conf-stepper-header">
            <div>
              <span className="el-conf-stepper-eyebrow">ATELIER PROTOCOL SEQUENCE</span>
              <h3 className="el-conf-stepper-headline">Consignment Journey</h3>
            </div>
            <div className="el-conf-live-badge">
              <span className="el-conf-pulse-dot" /> LIVE LEDGER UPDATE
            </div>
          </div>

          <div className="el-conf-stepper-timeline">
            {/* Step 1: Return Lodged */}
            <div className="el-conf-step completed">
              <div className="el-conf-step-circle">
                <Check size={14} />
              </div>
              <strong className="el-conf-step-name">1. RETURN LODGED</strong>
              <span className="el-conf-step-meta">{formatTimestamp(returnRequestedAt)}</span>
              <span className="el-conf-step-sub">VERIFIED PATRON</span>
            </div>

            <div className={`el-conf-step-line ${isApproved ? "active" : ""}`} />

            {/* Step 2: Request Accepted */}
            <div className={`el-conf-step ${isApproved ? "completed" : "current"}`}>
              <div className="el-conf-step-circle">
                {isApproved ? <Check size={14} /> : <FileText size={14} />}
              </div>
              <strong className="el-conf-step-name">2. REQUEST ACCEPTED</strong>
              <span className="el-conf-step-meta">
                {isApproved ? "Authorized" : "Under Atelier Review"}
              </span>
              <span className="el-conf-step-sub">
                {isApproved ? "ATELIER APPROVED" : "IN REVIEW"}
              </span>
            </div>

            <div className={`el-conf-step-line ${["Picked Up", "Completed", "Refunded"].includes(returnStatus) ? "active" : ""}`} />

            {/* Step 3: Courier Dispatch */}
            <div className={`el-conf-step ${["Picked Up", "Completed", "Refunded"].includes(returnStatus) ? "completed" : ""}`}>
              <div className="el-conf-step-circle">
                <Truck size={14} />
              </div>
              <strong className="el-conf-step-name">3. COURIER DISPATCH</strong>
              <span className="el-conf-step-meta">Est. 24–48h</span>
              <span className="el-conf-step-sub">WHITE-GLOVE TIER</span>
            </div>

            <div className={`el-conf-step-line ${["Completed", "Refunded"].includes(returnStatus) ? "active" : ""}`} />

            {/* Step 4: Atelier Vault Check */}
            <div className={`el-conf-step ${["Completed", "Refunded"].includes(returnStatus) ? "completed" : ""}`}>
              <div className="el-conf-step-circle">
                <Package size={14} />
              </div>
              <strong className="el-conf-step-name">4. ATELIER VAULT CHECK</strong>
              <span className="el-conf-step-meta">Paris Guild Protocol</span>
              <span className="el-conf-step-sub">CONDITION AUDIT</span>
            </div>

            <div className={`el-conf-step-line ${returnStatus === "Refunded" ? "active" : ""}`} />

            {/* Step 5: Settlement Issued */}
            <div className={`el-conf-step ${returnStatus === "Refunded" ? "completed" : ""}`}>
              <div className="el-conf-step-circle">
                <RotateCcw size={14} />
              </div>
              <strong className="el-conf-step-name">5. SETTLEMENT ISSUED</strong>
              <span className="el-conf-step-meta">{preferredRefundMethod}</span>
              <span className="el-conf-step-sub">
                {formatPrice(refundAmount)} {returnStatus === "Refunded" ? "CREDITED" : "SCHEDULED"}
              </span>
            </div>
          </div>
        </section>

        {/* Two Column Detailed Breakdown */}
        <div className="el-conf-breakdown-grid">
          {/* =====================================================
              LEFT COLUMN: SPECIFICATIONS & RETURNED PIECE
          ===================================================== */}
          <div className="el-conf-col">
            {/* Return Specifications Card */}
            <div className="el-conf-card">
              <div className="el-conf-card-header">
                <div className="el-conf-header-with-icon">
                  <FileText size={16} color="#650D20" />
                  <h3>Return Specifications</h3>
                </div>
              </div>

              <div className="el-conf-spec-list">
                <div className="el-conf-spec-row">
                  <span className="el-conf-spec-title">Return Authorization ID</span>
                  <strong className="el-conf-spec-value burgundy">{returnReferenceId}</strong>
                </div>

                <div className="el-conf-spec-row">
                  <span className="el-conf-spec-title">Master Order Number</span>
                  <strong className="el-conf-spec-value">#{orderNumber}</strong>
                </div>

                <div className="el-conf-spec-row">
                  <span className="el-conf-spec-title">Lodged Timestamp</span>
                  <span className="el-conf-spec-value">{formatTimestamp(returnRequestedAt)}</span>
                </div>

                <div className="el-conf-spec-row">
                  <span className="el-conf-spec-title">Declaration Reason</span>
                  <span className="el-conf-spec-value">{returnReason}</span>
                </div>

                <div className="el-conf-spec-row highlighted">
                  <span className="el-conf-spec-title">Expected Remittance</span>
                  <strong className="el-conf-spec-value price">
                    {formatPrice(refundAmount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Returned Piece Card */}
            <div className="el-conf-card">
              <div className="el-conf-card-header">
                <span className="el-conf-card-eyebrow">RETURNED PIECE</span>
                <span className="el-conf-archive-tag">ARCHIVE NO. 048</span>
              </div>

              <div className="el-conf-piece-body">
                <div className="el-conf-piece-thumb-wrap">
                  <img
                    src={resolvedImg}
                    alt={item?.productName || "Garment"}
                    className="el-conf-piece-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_ITEM_IMG;
                    }}
                  />
                  <span className="el-conf-piece-badge">
                    {returnStatus === "Requested" ? "IN TRANSIT" : returnStatus.toUpperCase()}
                  </span>
                </div>

                <div className="el-conf-piece-info">
                  <span className="el-conf-piece-collection">
                    FORMAL COLLECTION • ATELIER SERIES
                  </span>
                  <h4 className="el-conf-piece-name">
                    {item?.productName || "ELARQUE Signature Blazer Dress"}
                  </h4>

                  <p className="el-conf-piece-meta">
                    Size: <strong>{item?.variant?.size || item?.size || "M (FR 38)"}</strong>
                    &nbsp;&nbsp;Color:{" "}
                    <strong>{item?.variant?.color || item?.color || "Vintage Burgundy"}</strong>
                  </p>

                  <p className="el-conf-piece-cut">
                    Cut: <strong>Structured Double-Breasted</strong>
                  </p>

                  <div className="el-conf-piece-price-row">
                    <span className="el-conf-piece-price-val">
                      {formatPrice(item?.price || item?.itemTotal || refundAmount)}
                    </span>
                  </div>

                  <div className="el-conf-tag-advisory">
                    <AlertCircle size={13} color="#8A775C" className="el-conf-adv-icon" />
                    <span>
                      Ensure original cupra silk tags and brass safety clasp remain unsevered.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT COLUMN: PICKUP LOGISTICS & SETTLEMENT PROTOCOL
          ===================================================== */}
          <div className="el-conf-col">
            {/* White-Glove Pickup Logistics */}
            <div className="el-conf-card">
              <div className="el-conf-card-header">
                <div className="el-conf-header-with-icon">
                  <Truck size={16} color="#650D20" />
                  <h3>White-Glove Pickup Logistics</h3>
                </div>
              </div>

              <div className="el-conf-logistics-body">
                <div className="el-conf-origin-box">
                  <span className="el-conf-origin-label">CONSIGNMENT ORIGIN ADDRESS</span>
                  <strong className="el-conf-origin-name">
                    {pickupAddress?.fullName || "Swaliha Beaumont"}
                  </strong>
                  <p className="el-conf-origin-addr">
                    {[
                      pickupAddress?.house,
                      pickupAddress?.street,
                      pickupAddress?.city,
                      pickupAddress?.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}{" "}
                    — {pickupAddress?.pincode || "673001"}
                  </p>
                  <p className="el-conf-origin-phone">
                    Primary Handset: {pickupAddress?.phone || "+91 98765 43210"}
                  </p>
                </div>

                <div className="el-conf-logistics-specs-grid">
                  <div className="el-conf-log-spec-item">
                    <span className="el-conf-log-label">APPOINTMENT WINDOW</span>
                    <strong className="el-conf-log-val">Tomorrow, 10:00 AM – 02:00 PM Window</strong>
                  </div>
                  <div className="el-conf-log-spec-item">
                    <span className="el-conf-log-label">DEDICATED FLEET TIER</span>
                    <strong className="el-conf-log-val">
                      BlueDart Premier Haute Logistics (BDX-RTN-90214-ELQ)
                    </strong>
                  </div>
                </div>

                <div className="el-conf-prep-checklist">
                  <span className="el-conf-prep-title">PICKUP PREPARATION</span>
                  <ul className="el-conf-prep-list">
                    <li>
                      <div className="el-conf-check-icon">
                        <Check size={11} />
                      </div>
                      <span>Keep the garment placed in its original dust garment valise.</span>
                    </li>
                    <li>
                      <div className="el-conf-check-icon">
                        <Check size={11} />
                      </div>
                      <span>
                        Your courier agent performs on-site seal scanning and provides receipt.
                      </span>
                    </li>
                    <li>
                      <div className="el-conf-check-icon">
                        <Check size={11} />
                      </div>
                      <span>
                        Digital manifest receipt instantly transmitted to your registered patron phone.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Settlement & Quality Protocol Card */}
            <div className="el-conf-card">
              <div className="el-conf-card-header">
                <div className="el-conf-header-with-icon">
                  <ShieldCheck size={16} color="#650D20" />
                  <h3>Settlement & Quality Protocol</h3>
                </div>
              </div>

              <div className="el-conf-protocol-steps">
                {/* 1 */}
                <div className="el-conf-protocol-item">
                  <div className="el-conf-proto-num">1</div>
                  <div className="el-conf-proto-content">
                    <strong>24-Hour Vault Inspection</strong>
                    <p>
                      Upon courier delivery to our regional hub, certified master tailors inspect
                      stitching, button hardware, and fabric freshness within 24 hours.
                    </p>
                  </div>
                </div>

                {/* 2 */}
                <div className="el-conf-protocol-item">
                  <div className="el-conf-proto-num">2</div>
                  <div className="el-conf-proto-content">
                    <strong>Automatic Full Refund Release</strong>
                    <p>
                      The entire {formatPrice(refundAmount)} commission will be reversed directly
                      back to your {preferredRefundMethod} account within 5 to 7 banking days.
                    </p>
                  </div>
                </div>

                {/* 3 */}
                <div className="el-conf-protocol-item">
                  <div className="el-conf-proto-num">3</div>
                  <div className="el-conf-proto-content">
                    <strong>Real-Time Atelier Notifications</strong>
                    <p>
                      You will receive milestone updates via private patron SMS and formal dispatch
                      letters to your registered contact email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="el-conf-cta-row">
          <button
            type="button"
            className="el-conf-btn-burgundy"
            onClick={() =>
              navigate(`/orders/${orderId}/return-details${itemId ? `?itemId=${itemId}` : ""}`)
            }
          >
            TRACK COURIER TRANSIT STATUS ➔
          </button>
          <button
            type="button"
            className="el-conf-btn-cream-outline"
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

export default ReturnConfirmation;
