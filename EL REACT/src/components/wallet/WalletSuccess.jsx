import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Check,
  ArrowRight,
  Copy,
  Download,
  CreditCard,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./WalletSuccess.css";

function WalletSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const addedAmount = state.addedAmount || 2500;
  const previousBalance = state.previousBalance || 12450;
  const newBalance = state.newBalance || previousBalance + addedAmount;
  const transactionId = state.transactionId || "TXN-ELQ-874521";
  const paymentRail = state.paymentRail || "UPI Instant Rail (swaliha@okaxis)";

  const [copied, setCopied] = useState(false);

  const handleCopyLedgerKey = () => {
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="el-wlt-succ-page">
      <Navbar />

      <main className="el-wlt-succ-container">
        {/* Head */}
        <div className="el-wlt-succ-head">
          <div className="el-wlt-succ-eyebrow">• WALLET TRANSACTION COMPLETED</div>
          <h1 className="el-wlt-succ-title">Money Added Successfully</h1>
          <p className="el-wlt-succ-sub">
            Your ELARQUE Patron Wallet has been settled instantaneously and is fully provisioned for bespoke commissions, private salon viewings, or archive releases.
          </p>
        </div>

        {/* Main Card */}
        <div className="el-wlt-succ-card">
          <div className="el-wlt-succ-icon-circle">
            <Check size={32} strokeWidth={2.5} />
          </div>

          <div className="el-wlt-succ-sealed-badge">
            • LEDGER SETTLEMENT COMPLETED • TLS 256 VAULT SEALED
          </div>

          <div className="el-wlt-succ-main-amt">
            ₹{Number(addedAmount).toLocaleString("en-IN")}
            <span>INR</span>
          </div>
          <p className="el-wlt-succ-allocated-note">
            Successfully allocated to your personal vault balance
          </p>

          {/* Liquidity Recap */}
          <div className="el-wlt-succ-recap-box">
            <div className="el-wlt-succ-recap-head-sub">LIQUIDITY RECAP</div>
            <h3 className="el-wlt-succ-recap-title">Updated Balance</h3>

            <div className="el-wlt-succ-recap-grid">
              <div className="el-wlt-succ-recap-item">
                <div className="el-wlt-succ-recap-item-left">
                  <span>PREVIOUS BALANCE</span>
                  <strong>₹{Number(previousBalance).toLocaleString("en-IN")}</strong>
                </div>
                <CreditCard size={18} color="#8C7B70" />
              </div>

              <div className="el-wlt-succ-recap-item">
                <div className="el-wlt-succ-recap-item-left">
                  <span>ADDED INCREMENT</span>
                  <strong className="increment">+₹{Number(addedAmount).toLocaleString("en-IN")}</strong>
                </div>
                <PlusCircle size={18} color="#C5A059" />
              </div>
            </div>

            {/* Total Highlight */}
            <div className="el-wlt-succ-recap-total">
              <div className="el-wlt-succ-total-left">
                <span>NEW AVAILABLE VAULT BALANCE</span>
                <strong>
                  ₹{Number(newBalance).toLocaleString("en-IN")}
                  <span>net clear</span>
                </strong>
              </div>
              <div className="el-wlt-succ-sparkline">
                <span className="el-wlt-succ-spark-tag">INT-LIQUID RESERVE</span>
                <span className="el-wlt-succ-spark-sub">100% Unrestricted</span>
              </div>
            </div>

            <p className="el-wlt-succ-recap-subtext">
              Available immediately for bespoke orders, private salon appointments, custom atelier trunk reservations, and priority ready-to-wear checkouts.
            </p>
          </div>

          {/* Atelier Transaction Ledger */}
          <div className="el-wlt-succ-ledger-card">
            <div className="el-wlt-succ-ledger-head">
              <span>ATELIER TRANSACTION LEDGER</span>
              <button
                type="button"
                className="el-wlt-succ-btn-copy-ledger"
                onClick={handleCopyLedgerKey}
              >
                <Copy size={11} />
                <span>{copied ? "COPIED" : "COPY LEDGER KEY"}</span>
              </button>
            </div>

            <div className="el-wlt-succ-ledger-grid">
              <div className="el-wlt-succ-ledger-field">
                <span>Transaction ID</span>
                <strong>{transactionId}</strong>
              </div>

              <div className="el-wlt-succ-ledger-field">
                <span>Transaction Status</span>
                <div>
                  <span className="el-wlt-succ-pill">• SUCCESSFUL</span>
                </div>
              </div>

              <div className="el-wlt-succ-ledger-field">
                <span>Calendar Date</span>
                <strong>{currentDate}</strong>
              </div>

              <div className="el-wlt-succ-ledger-field">
                <span>Settlement Timestamp</span>
                <strong>{currentTime} CEST</strong>
              </div>

              <div className="el-wlt-succ-ledger-field" style={{ gridColumn: "span 2" }}>
                <span>Payment Rail & Handle</span>
                <strong>{paymentRail}</strong>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="el-wlt-succ-actions">
            <Link to="/collections" className="el-wlt-succ-btn-continue">
              <span>CONTINUE SHOPPING</span>
              <ArrowRight size={15} />
            </Link>

            <Link to="/wallet" className="el-wlt-succ-btn-back">
              BACK TO WALLET VAULT
            </Link>
          </div>

          <a
            href="#tax-invoice"
            onClick={(e) => {
              e.preventDefault();
              alert("Formal patron tax invoice PDF generation dispatched to your account email.");
            }}
            className="el-wlt-succ-invoice-link"
          >
            <Download size={13} />
            <span>DOWNLOAD FORMAL PATRON TAX INVOICE (.PDF)</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default WalletSuccess;
