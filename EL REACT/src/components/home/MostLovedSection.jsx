import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import ProductCard from "../common/ProductCard";
import { getProducts } from "../../services/productService";

const SECTION_EYEBROW = "BESTSELLER EDITORIAL SELECTION";
const SECTION_TITLE = "Most Loved by Clients";
const SECTION_SUBTITLE =
  "A collection of client favorites, defining our vision of modern luxury western dressing.";

function MostLovedSection({ onAddToCart, onToggleWishlist }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Primary strategy: Fetch genuine bestsellers flagged in MongoDB (limit 5)
      const res = await getProducts({ isBestSeller: true, limit: 5 });
      if (res?.data?.success && Array.isArray(res.data.products) && res.data.products.length > 0) {
        setProducts(res.data.products.slice(0, 5));
      } else {
        // Fallback strategy: If fewer products have isBestSeller flag, fetch active products sorted by bestseller
        const fallbackRes = await getProducts({ sort: "bestseller", limit: 5 });
        if (fallbackRes?.data?.success && Array.isArray(fallbackRes.data.products)) {
          setProducts(fallbackRes.data.products.slice(0, 5));
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error("Failed to retrieve client bestseller products:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve bestseller selections at this time. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  return (
    <section
      className="el-most-loved-section"
      id="bestsellers"
      aria-label="Most Loved by Clients"
    >
      <div className="el-section-container">
        {/* Scoped Vertical Header matching screenshot */}
        <div className="el-loved-header">
          <span className="el-loved-eyebrow">{SECTION_EYEBROW}</span>
          <h2 className="el-loved-title">{SECTION_TITLE}</h2>
          <p className="el-loved-subtitle">{SECTION_SUBTITLE}</p>
        </div>

        {/* 1. Loading State: 5 Skeleton Cards */}
        {loading && (
          <div className="el-loved-grid" aria-busy="true">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="el-loved-skeleton-card">
                <div className="el-loved-skeleton-media shimmer" />
                <div className="el-loved-skeleton-content">
                  <div className="el-loved-skeleton-rating shimmer" />
                  <div className="el-loved-skeleton-title shimmer" />
                  <div className="el-loved-skeleton-subtitle shimmer" />
                  <div className="el-loved-skeleton-price shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="el-loved-state-box error-box">
            <AlertCircle size={32} className="el-loved-state-icon error-icon" />
            <h3 className="el-loved-state-title">Unable to Load Bestsellers</h3>
            <p className="el-loved-state-text">{error}</p>
            <button
              type="button"
              onClick={fetchBestSellers}
              className="el-loved-state-action-btn"
            >
              <RefreshCw size={14} /> RETRY REQUEST
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="el-loved-state-box empty-box">
            <Sparkles size={32} className="el-loved-state-icon empty-icon" />
            <h3 className="el-loved-state-title">Editorial Selection Pending</h3>
            <p className="el-loved-state-text">
              Our curated client favorites are currently being updated in the salon archive.
            </p>
            <Link to="/collections" className="el-loved-state-action-btn">
              EXPLORE FULL COLLECTION
            </Link>
          </div>
        )}

        {/* 4. Real 5-column Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="el-loved-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                badgeType="BEST SELLER"
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .el-most-loved-section {
          background-color: var(--el-cream, #FAF7F2);
          padding: 60px 0 90px;
        }

        .el-section-container {
          max-width: var(--container-max, 1360px);
          margin: 0 auto;
          padding: 0 32px;
        }

        .el-loved-header {
          margin-bottom: 36px;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .el-loved-eyebrow {
          display: block;
          font-family: var(--font-sans, 'Poppins', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: var(--el-burgundy, #500714);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .el-loved-title {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(32px, 3.8vw, 48px);
          font-weight: 600;
          color: var(--el-text-heading, #1F2421);
          margin: 0 0 10px;
          letter-spacing: -0.3px;
          line-height: 1.15;
        }

        .el-loved-subtitle {
          font-family: var(--font-sans, 'Poppins', sans-serif);
          font-size: 14px;
          line-height: 1.6;
          color: var(--el-text-muted, #71717A);
          margin: 0;
        }

        /* 5-column Product Grid */
        .el-loved-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1240px) {
          .el-loved-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 820px) {
          .el-loved-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 540px) {
          .el-loved-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Skeletons & State Boxes */
        .el-loved-skeleton-card {
          background: #FFFFFF;
          border-radius: var(--radius-md, 4px);
          overflow: hidden;
          border: 1px solid var(--el-border, #E8E2D8);
          display: flex;
          flex-direction: column;
        }

        .el-loved-skeleton-media {
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #EDE8E1;
        }

        .el-loved-skeleton-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .el-loved-skeleton-rating {
          height: 12px;
          width: 45%;
          background: #EDE8E1;
          border-radius: 2px;
        }

        .el-loved-skeleton-title {
          height: 16px;
          width: 85%;
          background: #EDE8E1;
          border-radius: 2px;
        }

        .el-loved-skeleton-subtitle {
          height: 12px;
          width: 65%;
          background: #EDE8E1;
          border-radius: 2px;
        }

        .el-loved-skeleton-price {
          height: 16px;
          width: 35%;
          background: #EDE8E1;
          border-radius: 2px;
          margin-top: 4px;
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: lovedShimmer 1.5s infinite;
          content: '';
        }

        @keyframes lovedShimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .el-loved-state-box {
          background: #FFFFFF;
          border: 1px dashed var(--el-border, #E8E2D8);
          border-radius: var(--radius-md, 4px);
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 12px 0;
        }

        .el-loved-state-icon {
          margin-bottom: 12px;
        }

        .error-icon {
          color: #DC2626;
        }

        .empty-icon {
          color: #C49E60;
        }

        .el-loved-state-title {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 22px;
          font-weight: 500;
          color: var(--el-text-heading, #1F2421);
          margin: 0 0 8px;
        }

        .el-loved-state-text {
          font-family: var(--font-sans, 'Poppins', sans-serif);
          font-size: 13px;
          color: var(--el-text-muted, #71717A);
          max-width: 440px;
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .el-loved-state-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--el-burgundy, #500714);
          color: #FAF6F0;
          padding: 10px 20px;
          border-radius: var(--radius-full, 9999px);
          font-family: var(--font-sans, 'Poppins', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.25s ease;
        }

        .el-loved-state-action-btn:hover {
          background-color: var(--el-burgundy-deep, #3B040D);
        }
      `}</style>
    </section>
  );
}

export default MostLovedSection;
