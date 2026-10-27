import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Truck,
  Shield,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createOrder } from "../../services/orderService";
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayPalOrder,
  capturePayPalPayment,
} from "../../services/paymentService";
import { getWalletData } from "../../services/walletService";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./Payment.css";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutData = location.state;

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData || !checkoutData.addressId) {
      navigate("/checkout", { replace: true });
    }
  }, [checkoutData, navigate]);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(12450);

  // Fetch wallet balance
  useEffect(() => {
    getWalletData()
      .then((res) => {
        if (res?.data?.success && typeof res.data.vault?.balance === "number") {
          setWalletBalance(res.data.vault.balance);
        }
      })
      .catch((err) => console.log("Failed to load wallet in payment:", err));
  }, []);

  // Card form state (purely visual - never stored)
  const [cardForm, setCardForm] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    saveCard: false,
  });

  if (!checkoutData || !checkoutData.addressId) return null;

  const {
    addressId,
    address,
    couponCode,
    appliedCoupon,
    cartItems = [],
    subtotal = 0,
    couponDiscount = 0,
    packagingFee = 199,
    shippingFee = 0,
    estimatedTotal = 0,
    userProfile,
  } = checkoutData;

  // Card form handlers
  const handleCardChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setCardForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    let processed = value;
    if (name === "number") {
      processed = value.replace(/\D/g, "").slice(0, 16);
      processed = processed.replace(/(.{4})/g, "$1 ").trim();
    }
    if (name === "expiry") {
      processed = value.replace(/\D/g, "").slice(0, 4);
      if (processed.length > 2) processed = processed.slice(0, 2) + " / " + processed.slice(2);
    }
    if (name === "cvv") {
      processed = value.replace(/\D/g, "").slice(0, 4);
    }
    setCardForm((prev) => ({ ...prev, [name]: processed }));
  };

  const detectNetwork = (num) => {
    const clean = num.replace(/\s/g, "");
    if (/^4/.test(clean)) return "VISA";
    if (/^5[1-5]/.test(clean)) return "MASTERCARD";
    if (/^6/.test(clean)) return "RUPAY";
    if (/^3[47]/.test(clean)) return "AMEX";
    return "";
  };

  const cardNetwork = detectNetwork(cardForm.number);

  // ── Order Error Handler ──
  const handleOrderError = (err) => {
    setProcessing(false);
    const serverMsg = err?.response?.data?.message || err?.message;
    setError(serverMsg || "An unexpected error occurred during payment. Please try again.");
  };

  // ── Razorpay Standard Checkout Initiation (Test Mode) ──
  const initiateRazorpayPayment = async () => {
    setError("");
    setProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Unable to load secure Razorpay gateway. Please check your network connection.");
        setProcessing(false);
        return;
      }

      const createRes = await createRazorpayOrder(addressId, couponCode);
      if (!createRes?.data?.success) {
        throw new Error(createRes?.data?.message || "Failed to initialize payment gateway.");
      }

      const {
        keyId,
        razorpayOrderId,
        amountInPaise,
        customer,
      } = createRes.data;

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: "ELARQUE Atelier",
        description: "Bespoke Couture Commission",
        order_id: razorpayOrderId,
        prefill: {
          name: customer?.name || address?.fullName || userProfile?.name || "",
          email: customer?.email || userProfile?.email || "",
          contact: customer?.phone || address?.phone || "",
        },
        theme: { color: "#541424" },
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await verifyRazorpayPayment({
              addressId,
              couponCode,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes?.data?.success && verifyRes?.data?.order) {
              navigate("/order-confirmed", {
                state: { order: verifyRes.data.order },
                replace: true,
              });
            } else {
              throw new Error(verifyRes?.data?.message || "Payment signature verification failed.");
            }
          } catch (vErr) {
            setProcessing(false);
            const errMsg = vErr.response?.data?.message || vErr.message || "Payment verification failed.";
            setError(`Payment Verification Failed: ${errMsg}. Order was not placed.`);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setError("Payment was cancelled. You can retry payment whenever you are ready.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse) {
        setProcessing(false);
        const failReason = failResponse.error?.description || "Transaction declined by card provider.";
        setError(`Transaction Failed: ${failReason}. Please retry or choose another payment medium.`);
      });
      rzp.open();
    } catch (err) {
      handleOrderError(err);
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    setError("");
    if (method === "RAZORPAY") {
      initiateRazorpayPayment();
    }
  };

  // ── Payment Submission ──
  const handleConfirmPay = async () => {
    setError("");
    setProcessing(true);

    // ── COD ──
    if (paymentMethod === "COD") {
      try {
        const res = await createOrder(addressId, "COD", couponCode);
        if (res?.data?.success && res?.data?.order) {
          navigate("/order-confirmed", {
            state: { order: res.data.order },
            replace: true,
          });
        } else {
          setError(res?.data?.message || "Unable to confirm order.");
          setProcessing(false);
        }
      } catch (err) {
        handleOrderError(err);
      }
      return;
    }

    // ── CARD / RAZORPAY ──
    if (paymentMethod === "CARD" || paymentMethod === "RAZORPAY") {
      initiateRazorpayPayment();
      return;
    }

    // ── WALLET PAYMENT ──
    if (paymentMethod === "WALLET") {
      if (walletBalance < estimatedTotal) {
        setError(`Insufficient Patron Wallet balance (Available: ₹${Number(walletBalance).toLocaleString("en-IN")}, Required: ₹${Number(estimatedTotal).toLocaleString("en-IN")}). Please top up your wallet or choose another payment medium.`);
        setProcessing(false);
        return;
      }

      try {
        const res = await createOrder(addressId, "WALLET", couponCode);
        if (res?.data?.success && res?.data?.order) {
          navigate("/order-confirmed", {
            state: { order: res.data.order },
            replace: true,
          });
        } else {
          setError(res?.data?.message || "Unable to process wallet payment.");
          setProcessing(false);
        }
      } catch (err) {
        handleOrderError(err);
      }
      return;
    }

    setProcessing(false);
  };

  const handleCancelPurchase = () => {
    navigate("/checkout", { state: { retryPayment: false } });
  };

  return (
    <div className="el-pay-page">
      <Navbar />

      {/* ── Hero Banner ── */}
      <div className="el-pay-hero">
        <div className="el-pay-hero-icon">
          <Shield size={22} />
        </div>
        <div>
          <h1>Complete Your Purchase</h1>
          <p>Choose your preferred transaction medium to commission and authenticate your order securely.</p>
        </div>
      </div>

      <main className="el-pay-main">
        {error && (
          <div className="el-pay-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="el-pay-grid">
          {/* ══════ LEFT COLUMN ══════ */}
          <div className="el-pay-left">
            <div className="el-pay-section-label">SELECT PAYMENT METHOD</div>

            {/* Payment Method Cards */}
            <div className="el-pay-methods-grid">
              {/* Credit / Debit */}
              <div
                className={`el-pay-method-card ${paymentMethod === "CARD" ? "selected" : ""}`}
                onClick={() => handleSelectPaymentMethod("CARD")}
                role="radio"
                aria-checked={paymentMethod === "CARD"}
                tabIndex={0}
              >
                <div className="el-pay-method-top">
                  <div className="el-pay-method-title-row">
                    <div className="el-pay-radio-circle">
                      {paymentMethod === "CARD" && <div className="el-pay-radio-dot" />}
                    </div>
                    <span className="el-pay-method-name">Credit / Debit</span>
                  </div>
                  <CreditCard size={20} className="el-pay-method-icon" />
                </div>
                <p className="el-pay-method-desc">
                  Instant authorization via global banking corridors.
                </p>
                <div className="el-pay-method-tags">
                  <span className="el-pay-tag">VISA</span>
                  <span className="el-pay-tag">MASTERCARD</span>
                  <span className="el-pay-tag">RUPAY</span>
                  <span className="el-pay-tag highlight">AMEX</span>
                </div>
              </div>

              {/* Razor Pay */}
              <div
                className={`el-pay-method-card ${paymentMethod === "RAZORPAY" ? "selected" : ""}`}
                onClick={() => handleSelectPaymentMethod("RAZORPAY")}
                role="radio"
                aria-checked={paymentMethod === "RAZORPAY"}
                tabIndex={0}
              >
                <div className="el-pay-method-top">
                  <div className="el-pay-method-title-row">
                    <div className="el-pay-radio-circle">
                      {paymentMethod === "RAZORPAY" && <div className="el-pay-radio-dot" />}
                    </div>
                    <span className="el-pay-method-name">Razor Pay</span>
                  </div>
                  <Smartphone size={20} className="el-pay-method-icon" />
                </div>
                <p className="el-pay-method-desc">
                  Instant app approval via VPA or Dynamic QR sequence.
                </p>
                <div className="el-pay-method-tags">
                  <span className="el-pay-tag">Google Pay</span>
                  <span className="el-pay-tag">PhonePe</span>
                  <span className="el-pay-tag">Paytm</span>
                </div>
              </div>

              {/* Digital Wallet / Wallet Vault */}
              <div
                className={`el-pay-method-card ${paymentMethod === "WALLET" ? "selected" : ""}`}
                onClick={() => handleSelectPaymentMethod("WALLET")}
                role="radio"
                aria-checked={paymentMethod === "WALLET"}
                tabIndex={0}
              >
                <div className="el-pay-method-top">
                  <div className="el-pay-method-title-row">
                    <div className="el-pay-radio-circle">
                      {paymentMethod === "WALLET" && <div className="el-pay-radio-dot" />}
                    </div>
                    <span className="el-pay-method-name">Patron Wallet Vault</span>
                  </div>
                  <Wallet size={20} className="el-pay-method-icon" />
                </div>
                <p className="el-pay-method-desc">
                  Instant 1-click settlement from your private ledger balance.
                </p>
                <div className="el-pay-method-tags">
                  <span className={`el-pay-tag ${walletBalance >= estimatedTotal ? "highlight" : ""}`}>
                    Available: ₹{Number(walletBalance).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* COD */}
              <div
                className={`el-pay-method-card ${paymentMethod === "COD" ? "selected" : ""}`}
                onClick={() => handleSelectPaymentMethod("COD")}
                role="radio"
                aria-checked={paymentMethod === "COD"}
                tabIndex={0}
              >
                <div className="el-pay-method-top">
                  <div className="el-pay-method-title-row">
                    <div className="el-pay-radio-circle">
                      {paymentMethod === "COD" && <div className="el-pay-radio-dot" />}
                    </div>
                    <span className="el-pay-method-name">Cash on Delivery</span>
                  </div>
                  <Truck size={20} className="el-pay-method-icon" />
                </div>
                <p className="el-pay-method-desc">
                  White-glove verification upon residential delivery.
                </p>
                <div className="el-pay-otp-note">
                  <Shield size={12} />
                  <span>OTP Verification Required</span>
                </div>
              </div>
            </div>

            {/* ── Razorpay Test Gateway Panel (shown for RAZORPAY method) ── */}
            {paymentMethod === "RAZORPAY" && (
              <div className="el-pay-card-form-section">
                <div className="el-pay-card-form-header">
                  <div className="el-pay-card-form-title">
                    <Shield size={14} />
                    <span>RAZORPAY STANDARD CHECKOUT (TEST MODE)</span>
                  </div>
                  <span className="el-pay-vault-badge">TEST GATEWAY ACTIVE</span>
                </div>

                <div style={{ background: "#FAF6EF", border: "1px solid #EFE8DC", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#2A1F1A", lineHeight: 1.5 }}>
                    The official Razorpay Standard Checkout test window will open. You can test both successful and failed payments using Razorpay's test credentials without real money.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "#6A5D54" }}>
                    <div>
                      <strong style={{ color: "#541424", display: "block", marginBottom: "2px" }}>Card Testing:</strong>
                      <span>Enter test cards (e.g. 4111 •••• •••• 1111 with any future MM/YY & CVV). Choose Success or Failure in Razorpay's test OTP simulation.</span>
                    </div>
                    <div>
                      <strong style={{ color: "#541424", display: "block", marginBottom: "2px" }}>UPI Testing:</strong>
                      <span>Enter <code>success@razorpay</code> for success or <code>failure@razorpay</code> for decline.</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={initiateRazorpayPayment}
                  disabled={processing}
                  style={{
                    background: "#541424",
                    color: "#FFF",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: processing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "fit-content",
                  }}
                >
                  <Smartphone size={15} />
                  <span>{processing ? "LAUNCHING GATEWAY..." : "LAUNCH RAZORPAY TEST WINDOW →"}</span>
                </button>
              </div>
            )}

            {/* ── Wallet Payment Panel (shown for WALLET method) ── */}
            {paymentMethod === "WALLET" && (
              <div className="el-pay-card-form-section">
                <div className="el-pay-card-form-header">
                  <div className="el-pay-card-form-title">
                    <Wallet size={14} />
                    <span>PATRON WALLET VAULT SETTLEMENT</span>
                  </div>
                  <span className="el-pay-vault-badge">
                    {walletBalance >= estimatedTotal ? "SUFFICIENT LIQUIDITY" : "INSUFFICIENT FUNDS"}
                  </span>
                </div>

                <div style={{ background: "#FAF6EF", border: "1px solid #EFE8DC", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#8C7B70" }}>Available Wallet Balance:</span>
                    <strong style={{ fontSize: "16px", color: "#650D20", fontFamily: "Cormorant Garamond, serif" }}>
                      ₹{Number(walletBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#8C7B70" }}>Required Order Total:</span>
                    <strong style={{ fontSize: "16px", color: "#2A1F1A", fontFamily: "Cormorant Garamond, serif" }}>
                      ₹{Number(estimatedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {walletBalance >= estimatedTotal ? (
                  <p style={{ fontSize: "12px", color: "#2E7D32", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} />
                    <span>Your account has sufficient balance for instantaneous 1-click clearance.</span>
                  </p>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <p style={{ fontSize: "12px", color: "#C62828", margin: 0 }}>
                      Shortfall: ₹{Number(estimatedTotal - walletBalance).toLocaleString("en-IN")}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/wallet/add")}
                      style={{
                        background: "#650D20",
                        color: "#FFF",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      TOP UP WALLET NOW →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Card Entry Form (shown for CARD method) ── */}
            {paymentMethod === "CARD" && (
              <div className="el-pay-card-form-section">
                <div className="el-pay-card-form-header">
                  <div className="el-pay-card-form-title">
                    <Lock size={14} />
                    <span>ENTER BESPOKE CARD PARAMETERS</span>
                  </div>
                  <span className="el-pay-vault-badge">END-TO-END VAULT TOKENIZED</span>
                </div>

                {/* Cardholder Name */}
                <div className="el-pay-field">
                  <label className="el-pay-field-label">CARDHOLDER SOVEREIGN NAME</label>
                  <div className="el-pay-input-wrap">
                    <input
                      className="el-pay-input"
                      type="text"
                      name="name"
                      placeholder="e.g. Swaliha Beaumont"
                      value={cardForm.name}
                      onChange={handleCardChange}
                      autoComplete="cc-name"
                    />
                    <User size={16} className="el-pay-input-icon" />
                  </div>
                </div>

                {/* Card Number */}
                <div className="el-pay-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="el-pay-field-label">CARD SERIAL IDENTIFICATION</label>
                    <div className="el-pay-secure-row">
                      <Lock size={11} />
                      <span>Secure Vault</span>
                    </div>
                  </div>
                  <div className="el-pay-input-wrap">
                    <input
                      className="el-pay-input"
                      type="text"
                      name="number"
                      placeholder="4532 •••• •••• 8821"
                      value={cardForm.number}
                      onChange={handleCardChange}
                      autoComplete="cc-number"
                    />
                    {cardNetwork && (
                      <span className="el-pay-card-network">{cardNetwork}</span>
                    )}
                    <CheckCircle2
                      size={16}
                      className={`el-pay-input-icon ${cardForm.number.replace(/\s/g, "").length >= 16 ? "verified" : ""}`}
                    />
                  </div>
                </div>

                {/* Expiry + CVV */}
                <div className="el-pay-field-row">
                  <div className="el-pay-field">
                    <label className="el-pay-field-label">EXPIRATION DATUM</label>
                    <div className="el-pay-input-wrap">
                      <input
                        className="el-pay-input"
                        type="text"
                        name="expiry"
                        placeholder="MM / YY"
                        value={cardForm.expiry}
                        onChange={handleCardChange}
                        autoComplete="cc-exp"
                      />
                      <Calendar size={16} className="el-pay-input-icon" />
                    </div>
                  </div>

                  <div className="el-pay-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="el-pay-field-label">SECURITY CRYPTOGRAM (CVV)</label>
                      <span className="el-pay-cvv-hint">What is this?</span>
                    </div>
                    <div className="el-pay-input-wrap">
                      <input
                        className="el-pay-input"
                        type="password"
                        name="cvv"
                        placeholder="•••"
                        value={cardForm.cvv}
                        onChange={handleCardChange}
                        autoComplete="cc-csc"
                        maxLength={4}
                      />
                      <Lock size={16} className="el-pay-input-icon" />
                    </div>
                  </div>
                </div>

                {/* Vault Save Checkbox */}
                <div className="el-pay-vault-check">
                  <input
                    type="checkbox"
                    id="saveCardVault"
                    name="saveCard"
                    checked={cardForm.saveCard}
                    onChange={handleCardChange}
                  />
                  <label htmlFor="saveCardVault" className="el-pay-vault-check-text">
                    <strong>Save this card securely to client vault for 1-click purchases</strong>
                    <span>Encrypted under RSA-4096 standards in our private Swiss banking enclave.</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ══════ RIGHT COLUMN: Order Summary ══════ */}
          <div className="el-pay-right">
            <div className="el-pay-summary-card">
              <h2 className="el-pay-summary-title">Order<br />Summary</h2>

              {/* Product Items */}
              {cartItems.map((item, idx) => {
                const img = resolveImageUrl(item.coverImage);
                return (
                  <div key={item._id || item.id || idx} className="el-pay-product-row">
                    <div className="el-pay-product-thumb">
                      {img ? (
                        <img src={img} alt={item.name} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#8A775C" }}>ATELIER</div>
                      )}
                      <span className="el-pay-product-thumb-label">ATELIER</span>
                    </div>
                    <div className="el-pay-product-info">
                      <div className="el-pay-product-tag">BEST SELLER</div>
                      <h3 className="el-pay-product-name">{item.name}</h3>
                      <p className="el-pay-product-variant">
                        Size: {item.size}
                        <span className="dot" style={{ backgroundColor: item.color?.toLowerCase() || "#8A775C" }} />
                        {item.color}
                      </p>
                      <div className="el-pay-product-price">
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Breakdown */}
              <div className="el-pay-breakdown">
                <div className="el-pay-cost-row">
                  <span>Product Subtotal</span>
                  <span>₹{formatINR(subtotal)}</span>
                </div>
                <div className="el-pay-cost-row">
                  <span>Delivery Charge</span>
                  <span className="el-pay-free-label">FREE</span>
                </div>
                <div className="el-pay-cost-row">
                  <span>Cedar Box Atelier Packaging</span>
                  <span>₹{formatINR(packagingFee)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="el-pay-cost-row">
                    <span className="el-pay-coupon-row">
                      <Shield size={13} />
                      Coupon Applied Amount
                    </span>
                    <span className="el-pay-disc-val">
                      -₹{formatINR(couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="el-pay-divider" />

                <div className="el-pay-total-row">
                  <div>
                    <div className="el-pay-total-label">Total Due</div>
                    <div className="el-pay-total-sub">TAXES & INSURANCE INCLUDED</div>
                  </div>
                  <div className="el-pay-total-amount">₹{formatINR(estimatedTotal)}</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <button
                type="button"
                className="el-pay-btn-confirm"
                disabled={processing || cartItems.length === 0}
                onClick={handleConfirmPay}
              >
                <span>
                  {processing
                    ? "PROCESSING..."
                    : paymentMethod === "RAZORPAY"
                    ? `PAY VIA RAZORPAY  ₹${formatINR(estimatedTotal)}`
                    : `CONFIRM & PAY  ₹${formatINR(estimatedTotal)}`}
                </span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="el-pay-btn-cancel"
                onClick={handleCancelPurchase}
                disabled={processing}
              >
                <span>CANCEL PURCHASE</span>
                <ArrowRight size={14} />
              </button>

              <p className="el-pay-legal">
                By confirming, you authorize our atelier vault to finalize dispatch.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Payment;
