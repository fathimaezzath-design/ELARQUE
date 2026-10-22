import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Tag,
  Receipt,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./PaymentSuccess.css";

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  // Order and payment data passed from Checkout via navigation state
  const stateData = location.state || {};
  const order = stateData.order;
  const paymentDetails = stateData.paymentDetails || {};

  useEffect(() => {
    if (!order) {
      navigate("/", { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const {
    _id,
    orderNumber,
    items = [],
    shippingAddress,
    subtotal,
    discount,
    coupon,
    packagingFee,
    shippingCharge = 0,
    totalAmount,
    paymentMethod,
    paymentGateway,
    gatewayPaymentId,
    gatewayOrderId,
    orderStatus,
    createdAt,
  } = order;

  const effectiveGateway =
    paymentGateway ||
    paymentDetails.gateway ||
    (paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay Online");

  const effectivePaymentId =
    gatewayPaymentId ||
    paymentDetails.paymentId ||
    paymentDetails.razorpayPaymentId ||
    `TXN-${String(_id).slice(-8).toUpperCase()}`;

  const placedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="el-ps-root">
      <Navbar />

      <main className="el-ps-main">
        {/* ── HERO BANNER WITH LUXURY ILLUSTRATION ── */}
        <section className="el-ps-hero">
          {/* Animated SVG Luxury Badge Illustration */}
          <div className="el-ps-illustration-wrap">
            <svg
              className="el-ps-crest-svg"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="url(#ps_gold_grad)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="el-ps-rotate-ring"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="#650D20"
                stroke="#C5A059"
                strokeWidth="2"
              />
              <path
                d="M42 60L54 72L78 48"
                stroke="#F8F3EC"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="ps_gold_grad"
                  x1="0"
                  y1="0"
                  x2="120"
                  y2="120"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#C5A059" />
                  <stop offset="0.5" stopColor="#E6D5B8" />
                  <stop offset="1" stopColor="#8A775C" />
                </linearGradient>
              </defs>
            </svg>
            <div className="el-ps-sparkle-pill">
              <Sparkles size={12} />
              <span>AUTHENTICATED</span>
            </div>
          </div>

          <div className="el-ps-statement-block">
            <span className="el-ps-eyebrow">
              TRANSACTION AUTHENTICATED • ATELIER CLEARANCE
            </span>
            <h1 className="el-ps-title">Payment Confirmed</h1>
            <p className="el-ps-statement">
              Your payment of <strong>₹{formatINR(totalAmount)}</strong> has been
              successfully authorized and settled via{" "}
              <strong>{effectiveGateway}</strong>. Your bespoke commission has
              been received by the ELARQUE atelier master tailors.
            </p>
          </div>

          {/* Reference & Transaction Bar */}
          <div className="el-ps-meta-strip">
            <div className="el-ps-meta-cell">
              <span className="el-ps-meta-label">ORDER REFERENCE</span>
              <span className="el-ps-meta-value">{orderNumber}</span>
            </div>
            <div className="el-ps-meta-divider" />
            <div className="el-ps-meta-cell">
              <span className="el-ps-meta-label">TRANSACTION ID</span>
              <span className="el-ps-meta-value mono">{effectivePaymentId}</span>
            </div>
            <div className="el-ps-meta-divider" />
            <div className="el-ps-meta-cell">
              <span className="el-ps-meta-label">PAYMENT CHANNEL</span>
              <span className="el-ps-meta-badge">{effectiveGateway}</span>
            </div>
            <div className="el-ps-meta-divider" />
            <div className="el-ps-meta-cell">
              <span className="el-ps-meta-label">AUTHENTICATED ON</span>
              <span className="el-ps-meta-value">{placedDate}</span>
            </div>
          </div>

          {/* ── PRIMARY DUAL CALL-TO-ACTION BUTTONS ── */}
          <div className="el-ps-cta-group">
            <button
              type="button"
              className="el-ps-btn-order-details"
              onClick={() => navigate(`/orders/${_id}`)}
            >
              <span>VIEW ORDER DETAILS</span>
              <ExternalLink size={15} />
            </button>

            <Link to="/collections" className="el-ps-btn-continue-shop">
              <span>CONTINUE SHOPPING</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* ── TWO-COLUMN DETAILS GRID ── */}
        <div className="el-ps-grid">
          {/* LEFT: Items Ordered */}
          <div className="el-ps-left-col">
            <section className="el-ps-card">
              <div className="el-ps-card-head">
                <Package size={17} className="el-ps-icon-burgundy" />
                <h2>Commissions Included ({items.length})</h2>
              </div>

              <div className="el-ps-items-list">
                {items.map((item, idx) => {
                  const img = resolveImageUrl(item.productImage);
                  return (
                    <div key={item._id || idx} className="el-ps-item-row">
                      <div className="el-ps-thumb-wrap">
                        {img ? (
                          <img
                            src={img}
                            alt={item.productName}
                            className="el-ps-thumb"
                          />
                        ) : (
                          <div className="el-ps-thumb-fallback">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <span className="el-ps-qty-pill">{item.quantity}</span>
                      </div>

                      <div className="el-ps-item-info">
                        <span className="el-ps-atelier-tag">BESPOKE CUT</span>
                        <h3 className="el-ps-item-name">{item.productName}</h3>
                        <p className="el-ps-item-specs">
                          {item.variant?.size && (
                            <span>Size: {item.variant.size}</span>
                          )}
                          {item.variant?.size && item.variant?.color && (
                            <span className="el-ps-sep">•</span>
                          )}
                          {item.variant?.color && (
                            <span>Color: {item.variant.color}</span>
                          )}
                        </p>
                      </div>

                      <div className="el-ps-item-price-col">
                        <span className="el-ps-price">
                          ₹{formatINR(item.itemTotal || item.price * item.quantity)}
                        </span>
                        <span className="el-ps-unit-price">
                          ₹{formatINR(item.price)} each
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Delivery Destination Card */}
            {shippingAddress && (
              <section className="el-ps-card">
                <div className="el-ps-card-head">
                  <MapPin size={17} className="el-ps-icon-burgundy" />
                  <h2>Delivery Destination</h2>
                </div>
                <div className="el-ps-address-box">
                  <p className="el-ps-addr-name">{shippingAddress.fullName}</p>
                  <p className="el-ps-addr-line">
                    {[shippingAddress.house, shippingAddress.street]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="el-ps-addr-line">
                    {shippingAddress.city}, {shippingAddress.state} —{" "}
                    {shippingAddress.pincode}
                  </p>
                  {shippingAddress.phone && (
                    <p className="el-ps-addr-phone">
                      Contact: +91 {shippingAddress.phone}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: Financial Summary Card */}
          <aside className="el-ps-right-col">
            <div className="el-ps-card el-ps-summary-card">
              <div className="el-ps-card-head">
                <Receipt size={17} className="el-ps-icon-burgundy" />
                <h2>Financial Statement</h2>
              </div>

              <div className="el-ps-pricing-rows">
                <div className="el-ps-price-row">
                  <span>Subtotal</span>
                  <span>₹{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="el-ps-price-row discount-row">
                    <span className="el-ps-disc-label">
                      <Tag size={13} />
                      <span>
                        Privilege Discount{" "}
                        {coupon?.code ? `(${coupon.code})` : ""}
                      </span>
                    </span>
                    <span className="el-ps-disc-amount">
                      -₹{formatINR(discount)}
                    </span>
                  </div>
                )}

                <div className="el-ps-price-row">
                  <span>Signature Packaging</span>
                  <span>₹{formatINR(packagingFee || 199)}</span>
                </div>

                <div className="el-ps-price-row">
                  <span>Insured Courier Shipping</span>
                  <span className="el-ps-free-tag">Complimentary</span>
                </div>

                <div className="el-ps-price-divider" />

                <div className="el-ps-price-row total-row">
                  <div>
                    <span className="el-ps-total-label">Total Amount Paid</span>
                    <span className="el-ps-tax-sub">All taxes included</span>
                  </div>
                  <span className="el-ps-total-amount">
                    ₹{formatINR(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="el-ps-payment-pill">
                <CreditCard size={15} />
                <span>
                  Paid via <strong>{effectiveGateway}</strong>
                </span>
                <span className="el-ps-paid-tag">PAID IN FULL</span>
              </div>

              <div className="el-ps-guarantee-box">
                <ShieldCheck size={18} className="el-ps-shield-icon" />
                <p>
                  Your purchase is fully insured under the ELARQUE Atelier
                  Privilege Programme, featuring 7-day complimentary concierge
                  returns and signature cedar boxing.
                </p>
              </div>

              {/* Duplicate Quick CTAs inside Summary Card */}
              <div className="el-ps-summary-actions">
                <button
                  type="button"
                  className="el-ps-btn-summary-order"
                  onClick={() => navigate(`/orders/${_id}`)}
                >
                  VIEW FULL DOSSIER
                </button>
                <Link to="/collections" className="el-ps-btn-summary-shop">
                  EXPLORE ARCHIVE ➔
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PaymentSuccess;
