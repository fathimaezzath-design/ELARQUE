import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { X, ArrowRight, Copy, Shield } from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./WalletFailed.css";

function WalletFailed() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const amount = state.amount || 5000;
  const referenceId = state.referenceId || "TXN-ELQ-874521";
  const paymentRail = state.paymentRail || "UPI Instant Rail (swaliha@okaxis)";
  const vaultId = state.vaultId || "Vault #VLT-89241-SWL";

  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceId);
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
    <div className="el-wlt-fail-page">
      <Navbar />

      <main className="el-wlt-fail-container">
        {/* Head */}
        <div className="el-wlt-fail-head">
          <div className="el-wlt-fail-breadcrumb">
            <span>PATRON VAULT / RECONCILIATION LEDGER / PROTOCOL FAILURE</span>
            <span>•</span>
            <span className="el-wlt-fail-session-tag">TLS 256-BIT ATELIER SESSION ACTIVE</span>
          </div>
          <h1 className="el-wlt-fail-title">Money Transfer Failed</h1>
          <p className="el-wlt-fail-sub">
            We couldn't complete your wallet transaction. Don't worry—no amount has been deducted from your account if the payment wasn't processed successfully.
          </p>
        </div>

        {/* Center Card */}
        <div className="el-wlt-fail-card">
          <div className="el-wlt-fail-icon-circle">
            <X size={34} strokeWidth={2.5} />
          </div>

          <div className="el-wlt-fail-disrupt-badge">SETTLEMENT DISRUPTION</div>

          <div className="el-wlt-fail-main-amt">
            ₹{Number(amount).toLocaleString("en-IN")}
          </div>

          <p className="el-wlt-fail-msg">
            Unable to add this amount to your patron wallet vault.
          </p>

          <div className="el-wlt-fail-beneficiary">
            <Shield size={12} color="#C5A059" />
            <span>BENEFICIARY IDENTIFIER: PATRON {vaultId.toUpperCase()}</span>
          </div>

          {/* Atelier Transaction Ledger */}
          <div className="el-wlt-fail-ledger-card">
            <div className="el-wlt-fail-ledger-head">
              <span>ATELIER TRANSACTION LEDGER</span>
              <span className="el-wlt-fail-ledger-status">LEDGER STATUS: UNSETTLED</span>
            </div>

            <div className="el-wlt-fail-ledger-grid">
              <div className="el-wlt-fail-field">
                <span>TRANSACTION REFERENCE</span>
                <strong>
                  <span>{referenceId}</span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8C7B70", padding: 0 }}
                  >
                    <Copy size={11} />
                  </button>
                  {copied && <span style={{ fontSize: "9px", color: "#2E7D32" }}>Copied</span>}
                </strong>
              </div>

              <div className="el-wlt-fail-field">
                <span>TIMESTAMP</span>
                <strong>{currentDate} • {currentTime} CEST</strong>
              </div>

              <div className="el-wlt-fail-field">
                <span>PAYMENT RAIL</span>
                <strong>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C5A059" }} />
                  <span>{paymentRail}</span>
                </strong>
              </div>

              <div className="el-wlt-fail-field">
                <span>PROTOCOL DISPOSITION</span>
                <div>
                  <span className="el-wlt-fail-pill">• FAILED / REVERSED</span>
                </div>
              </div>

              <div className="el-wlt-fail-field full-span">
                <span>GATEWAY AUDIT TAG</span>
                <strong style={{ fontFamily: "monospace", fontSize: "11px", color: "#8C7B70" }}>
                  ELQ-VLT-RETRY-{referenceId.replace(/\D/g, "") || "874521"}-IND-409
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="el-wlt-fail-actions">
            <Link to="/wallet/add" className="el-wlt-fail-btn-retry">
              <span>RETRY TRANSFER</span>
              <ArrowRight size={15} />
            </Link>

            <Link to="/wallet" className="el-wlt-fail-btn-vault">
              RETURN TO WALLET VAULT
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default WalletFailed;
