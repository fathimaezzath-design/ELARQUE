import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Radio,
  Clock,
  ShieldCheck,
  Truck,
  Building,
  UserCheck,
  Cpu,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  getReturnRequestById,
  updateReturnStatus,
} from "../../services/adminReturnService";
import formatPrice from "../../utils/formatPrice";
import "./UpdateReturnStatus.css";

// Helper for date formatting
function formatFilingDate(dateString) {
  if (!dateString) return "Recent Date";
  const date = new Date(dateString);
  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} ${time} CET`;
}

const UpdateReturnStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [returnItem, setReturnItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Fetch Return Request Dossier
  useEffect(() => {
    const fetchDossier = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getReturnRequestById(id);
        if (res?.success && res.returnRequest) {
          const req = res.returnRequest;
          setReturnItem(req);

          // Initialize form fields
          setSelectedStatus(req.returnStatus);
          setAdminNote(req.returnAdminNote || "");
          setRejectionReason(req.returnRejectionReason || "");
        } else {
          setError("Return request record could not be found.");
        }
      } catch (err) {
        console.error("Error loading return dossier:", err);
        setError(
          err?.response?.data?.message ||
            "Unable to retrieve return request dossier."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDossier();
    }
  }, [id]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedStatus === "Rejected" && !rejectionReason.trim()) {
      setFormError("A mandatory rejection explanation is required when setting status to Rejected.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const res = await updateReturnStatus(id, {
        status: selectedStatus,
        adminNote: adminNote.trim(),
        rejectionReason: rejectionReason.trim(),
        customerMessage: rejectionReason.trim(),
        notifyCustomer,
      });

      if (res?.success) {
        setSuccessToast(`Return disposition successfully updated to "${selectedStatus}".`);
        setTimeout(() => {
          navigate("/admin/returns");
        }, 1500);
      }
    } catch (err) {
      console.error("Error updating return disposition:", err);
      setFormError(
        err?.response?.data?.message ||
          "An error occurred while updating the return disposition."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImg = (path) => {
    if (!path) return "https://placehold.co/120x150/1b0e14/dfc28d?text=ELARQUE";
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path.startsWith("/") ? path : `/${path}`}`;
  };

  if (loading) {
    return (
      <div className="admin-status-update-page">
        <div className="admin-status-loading">
          <div className="el-spinner-burgundy" />
          <p>Decrypting Atelier Return Disposition Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !returnItem) {
    return (
      <div className="admin-status-update-page">
        <div className="admin-status-error-card">
          <AlertTriangle size={32} color="#EF4444" />
          <h2>Dossier Retrieval Error</h2>
          <p>{error || "Return record could not be located."}</p>
          <button
            type="button"
            className="el-btn-return-back"
            onClick={() => navigate("/admin/returns")}
          >
            ← Return to Return Requests
          </button>
        </div>
      </div>
    );
  }

  // Derive Reason headline & detail
  let reasonHeadline = "Atelier Fit & Aesthetic Evaluation";
  let reasonDetail = returnItem.returnReason || "";
  if (returnItem.returnReason?.includes("—")) {
    const parts = returnItem.returnReason.split("—");
    reasonHeadline = parts[0].trim();
    reasonDetail = parts[1].replace(/["']/g, "").trim();
  }

  const patronCity =
    returnItem.customer?.shippingAddress?.city ||
    returnItem.customer?.shippingAddress?.state ||
    "Dallas, TX";

  return (
    <div className="admin-status-update-page">
      {/* Toast Alert */}
      {successToast && (
        <div className="admin-toast-banner" role="alert">
          <CheckCircle2 size={16} color="#34D399" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="admin-status-update-container">
        {/* Navigation Breadcrumb */}
        <div className="admin-status-breadcrumb-row">
          <Link to="/admin/returns" className="admin-back-link">
            <ArrowLeft size={14} />
            <span>Return Requests</span>
          </Link>
          <span className="admin-crumb-separator">/</span>
          <span className="admin-crumb-active">#{returnItem.orderNumber}</span>
        </div>

        {/* Page Title */}
        <h1 className="admin-status-page-heading">Update Return Status</h1>

        {/* =========================================================================
            1. TOP RETURN INFORMATION PANEL (MATCHING SCREENSHOT 2)
            ========================================================================= */}
        <section className="admin-dossier-hero-card">
          <div className="admin-dossier-media-col">
            <img
              src={getProductImg(returnItem.productImage)}
              alt={returnItem.productName}
              className="admin-dossier-thumb"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/120x150/1b0e14/dfc28d?text=ELARQUE";
              }}
            />
            <span className="admin-dossier-size-tag">
              {returnItem.variant?.size || "M"}
            </span>
          </div>

          <div className="admin-dossier-content-col">
            <div className="admin-dossier-header-row">
              <span className="admin-dossier-number">
                DOSSIER #{returnItem.orderNumber}
              </span>
              <span className="admin-dossier-vip-badge">VIP CONCIERGE</span>
            </div>

            <h2 className="admin-dossier-title">{returnItem.productName}</h2>

            <p className="admin-dossier-patron-line">
              Patron: <strong>{returnItem.customer?.fullName || "Emma Wilson"}</strong> •{" "}
              {patronCity} Salon Vault
            </p>
          </div>

          {/* 4 Metadata Columns on Right */}
          <div className="admin-dossier-specs-grid">
            {/* Col 1: Return Reason */}
            <div className="admin-dossier-spec-col">
              <span className="admin-spec-label">RETURN REASON</span>
              <span className="admin-spec-val-primary">{reasonHeadline}</span>
              <span className="admin-spec-val-sub">{reasonDetail}</span>
            </div>

            {/* Col 2: Filing Date */}
            <div className="admin-dossier-spec-col">
              <span className="admin-spec-label">FILING DATE</span>
              <span className="admin-spec-val-primary">
                {new Date(returnItem.returnRequestedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="admin-spec-val-sub">
                {new Date(returnItem.returnRequestedAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                CET
              </span>
            </div>

            {/* Col 3: Dispute Amount */}
            <div className="admin-dossier-spec-col">
              <span className="admin-spec-label">DISPUTE AMOUNT</span>
              <span className="admin-spec-val-price">
                {formatPrice(returnItem.returnAmount)}
              </span>
              <span className="admin-spec-val-sub">DIRECT LEDGER</span>
            </div>

            {/* Col 4: Seal Status */}
            <div className="admin-dossier-spec-col">
              <span className="admin-spec-label">SEAL STATUS</span>
              <div className="admin-spec-seal-row">
                <ShieldCheck size={14} color="#DFC28D" />
                <span className="admin-spec-val-primary">Declared Intact</span>
              </div>
              <span className="admin-spec-val-sub">Photo Verified</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. CONFIGURE RETURN DISPOSITION FORM CARD
            ========================================================================= */}
        <section className="admin-disposition-card">
          <div className="admin-disposition-card-header">
            <div>
              <h2 className="admin-disposition-title">Configure Return Disposition</h2>
              <p className="admin-disposition-desc">
                Designate the reverse logistics checkpoint. Updating this state orchestrates
                logistics webhooks, generates regional courier dispatch manifests, and
                recalibrates inventory reserve thresholds.
              </p>
            </div>
            <span className="admin-disposition-step-badge">STEP 02 / ROUTING</span>
          </div>

          <form onSubmit={handleSubmit} className="admin-disposition-form">
            {/* Status Assignment Select */}
            <div className="admin-form-group">
              <div className="admin-form-label-row">
                <label htmlFor="returnStatusSelect" className="admin-form-label">
                  NEW STATUS ASSIGNMENT <span className="req">*</span>
                </label>
                <span className="admin-label-right-tag">
                  AUTOMATED NOTIFICATION ENABLED
                </span>
              </div>

              <select
                id="returnStatusSelect"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setFormError(null);
                }}
                className="admin-form-select"
                required
              >
                <option value="Pending">● Pending — Awaiting Concierge Review</option>
                <option value="Approved">● Return Approved — Reverse Logistics Authorized</option>
                <option value="Picked Up">● Pickup Scheduled / In Transit — Courier Dispatched</option>
                <option value="Refunded">● Return Completed & Refunded — Vault Reimbursed</option>
                <option value="Rejected">● Return Rejected — Policy Violation / Ineligible</option>
              </select>
            </div>

            {/* Mandatory Rejection Reason if Rejected is Chosen */}
            {selectedStatus === "Rejected" && (
              <div className="admin-form-group rejection-box">
                <div className="admin-form-label-row">
                  <label htmlFor="rejectionInput" className="admin-form-label required-red">
                    MANDATORY REJECTION JUSTIFICATION *
                  </label>
                  <span className="admin-label-right-tag red">
                    TRANSMITTED DIRECTLY TO CLIENT
                  </span>
                </div>
                <textarea
                  id="rejectionInput"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="State the exact contractual rationale for denying this return request (e.g., security tag compromised, post 14-day limit)..."
                  className="admin-form-textarea"
                  required
                />
              </div>
            )}

            {/* Internal Atelier Directive & Carrier Note */}
            <div className="admin-form-group">
              <div className="admin-form-label-row">
                <label htmlFor="adminNoteInput" className="admin-form-label">
                  INTERNAL ATELIER DIRECTIVE & CARRIER NOTE
                </label>
                <span className="admin-label-right-tag">CONFIDENTIAL MONOGRAPH</span>
              </div>

              <textarea
                id="adminNoteInput"
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Patron concierge confirmed DHL Express pickup scheduled for residence. Garment must retain intact atelier security seal for instant vault reversal..."
                className="admin-form-textarea"
              />

              <div className="admin-directive-footnote">
                <Lock size={12} color="#DFC28D" />
                <span>
                  This internal note is encrypted and restricted to Atelier Salon staff; it will
                  never be visible to the patron.
                </span>
              </div>
            </div>

            {/* System Ledger Telemetry Row with Switch Toggle */}
            <div className="admin-telemetry-strip">
              <div className="admin-telemetry-left">
                <Radio size={16} className="admin-telemetry-icon" />
                <div className="admin-telemetry-meta">
                  <span className="admin-telemetry-title">SYSTEM LEDGER TELEMETRY</span>
                  <span className="admin-telemetry-node">
                    Node: #ELQ-RET-9921 • Central Reverse Hub
                  </span>
                </div>
              </div>

              <label className="admin-toggle-wrap">
                <span className="admin-toggle-label">
                  Transmit instant dispatch digest via Concierge SMS & Email
                </span>
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="admin-toggle-input"
                />
                <span className="admin-toggle-slider" />
              </label>
            </div>

            {/* Form Error Message */}
            {formError && (
              <div className="admin-disposition-error-note">
                <AlertTriangle size={14} color="#EF4444" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="admin-disposition-actions-row">
              <button
                type="button"
                className="el-btn-cancel-retain"
                onClick={() => navigate("/admin/returns")}
                disabled={submitting}
              >
                CANCEL & RETAIN STATE
              </button>

              <button
                type="submit"
                className="el-btn-update-disposition"
                disabled={submitting}
              >
                <RefreshCw
                  size={14}
                  className={submitting ? "admin-spin-icon" : ""}
                />
                <span>
                  {submitting ? "SAVING DISPOSITION..." : "UPDATE RETURN STATUS"}
                </span>
              </button>
            </div>
          </form>
        </section>

        {/* =========================================================================
            3. BOTTOM METADATA CARDS (MATCHING SCREENSHOT 2)
            ========================================================================= */}
        <section className="admin-footer-meta-grid" aria-label="Logistics & Security Metadata">
          {/* Card 1: Warehouse Routing */}
          <div className="admin-footer-meta-card">
            <span className="admin-footer-card-label">WAREHOUSE ROUTING</span>
            <h3 className="admin-footer-card-title">Bordeaux Logistics Center</h3>
            <p className="admin-footer-card-sub">Estimated delivery post-pickup: 48 hrs</p>
          </div>

          {/* Card 2: Inspecting Specialist */}
          <div className="admin-footer-meta-card">
            <span className="admin-footer-card-label">INSPECTING SPECIALIST</span>
            <h3 className="admin-footer-card-title">Henri C. de Marc</h3>
            <p className="admin-footer-card-sub">Senior Master Tailor • Couture Division</p>
          </div>

          {/* Card 3: Security Protocol */}
          <div className="admin-footer-meta-card">
            <span className="admin-footer-card-label">SECURITY PROTOCOL</span>
            <h3 className="admin-footer-card-title">NFC Anti-Counterfeit Seal</h3>
            <p className="admin-footer-card-sub">Tag ID: 04:A2:88:F1:C9:20</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UpdateReturnStatus;
