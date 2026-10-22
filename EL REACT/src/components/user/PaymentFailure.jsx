import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShoppingBag,
  HelpCircle,
  CreditCard,
  ShieldAlert,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./PaymentFailure.css";

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function PaymentFailure() {
  const location = useLocation();
  const navigate = useNavigate();

  // Failure metadata passed via state
  const stateData = location.state || {};
  const reason =
    stateData.reason ||
    stateData.error ||
    "The payment verification was cancelled or declined by your financial provider.";
  const gateway = stateData.gateway || "Online Gateway";
  const amount = stateData.amount || null;
  const orderId = stateData.orderId || null;

  const handleRetry = () => {
    // Navigate back to checkout with intent to retry
    navigate("/checkout", {
      state: { retryPayment: true, preferredGateway: gateway },
      replace: true,
    });
  };

  return (
    <div className="el-pf-root">
      <Navbar />

      <main className="el-pf-main">
        <section className="el-pf-card">
          {/* ── LUXURY INTERRUPTED SVG ILLUSTRATION ── */}
          <div className="el-pf-illustration-box">
            <svg
              className="el-pf-svg-crest"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="#E8B4B8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="#FFF5F5"
                stroke="#C62828"
                strokeWidth="2"
              />
              <path
                d="M60 38V66"
                stroke="#C62828"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="60" cy="78" r="2.5" fill="#C62828" />
            </svg>
            <div className="el-pf-status-badge">
              <ShieldAlert size={12} />
              <span>TRANSACTION DECLINED</span>
            </div>
          </div>

          {/* ── OFFICIAL STATEMENT ── */}
          <div className="el-pf-header">
            <span className="el-pf-eyebrow">
              PAYMENT AUTHORIZATION INTERRUPTED
            </span>
            <h1 className="el-pf-title">Transaction Could Not Be Processed</h1>
            <p className="el-pf-statement">
              We were unable to complete your authorization with{" "}
              <strong>{gateway}</strong>. Please rest assured that no funds
              have been deducted from your account. If any temporary hold was
              initiated by your bank, it will reverse automatically within 24–48
              hours.
            </p>
          </div>

          {/* Diagnostic Reason Box */}
          <div className="el-pf-reason-box" role="alert">
            <div className="el-pf-reason-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="el-pf-reason-content">
              <strong>Decline Reason Provided:</strong>
              <p>{reason}</p>
            </div>
            {amount && (
              <div className="el-pf-amount-pill">
                <span>Attempted Amount:</span>
                <strong>₹{formatINR(amount)}</strong>
              </div>
            )}
          </div>

          {/* ── RETRY AND REDIRECT BUTTONS ── */}
          <div className="el-pf-actions-wrapper">
            {/* 1. Primary Retry Button */}
            <button
              type="button"
              className="el-pf-btn-retry"
              onClick={handleRetry}
            >
              <RotateCcw size={16} />
              <span>RETRY PAYMENT NOW</span>
            </button>

            {/* 2. Redirect Buttons Row */}
            <div className="el-pf-redirect-row">
              <Link to="/checkout" className="el-pf-btn-redirect secondary">
                <ArrowLeft size={14} />
                <span>RETURN TO CHECKOUT</span>
              </Link>

              <Link to="/cart" className="el-pf-btn-redirect outline">
                <ShoppingBag size={14} />
                <span>REVIEW SHOPPING BAG</span>
              </Link>

              <Link to="/collections" className="el-pf-btn-redirect outline">
                <span>EXPLORE ATELIER</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── HELPFUL ADVICE & CLIENT CARE ── */}
          <div className="el-pf-troubleshoot-grid">
            <div className="el-pf-tip-card">
              <CreditCard size={18} className="el-pf-tip-icon" />
              <h3>Common Causes</h3>
              <ul>
                <li>Insufficient account balance or transaction limit exceeded.</li>
                <li>Incorrect OTP, CVV, or authentication timeout.</li>
                <li>Temporary connectivity issue with card-issuing bank.</li>
              </ul>
            </div>

            <div className="el-pf-tip-card">
              <HelpCircle size={18} className="el-pf-tip-icon" />
              <h3>Recommended Next Steps</h3>
              <ul>
                <li>Retry with an alternative payment method (e.g. UPI, Netbanking, or PayPal).</li>
                <li>Select Cash on Delivery (COD) for zero upfront risk.</li>
                <li>Verify your card's online e-commerce transaction switch.</li>
              </ul>
            </div>
          </div>

          {/* Atelier Concierge Contact */}
          <div className="el-pf-concierge-strip">
            <div className="el-pf-concierge-text">
              <strong>Need Personalized Concierge Assistance?</strong>
              <p>
                Our private client advisors are on hand to finalize your commission by phone or generate a dedicated secure payment link.
              </p>
            </div>
            <div className="el-pf-concierge-contacts">
              <a href="tel:+919847051234" className="el-pf-contact-pill">
                <Phone size={13} />
                <span>+91 98470 51234</span>
              </a>
              <a
                href="mailto:concierge@elarque.com"
                className="el-pf-contact-pill"
              >
                <Mail size={13} />
                <span>concierge@elarque.com</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PaymentFailure;
