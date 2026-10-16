import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Package, MapPin, CreditCard, ArrowRight, ShoppingBag } from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import "./OrderConfirmed.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// OrderConfirmed Component
// ---------------------------------------------------------------------------
function OrderConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();

  // The order object is passed via navigate state from Checkout.jsx.
  // If the user navigates here directly without an order, redirect to home.
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate("/", { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const { orderNumber, items = [], shippingAddress, pricing, paymentMethod, orderStatus, createdAt } = order;

  const placedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="el-oc-root">
      <Navbar />

      <main className="el-oc-main">
        {/* ── Confirmation Header ── */}
        <section className="el-oc-hero">
          <div className="el-oc-hero-icon-ring">
            <CheckCircle2 size={40} className="el-oc-check-icon" />
          </div>
          <div className="el-oc-hero-text">
            <p className="el-oc-label">ORDER CONFIRMED</p>
            <h1 className="el-oc-title">Your curation is en route.</h1>
            <p className="el-oc-subtitle">
              Thank you for your order. You will receive a confirmation shortly.
            </p>
          </div>
          <div className="el-oc-order-ref">
            <span className="el-oc-ref-label">Order Reference</span>
            <span className="el-oc-ref-value">{orderNumber}</span>
            {placedDate && (
              <span className="el-oc-ref-date">Placed on {placedDate}</span>
            )}
          </div>
        </section>

        <div className="el-oc-body">
          {/* ── Left: Items + Address ── */}
          <div className="el-oc-left">
            {/* Items */}
            <div className="el-oc-card">
              <div className="el-oc-card-head">
                <Package size={16} className="el-oc-card-icon" />
                <h2 className="el-oc-card-title">Items Ordered</h2>
              </div>
              <div className="el-oc-items-list">
                {items.map((item, idx) => {
                  const img = resolveImageUrl(item.coverImage);
                  return (
                    <div key={item._id || idx} className="el-oc-item-row">
                      <div className="el-oc-item-img-wrap">
                        {img ? (
                          <img src={img} alt={item.name} className="el-oc-item-img" />
                        ) : (
                          <div className="el-oc-item-img-placeholder">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <span className="el-oc-item-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="el-oc-item-info">
                        <p className="el-oc-item-name">{item.name}</p>
                        <p className="el-oc-item-meta">
                          {item.size && <span>{item.size}</span>}
                          {item.size && item.color && <span className="el-oc-meta-sep">·</span>}
                          {item.color && <span>{item.color}</span>}
                        </p>
                      </div>
                      <p className="el-oc-item-price">₹{formatINR(item.lineTotal)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address */}
            {shippingAddress && (
              <div className="el-oc-card">
                <div className="el-oc-card-head">
                  <MapPin size={16} className="el-oc-card-icon" />
                  <h2 className="el-oc-card-title">Delivery Address</h2>
                </div>
                <div className="el-oc-address-block">
                  <p className="el-oc-addr-name">{shippingAddress.fullName}</p>
                  {shippingAddress.phone && (
                    <p className="el-oc-addr-line">{shippingAddress.phone}</p>
                  )}
                  <p className="el-oc-addr-line">
                    {shippingAddress.house}
                    {shippingAddress.street ? `, ${shippingAddress.street}` : ""}
                  </p>
                  <p className="el-oc-addr-line">
                    {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Pricing + Payment ── */}
          <div className="el-oc-right">
            <div className="el-oc-card">
              <div className="el-oc-card-head">
                <CreditCard size={16} className="el-oc-card-icon" />
                <h2 className="el-oc-card-title">Order Summary</h2>
              </div>

              {pricing && (
                <div className="el-oc-pricing">
                  <div className="el-oc-price-row">
                    <span>Subtotal</span>
                    <span>₹{formatINR(pricing.subtotal)}</span>
                  </div>
                  <div className="el-oc-price-row">
                    <span>Shipping</span>
                    <span className="el-oc-free">
                      {pricing.shippingFee === 0 ? "Free" : `₹${formatINR(pricing.shippingFee)}`}
                    </span>
                  </div>
                  {pricing.packagingFee > 0 && (
                    <div className="el-oc-price-row">
                      <span>Packaging</span>
                      <span>₹{formatINR(pricing.packagingFee)}</span>
                    </div>
                  )}
                  <div className="el-oc-price-divider" />
                  <div className="el-oc-price-row el-oc-price-total">
                    <span>Total</span>
                    <span>₹{formatINR(pricing.total)}</span>
                  </div>
                </div>
              )}

              <div className="el-oc-payment-row">
                <span className="el-oc-payment-label">Payment</span>
                <span className="el-oc-payment-value">
                  {paymentMethod === "COD" ? "Cash on Delivery" : paymentMethod}
                </span>
              </div>

              <div className="el-oc-status-row">
                <span className="el-oc-status-label">Order Status</span>
                <span className={`el-oc-status-badge el-oc-status-${orderStatus}`}>
                  {orderStatus?.charAt(0).toUpperCase() + orderStatus?.slice(1)}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="el-oc-actions">
              <Link to="/collections" className="el-oc-btn-continue">
                <span>CONTINUE SHOPPING</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <p className="el-oc-assurance">
              A delivery update will be sent to your registered contact once your parcel is dispatched.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrderConfirmed;
