import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  CreditCard,
  Smartphone,
  Zap,
  ArrowRight,
  Check,
  X,
  Copy,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getWalletData,
  topupWallet,
  createTopupRazorpayOrder,
  verifyTopupPayment,
} from "../../services/walletService";
import { getProfile } from "../../services/authService";
import { loadRazorpayScript } from "../../services/paymentService";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./AddMoney.css";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

function AddMoney() {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(12450);
  const [vaultId, setVaultId] = useState("Vault #VLT-89241-SWL");
  const [userName, setUserName] = useState("Swaliha Ezzath");
  const [userEmail, setUserEmail] = useState("swaliha@wallet");

  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [customAmount, setCustomAmount] = useState("2500");
  const [paymentInstrument, setPaymentInstrument] = useState("CARD");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [walletRes, profileRes] = await Promise.allSettled([
        getWalletData(),
        getProfile(),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value?.data?.success) {
        const v = walletRes.value.data.vault;
        setBalance(v.balance ?? 12450);
        if (v.vaultId) setVaultId(`Vault #${v.vaultId}`);
        if (v.userName) setUserName(v.userName);
        if (v.userEmail) setUserEmail(v.userEmail);
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        const u = profileRes.value.data.user || profileRes.value.data;
        if (u.fullName) setUserName(u.fullName);
        if (u.email) setUserEmail(u.email);
      }
    } catch (err) {
      console.error("Failed to load initial wallet data:", err);
    }
  };

  const handleSelectPreset = (amt) => {
    setSelectedAmount(amt);
    setCustomAmount(String(amt));
    setErrorMessage("");
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmount(val);
    setSelectedAmount(Number(val) || 0);
    setErrorMessage("");
  };

  const handleOpenConfirm = () => {
    const amt = Number(customAmount);
    if (!amt || amt < 100) {
      setErrorMessage("Minimum allocation is ₹100.");
      return;
    }
    if (amt > 100000) {
      setErrorMessage("Maximum allocation is ₹1,00,000 per transaction.");
      return;
    }

    const randomRef = `ELQ-WLT-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceId(randomRef);
    setShowConfirmModal(true);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInstrumentName = () => {
    if (paymentInstrument === "CARD") return "Credit / Debit Card";
    if (paymentInstrument === "UPI") return "UPI Instant Rail";
    return "Razor Pay";
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    setErrorMessage("");
    const amt = Number(customAmount);
    const instrumentLabel = getInstrumentName();

    try {
      if (paymentInstrument === "RAZORPAY") {
        // Razorpay Gateway flow
        const scriptOk = await loadRazorpayScript();
        if (!scriptOk) {
          throw new Error("Unable to load secure Razorpay gateway script.");
        }

        const rzpRes = await createTopupRazorpayOrder(amt);
        if (!rzpRes?.data?.success) {
          throw new Error(rzpRes?.data?.message || "Payment initialization failed.");
        }

        const { keyId, razorpayOrderId, amountInPaise } = rzpRes.data;

        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: "INR",
          name: "ELARQUE Atelier",
          description: "Patron Wallet Vault Refill",
          order_id: razorpayOrderId,
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: { color: "#650D20" },
          handler: async function (response) {
            try {
              const verifyRes = await verifyTopupPayment({
                razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: amt,
                paymentInstrument: "Razorpay",
              });

              if (verifyRes?.data?.success) {
                setShowConfirmModal(false);
                navigate("/wallet/success", {
                  state: {
                    addedAmount: amt,
                    previousBalance: verifyRes.data.previousBalance,
                    newBalance: verifyRes.data.newBalance,
                    transactionId: verifyRes.data.transaction?.transactionId || referenceId,
                    paymentRail: "Razorpay Instant Clearing",
                    date: new Date().toISOString(),
                    vaultId,
                    userName,
                  },
                  replace: true,
                });
              } else {
                throw new Error("Verification failed.");
              }
            } catch (vErr) {
              setShowConfirmModal(false);
              navigate("/wallet/failed", {
                state: {
                  amount: amt,
                  referenceId,
                  paymentRail: "Razorpay Instant Clearing",
                  vaultId,
                  error: vErr.response?.data?.message || vErr.message,
                },
                replace: true,
              });
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              setShowConfirmModal(false);
              navigate("/wallet/failed", {
                state: {
                  amount: amt,
                  referenceId,
                  paymentRail: "Razorpay Instant Clearing",
                  vaultId,
                  error: "Payment window was dismissed.",
                },
                replace: true,
              });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (failResponse) {
          setProcessing(false);
          setShowConfirmModal(false);
          navigate("/wallet/failed", {
            state: {
              amount: amt,
              referenceId,
              paymentRail: "Razorpay Instant Clearing",
              vaultId,
              error: failResponse.error?.description || "Transaction declined.",
            },
            replace: true,
          });
        });
        rzp.open();
        return;
      }

      // Direct Card / UPI Simulation Flow
      const res = await topupWallet({
        amount: amt,
        paymentInstrument: instrumentLabel,
        referenceId,
      });

      if (res?.data?.success) {
        setShowConfirmModal(false);
        navigate("/wallet/success", {
          state: {
            addedAmount: amt,
            previousBalance: res.data.previousBalance,
            newBalance: res.data.newBalance,
            transactionId: res.data.transaction?.transactionId || referenceId,
            paymentRail: instrumentLabel === "UPI Instant Rail" ? "UPI Instant Rail (swaliha@okaxis)" : `${instrumentLabel} (Ending in 4587)`,
            date: new Date().toISOString(),
            vaultId,
            userName,
          },
          replace: true,
        });
      } else {
        throw new Error(res?.data?.message || "Failed to process top-up.");
      }
    } catch (err) {
      console.error("Topup submission error:", err);
      setShowConfirmModal(false);
      navigate("/wallet/failed", {
        state: {
          amount: amt,
          referenceId,
          paymentRail: instrumentLabel,
          vaultId,
          error: err.response?.data?.message || err.message,
        },
        replace: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="el-wlt-add-page">
      <Navbar />

      <main className="el-wlt-add-container">
        {/* Header */}
        <div className="el-wlt-add-head">
          <h1 className="el-wlt-add-title">Add Money to Your Wallet</h1>
          <p className="el-wlt-add-sub">
            Instantly top up your ELARQUE Wallet for faster and seamless checkout across bespoke capsules and private salon allocations.
          </p>
        </div>

        {errorMessage && (
          <div style={{ background: "#FFF5F5", border: "1px solid #FFD0D0", color: "#C62828", padding: "12px 18px", borderRadius: "10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Available Discretionary Balance Card */}
        <div className="el-wlt-add-card">
          <div className="el-wlt-add-balance-grid">
            <div className="el-wlt-add-bal-left">
              <span className="el-wlt-add-bal-label">
                <span>AVAILABLE DISCRETIONARY BALANCE</span>
                <span className="el-wlt-vault-code">{vaultId}</span>
              </span>
              <div className="el-wlt-add-amount-row">
                <span className="el-wlt-add-amount-val">
                  ₹{Number(balance).toLocaleString("en-IN")}
                </span>
                <span className="el-wlt-add-currency">INR</span>
              </div>
              <p className="el-wlt-add-guarantee">
                <Lock size={12} color="#C5A059" />
                <span>Secure wallet powered by 256-bit encrypted payments • Instant Vault Refill</span>
              </p>
            </div>

            <div className="el-wlt-add-vip-box">
              <div className="el-wlt-add-vip-tier">VIP PATRON TIER</div>
              <h3 className="el-wlt-add-vip-name">{userName}</h3>
            </div>
          </div>
        </div>

        {/* 2. Select Top-Up Allocation Card */}
        <div className="el-wlt-add-card">
          <div className="el-wlt-card-header-row">
            <h3 className="el-wlt-section-title">
              <span>Select Top-Up Allocation</span>
              <div style={{ width: 6, height: 6, background: "#C5A059", borderRadius: "50%" }} />
            </h3>
            <span className="el-wlt-currency-badge">ARCHIVAL CURRENCY • INR</span>
          </div>

          {/* Preset Chips */}
          <div className="el-wlt-chips-row">
            {PRESET_AMOUNTS.map((amt) => (
              <div
                key={amt}
                className={`el-wlt-chip ${selectedAmount === amt ? "selected" : ""}`}
                onClick={() => handleSelectPreset(amt)}
              >
                ₹{amt.toLocaleString("en-IN")}
              </div>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="el-wlt-custom-input-box">
            <label className="el-wlt-custom-label">ENTER CUSTOM AMOUNT</label>
            <div className="el-wlt-input-container">
              <span className="el-wlt-input-symbol">₹</span>
              <input
                type="text"
                className="el-wlt-custom-input"
                placeholder="2500"
                value={customAmount}
                onChange={handleCustomChange}
              />
              <span className="el-wlt-input-currency-tag">INR</span>
            </div>
          </div>

          <div className="el-wlt-limits-row">
            <span>Minimum allocation ₹100 • Maximum allocation ₹1,00,000 per transaction.</span>
            <span style={{ color: "#2E7D32", fontWeight: 600 }}>Zero transaction surcharge</span>
          </div>
        </div>

        {/* 3. Select Payment Instrument Card */}
        <div className="el-wlt-add-card">
          <div className="el-wlt-card-header-row">
            <h3 className="el-wlt-section-title">Select Payment Instrument</h3>
            <span className="el-wlt-currency-badge">• ENCRYPTED RAIL</span>
          </div>

          <div className="el-wlt-instruments-grid">
            {/* Credit / Debit Card */}
            <div
              className={`el-wlt-instrument-card ${paymentInstrument === "CARD" ? "selected" : ""}`}
              onClick={() => setPaymentInstrument("CARD")}
            >
              <div className="el-wlt-inst-top">
                <CreditCard size={20} className="el-wlt-inst-icon" />
                <div className="el-wlt-inst-radio">
                  {paymentInstrument === "CARD" && <div className="el-wlt-inst-radio-dot" />}
                </div>
              </div>
              <div>
                <h4 className="el-wlt-inst-title">CREDIT / DEBIT CARD</h4>
                <p className="el-wlt-inst-sub">Ending in •••• 4587 <span style={{ color: "#B78103", fontWeight: 700, marginLeft: 4 }}>DEFAULT</span></p>
              </div>
            </div>

            {/* UPI Instant Rail */}
            <div
              className={`el-wlt-instrument-card ${paymentInstrument === "UPI" ? "selected" : ""}`}
              onClick={() => setPaymentInstrument("UPI")}
            >
              <div className="el-wlt-inst-top">
                <Smartphone size={20} className="el-wlt-inst-icon" />
                <div className="el-wlt-inst-radio">
                  {paymentInstrument === "UPI" && <div className="el-wlt-inst-radio-dot" />}
                </div>
              </div>
              <div>
                <h4 className="el-wlt-inst-title">UPI INSTANT RAIL</h4>
                <p className="el-wlt-inst-sub">swaliha@okaxis</p>
              </div>
            </div>

            {/* Razorpay */}
            <div
              className={`el-wlt-instrument-card ${paymentInstrument === "RAZORPAY" ? "selected" : ""}`}
              onClick={() => setPaymentInstrument("RAZORPAY")}
            >
              <div className="el-wlt-inst-top">
                <Zap size={20} className="el-wlt-inst-icon" />
                <div className="el-wlt-inst-radio">
                  {paymentInstrument === "RAZORPAY" && <div className="el-wlt-inst-radio-dot" />}
                </div>
              </div>
              <div>
                <h4 className="el-wlt-inst-title">RAZORPAY</h4>
                <p className="el-wlt-inst-sub">Seamless Instant Clearing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          className="el-wlt-btn-submit-add"
          onClick={handleOpenConfirm}
          disabled={!Number(customAmount) || Number(customAmount) < 100}
        >
          <span>ADD ₹{Number(customAmount || 0).toLocaleString("en-IN")} SECURELY</span>
          <ArrowRight size={16} />
        </button>

        <p className="el-wlt-footer-notice">
          Your wallet balance will be updated instantly after successful payment • Full TLS 256-bit patronage protection by ELARQUE Private Ledger.
        </p>
      </main>

      {/* ════════ CONFIRM TRANSACTION MODAL (Screenshot 5) ════════ */}
      {showConfirmModal && (
        <div className="el-wlt-modal-backdrop" onClick={() => !processing && setShowConfirmModal(false)}>
          <div className="el-wlt-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="el-wlt-modal-close"
              onClick={() => !processing && setShowConfirmModal(false)}
            >
              <X size={18} />
            </button>

            {/* Badge Icon */}
            <div className="el-wlt-modal-icon-badge">
              <CreditCard size={26} />
              <div className="el-wlt-modal-icon-check">
                <Check size={11} strokeWidth={3} />
              </div>
            </div>

            <div className="el-wlt-modal-badge">• SECURE WALLET PAYMENT</div>
            <h2 className="el-wlt-modal-title">Confirm Transaction</h2>
            <p className="el-wlt-modal-desc">
              Please review your payment details before securely adding money to your <strong>ELARQUE Wallet</strong>.
            </p>

            {/* Amount Box */}
            <div className="el-wlt-modal-amt-box">
              <div className="el-wlt-modal-amt-sub">TOTAL AMOUNT</div>
              <div className="el-wlt-modal-amt-val">
                ₹{Number(customAmount).toLocaleString("en-IN")}
                <span>INR</span>
              </div>
              <p className="el-wlt-modal-zero-fee">
                <CheckCircle2 size={13} />
                <span>Zero Surcharge • Instant Vault Credit</span>
              </p>
            </div>

            {/* Details Table */}
            <div className="el-wlt-modal-details">
              <div className="el-wlt-modal-row">
                <span className="el-wlt-modal-label">Reference ID</span>
                <span className="el-wlt-modal-val">
                  <span>{referenceId}</span>
                  <button type="button" className="el-wlt-copy-btn" onClick={handleCopyRef} title="Copy Reference ID">
                    <Copy size={12} />
                  </button>
                  {copied && <span style={{ fontSize: "10px", color: "#2E7D32" }}>Copied!</span>}
                </span>
              </div>

              <div className="el-wlt-modal-row">
                <span className="el-wlt-modal-label">Wallet Account</span>
                <span className="el-wlt-modal-val">{userEmail}</span>
              </div>

              <div className="el-wlt-modal-row">
                <span className="el-wlt-modal-label">Payment Method</span>
                <span className="el-wlt-modal-val">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E7D32" }} />
                  <span>{getInstrumentName()}</span>
                </span>
              </div>

              <div className="el-wlt-modal-row">
                <span className="el-wlt-modal-label">Status</span>
                <span className="el-wlt-status-pill-ready">Ready to Process</span>
              </div>
            </div>

            {/* Buttons */}
            <button
              type="button"
              className="el-wlt-btn-modal-confirm"
              onClick={handleConfirmPayment}
              disabled={processing}
            >
              <span>{processing ? "PROCESSING REFILL..." : "CONFIRM PAYMENT"}</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className="el-wlt-btn-modal-cancel"
              onClick={() => setShowConfirmModal(false)}
              disabled={processing}
            >
              CANCEL TRANSACTION
            </button>

            <p className="el-wlt-modal-protocol-footer">
              Atelier Settlement Protocol • Instant Encrypted Handshake
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default AddMoney;
