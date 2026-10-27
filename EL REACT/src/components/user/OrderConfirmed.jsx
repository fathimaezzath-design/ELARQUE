import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Truck, ShieldCheck, ShoppingBag } from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import "./OrderConfirmed.css";

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return Number(val).toLocaleString("en-IN");
};

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

function OrderConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve order from state or session storage to handle refresh safely without duplicate requests
  const [order] = useState(() => {
    const fromState = location.state?.order;
    if (fromState) {
      try {
        sessionStorage.setItem("elarque_last_confirmed_order", JSON.stringify(fromState));
      } catch (e) {
        console.warn("Session storage save error:", e);
      }
      return fromState;
    }
    try {
      const cached = sessionStorage.getItem("elarque_last_confirmed_order");
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn("Session storage read error:", e);
    }
    return null;
  });

  useEffect(() => {
    if (!order) {
      navigate("/", { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const {
    _id,
    orderNumber = "ELQ-2026-45821",
    items = [],
    totalAmount = 0,
    orderDate,
    createdAt,
  } = order;

  // Format commission date (e.g. "12 September 2026")
  const rawDate = orderDate || createdAt || new Date();
  const formattedDate = new Date(rawDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleDownloadInvoice = () => {
    try {
      generateInvoicePDF(order);
    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
    }
  };

  const handleTrackOrder = () => {
    if (_id) {
      navigate(`/orders/${_id}`);
    } else {
      navigate("/orders");
    }
  };

  return (
    <div className="el-oc-page">
      <Navbar />

      <main className="el-oc-main">
        {/* ── Top Confirmation Section ── */}
        <section className="el-oc-hero-section">
          {/* Centered Burgundy Checkmark Badge */}
          <div className="el-oc-badge-circle" aria-label="Order Confirmed">
            <Check size={32} color="#FFFFFF" strokeWidth={2.6} />
          </div>

          {/* Gold Uppercase Eyebrow */}
          <span className="el-oc-eyebrow">SALON HAUTE COUTURE CONFIRMATION</span>

          {/* Main Heading */}
          <h1 className="el-oc-title">Your Order is Confirmed</h1>

          {/* Supporting Text */}
          <p className="el-oc-subtitle">
            Thank you for shopping with ELARQUE. Your luxury pieces are being prepared with artisanal care and will be on their way soon.
          </p>

          {/* Pill-Shaped Order Information Container */}
          <div className="el-oc-ref-pill">
            <span className="el-oc-pill-gold-dot">●</span>
            <span className="el-oc-pill-order-num">ORDER #{orderNumber.replace(/^#/, "")}</span>
            <span className="el-oc-pill-sep">·</span>
            <span className="el-oc-pill-date">Commissioned {formattedDate}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="el-oc-actions-row">
            <button
              type="button"
              className="el-oc-btn-track"
              onClick={handleTrackOrder}
            >
              <Truck size={15} color="#FFFFFF" strokeWidth={2} />
              <span>TRACK YOUR ORDER</span>
            </button>

            <button
              type="button"
              className="el-oc-btn-invoice"
              onClick={handleDownloadInvoice}
            >
              <span>DOWNLOAD INVOICE</span>
            </button>
          </div>
        </section>

        {/* ── Order Details Card ── */}
        <section className="el-oc-details-card">
          <h2 className="el-oc-details-heading">Order Details</h2>

          <div className="el-oc-items-wrapper">
            {items.map((item, idx) => {
              const img = resolveImageUrl(item.productImage);
              const colorName = item.variant?.color || item.color || "Deep Burgundy";
              const sizeVal = item.variant?.size || item.size || "M";
              const quantityVal = item.quantity || 1;

              return (
                <div key={item._id || idx} className="el-oc-item-card">
                  {/* Product Thumbnail with Couture Tag */}
                  <div className="el-oc-item-thumb-box">
                    {img ? (
                      <img
                        src={img}
                        alt={item.productName || "Product"}
                        className="el-oc-item-img"
                      />
                    ) : (
                      <div className="el-oc-item-placeholder">
                        <ShoppingBag size={24} color="#A3968F" />
                      </div>
                    )}
                    <span className="el-oc-item-couture-badge">COUTURE</span>
                  </div>

                  {/* Product Metadata & Price */}
                  <div className="el-oc-item-info">
                    <h3 className="el-oc-item-title">
                      {item.productName || "Signature Western Blazer Dress"}
                    </h3>

                    {/* Metadata Tags (Color, Size, Qty) */}
                    <div className="el-oc-meta-tags">
                      <span className="el-oc-meta-pill el-oc-meta-color">
                        <span className="el-oc-color-dot" />
                        <span>{colorName}</span>
                      </span>

                      <span className="el-oc-meta-pill">
                        SIZE: {sizeVal}
                      </span>

                      <span className="el-oc-meta-pill">
                        QTY: {quantityVal}
                      </span>
                    </div>

                    {/* Total Purchase Amount */}
                    <div className="el-oc-amount-row">
                      <span className="el-oc-amount-label">Total Purchase Amount:</span>
                      <span className="el-oc-amount-value">
                        ₹{formatINR(totalAmount)}
                      </span>
                    </div>

                    {/* Guarantee / Authenticity Monograph note */}
                    <div className="el-oc-monograph-note">
                      <ShieldCheck size={14} className="el-oc-monograph-icon" />
                      <span>Bespoke Cedar Box Packaging Included · Authenticity Monograph Sealed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OrderConfirmed;
