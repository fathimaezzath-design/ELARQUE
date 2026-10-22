import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet,
  Lock,
  PlusCircle,
  Building,
  Gift,
  ArrowRight,
  Shield,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Heart,
  Ticket,
  MapPin,
  LogOut,
  User,
  MoreVertical,
  CheckCircle2,
  Download,
  AlertCircle,
  Shirt,
} from "lucide-react";
import { getWalletData } from "../../services/walletService";
import { getProfile } from "../../services/authService";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./WalletVault.css";

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function WalletVault() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWalletAndProfile();
  }, []);

  const fetchWalletAndProfile = async () => {
    try {
      setLoading(true);
      const [walletRes, profileRes] = await Promise.allSettled([
        getWalletData(),
        getProfile(),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value?.data?.success) {
        setWalletData(walletRes.value.data.vault);
      }
      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        setUserProfile(profileRes.value.data.user || profileRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load wallet vault:", err);
      setError("Unable to sync wallet ledger. Showing locally cached data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const balance = walletData?.balance ?? 12450;
  const pendingRefundAmount = walletData?.pendingRefundAmount ?? 4999;
  const activeTracker = walletData?.activeRefundTracker;
  const paymentMethods = walletData?.paymentMethods || [];
  const transactions = walletData?.transactions || [];

  const userName =
    userProfile?.fullName || walletData?.userName || "Swaliha ezzath";

  return (
    <div className="el-wlt-page">
      <Navbar />

      <div className="el-wlt-container">
        <div className="el-wlt-layout">
          {/* ════════ LEFT SIDEBAR ════════ */}
          <aside className="el-wlt-sidebar">
            <div className="el-wlt-profile-box">
              <div className="el-wlt-avatar-wrap">
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt={userName}
                    className="el-wlt-avatar"
                  />
                ) : (
                  <div className="el-wlt-avatar-fallback">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="el-wlt-avatar-badge">
                  <Shield size={12} />
                </div>
              </div>
              <h3 className="el-wlt-user-name">{userName}</h3>
              <p className="el-wlt-user-sub">Client since Winter 2026</p>
            </div>

            <nav className="el-wlt-nav">
              <Link to="/profile" className="el-wlt-nav-item">
                <div className="el-wlt-nav-left">
                  <User size={15} className="el-wlt-nav-icon" />
                  <span>PROFILE OVERVIEW</span>
                </div>
              </Link>

              <Link to="/orders" className="el-wlt-nav-item">
                <div className="el-wlt-nav-left">
                  <ShoppingBag size={15} className="el-wlt-nav-icon" />
                  <span>MY ORDERS</span>
                </div>
                <span className="el-wlt-badge">3 ACTIVE</span>
              </Link>

              <Link to="/wishlist" className="el-wlt-nav-item">
                <div className="el-wlt-nav-left">
                  <Heart size={15} className="el-wlt-nav-icon" />
                  <span>WISHLIST</span>
                </div>
                <span className="el-wlt-badge">08</span>
              </Link>

              <Link to="/wallet" className="el-wlt-nav-item active">
                <div className="el-wlt-nav-left">
                  <Wallet size={15} className="el-wlt-nav-icon" />
                  <span>WALLET VAULT</span>
                </div>
                <Lock size={12} color="#C5A059" />
              </Link>

              <Link to="/coupons" className="el-wlt-nav-item">
                <div className="el-wlt-nav-left">
                  <Ticket size={15} className="el-wlt-nav-icon" />
                  <span>COUPONS</span>
                </div>
              </Link>

              <Link to="/addresses" className="el-wlt-nav-item">
                <div className="el-wlt-nav-left">
                  <MapPin size={15} className="el-wlt-nav-icon" />
                  <span>SAVED ADDRESSES</span>
                </div>
              </Link>

              <button
                type="button"
                className="el-wlt-nav-item logout"
                onClick={handleLogout}
              >
                <div className="el-wlt-nav-left">
                  <LogOut size={15} />
                  <span>SIGN OUT</span>
                </div>
              </button>
            </nav>
          </aside>

          {/* ════════ MAIN CONTENT ════════ */}
          <main className="el-wlt-main">
            {/* Header Titles */}
            <div className="el-wlt-header">
              <div className="el-wlt-eyebrow">
                <span>• PRIVATE PORTFOLIO</span>
              </div>
              <h1 className="el-wlt-title">Wallet Vault</h1>
              <p className="el-wlt-subtitle">
                Manage your discretionary atelier balance, ongoing salon returns, and certified couture transactions in one orchestrated sanctum.
              </p>
            </div>

            {error && (
              <div style={{ background: "#FFF5F5", border: "1px solid #FFD0D0", color: "#C62828", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Top Balance Card */}
            <div className="el-wlt-balance-card">
              <div className="el-wlt-watermark">EL</div>
              <div className="el-wlt-balance-top">
                <Shield size={14} />
                <span>AVAILABLE WALLET BALANCE</span>
              </div>

              <div className="el-wlt-amount-row">
                <div className="el-wlt-amount">₹{Number(balance).toLocaleString("en-IN")}</div>
                <span className="el-wlt-currency">INR LIQUID</span>
                {pendingRefundAmount > 0 && (
                  <span className="el-wlt-pending-badge">
                    PENDING REFUND AMOUNT: ₹{Number(pendingRefundAmount).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <p className="el-wlt-balance-note">
                Auto-clearing into balance upon inspection approval
              </p>
            </div>

            {/* 2. 3 Action Buttons */}
            <div className="el-wlt-actions-row">
              <Link to="/wallet/add" className="el-wlt-act-btn primary">
                <div className="el-wlt-act-icon-box">
                  <PlusCircle size={20} />
                </div>
                <div className="el-wlt-act-text">
                  <span className="el-wlt-act-label">ADD MONEY</span>
                  <span className="el-wlt-act-sub">INSTANT CREDIT</span>
                </div>
              </Link>

              <div
                className="el-wlt-act-btn secondary"
                onClick={() => alert("Direct bank withdrawal protocol will be activated upon client request.")}
              >
                <div className="el-wlt-act-icon-box">
                  <Building size={20} />
                </div>
                <div className="el-wlt-act-text">
                  <span className="el-wlt-act-label">WITHDRAW</span>
                  <span className="el-wlt-act-sub">TO DIRECT BANK</span>
                </div>
              </div>

              <div
                className="el-wlt-act-btn secondary"
                onClick={() => navigate("/coupons")}
              >
                <div className="el-wlt-act-icon-box">
                  <Gift size={20} />
                </div>
                <div className="el-wlt-act-text">
                  <span className="el-wlt-act-label">REDEEM REWARDS</span>
                  <span className="el-wlt-act-sub">840 PTS AVAIL</span>
                </div>
              </div>
            </div>

            {/* 3. Middle Grid: Active Refund Tracker + Payment Methods */}
            <div className="el-wlt-middle-grid">
              {/* Left: Active Refund Tracker */}
              <div className="el-wlt-card">
                <div className="el-wlt-card-head">
                  <h3 className="el-wlt-card-title">
                    <span className="el-wlt-dot-indicator" />
                    <span>Active Refund Tracker</span>
                  </h3>
                  <span className="el-wlt-order-tag">
                    #{activeTracker?.orderNumber || "ELQ-2026-45821"}
                  </span>
                </div>
                <p className="el-wlt-card-sub">
                  {activeTracker?.title || "Blazer Dress Atelier Size Adjustment Cancellation"}
                </p>

                {/* 4 Steps */}
                <div className="el-wlt-stepper">
                  {activeTracker?.steps?.map((st, i) => (
                    <div
                      key={st.number || i}
                      className={`el-wlt-step ${st.status === "COMPLETE" ? "complete" : st.status === "IN PROGRESS" ? "in-progress" : ""}`}
                    >
                      {i < activeTracker.steps.length - 1 && (
                        <div className="el-wlt-step-line" />
                      )}
                      <div className="el-wlt-step-node">
                        {st.status === "COMPLETE" ? (
                          <CheckCircle2 size={14} />
                        ) : st.status === "IN PROGRESS" ? (
                          <div className="el-wlt-step-dot" />
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D6C7B2" }} />
                        )}
                      </div>
                      <div className="el-wlt-step-content">
                        <div className="el-wlt-step-header">
                          <span>{st.number}. {st.label}</span>
                          <span className={`el-wlt-step-status-tag ${st.status === "COMPLETE" ? "complete" : st.status === "IN PROGRESS" ? "progress" : ""}`}>
                            {st.status}
                          </span>
                        </div>
                        <p className="el-wlt-step-date">{st.date}</p>
                        {st.desc && <p className="el-wlt-step-desc">{st.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar */}
                <div className="el-wlt-tracker-footer">
                  <div className="el-wlt-tracker-expected">
                    <span>EXPECTED IN WALLET</span>
                    <strong>₹{Number(activeTracker?.expectedAmount || 4999).toFixed(2)}</strong>
                  </div>
                  <button
                    type="button"
                    className="el-wlt-btn-dossier"
                    onClick={() => {
                      if (activeTracker?.orderId) {
                        navigate(`/orders/${activeTracker.orderId}`);
                      } else {
                        navigate("/orders");
                      }
                    }}
                  >
                    VIEW DOSSIER
                  </button>
                </div>
              </div>

              {/* Right: Payment Methods */}
              <div className="el-wlt-card">
                <div className="el-wlt-card-head">
                  <h3 className="el-wlt-card-title">
                    <CreditCard size={16} />
                    <span>Payment Methods</span>
                  </h3>
                  <span style={{ fontSize: "11px", color: "#8C7B70", fontWeight: 600 }}>
                    2 ENROLLED
                  </span>
                </div>
                <div style={{ height: "14px" }} />

                <div className="el-wlt-methods-list">
                  {/* Visa */}
                  <div className="el-wlt-method-item">
                    <div className="el-wlt-method-left">
                      <div className="el-wlt-method-brand visa">VISA</div>
                      <div className="el-wlt-method-details">
                        <h4>
                          Visa •••• 4587
                          <span className="el-wlt-method-badge default">DEFAULT</span>
                        </h4>
                        <p>Expires 08/29 • Issued by Private Client Bank</p>
                      </div>
                    </div>
                    <MoreVertical size={16} color="#8C7B70" style={{ cursor: "pointer" }} />
                  </div>

                  {/* RazorPay */}
                  <div className="el-wlt-method-item">
                    <div className="el-wlt-method-left">
                      <div className="el-wlt-method-brand razorpay">UPI</div>
                      <div className="el-wlt-method-details">
                        <h4>
                          RazorPay
                          <span className="el-wlt-method-badge verified">VERIFIED</span>
                        </h4>
                        <p>swaliha@okaxis</p>
                      </div>
                    </div>
                    <MoreVertical size={16} color="#8C7B70" style={{ cursor: "pointer" }} />
                  </div>
                </div>

                <button
                  type="button"
                  className="el-wlt-btn-add-method"
                  onClick={() => navigate("/wallet/add")}
                >
                  <span>+ ADD PAYMENT METHOD</span>
                </button>
              </div>
            </div>

            {/* 4. Certified Wallet Transactions */}
            <section className="el-wlt-tx-section">
              <div className="el-wlt-tx-head">
                <div className="el-wlt-tx-title-box">
                  <h2>
                    <span>• Wallet Transactions</span>
                  </h2>
                  <p>Certified record of all deposits, order debits, and salon refund settlements.</p>
                </div>
                <button
                  type="button"
                  className="el-wlt-btn-export"
                  onClick={() => alert("Ledger statement export initiated in background.")}
                >
                  <Download size={13} />
                  <span>EXPORT STATEMENT (PDF / EXCEL)</span>
                </button>
              </div>

              <div className="el-wlt-tx-list">
                {transactions.map((tx, idx) => {
                  const isCredit = tx.type === "CREDIT";
                  const formattedDate = tx.date
                    ? new Date(tx.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  return (
                    <div key={tx._id || tx.transactionId || idx} className="el-wlt-tx-card">
                      <div className="el-wlt-tx-left">
                        <div className={`el-wlt-tx-icon-wrap ${isCredit ? "credit" : "debit"}`}>
                          {isCredit ? (
                            <RotateCcw size={18} />
                          ) : tx.title?.includes("Scarf") ? (
                            <ShoppingBag size={18} />
                          ) : (
                            <Shirt size={18} />
                          )}
                        </div>

                        <div className="el-wlt-tx-info">
                          <div className="el-wlt-tx-meta">
                            <span className="el-wlt-tx-ref">
                              #{tx.transactionId || `TXN-ORD-${idx}`}
                            </span>
                            <span className={`el-wlt-tx-pill ${tx.status?.toLowerCase() || "debited"}`}>
                              {tx.status === "PROCESSING" ? "PROCESSING" : tx.type === "DEBIT" ? "DEBITED" : "CREDITED"}
                            </span>
                          </div>
                          <h4 className="el-wlt-tx-title">{tx.title}</h4>
                          <p className="el-wlt-tx-desc">{tx.description}</p>
                          <p className="el-wlt-tx-date">{formattedDate}</p>
                        </div>
                      </div>

                      <div className="el-wlt-tx-right">
                        <span className={`el-wlt-tx-amount ${isCredit ? "credit" : "debit"}`}>
                          {isCredit ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="el-wlt-tx-sub-label">
                          {isCredit && tx.status === "PROCESSING"
                            ? "CREDITING TO VAULT"
                            : isCredit
                            ? "CREDITED TO VAULT"
                            : tx.description?.includes("Dispatched")
                            ? "SETTLED IN FULL"
                            : "VAULT DIRECT DEBIT"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="el-wlt-ledger-footer">
                Displaying {transactions.length} Archival Ledger Entries
              </div>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default WalletVault;
