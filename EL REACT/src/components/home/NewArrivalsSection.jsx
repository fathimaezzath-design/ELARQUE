import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import ProductCard from "../common/ProductCard";
import { getProducts } from "../../services/productService";

function NewArrivalsSection({ onAddToCart, onToggleWishlist }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArrivals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch latest active customer-visible products (newest first, limit 4)
      const res = await getProducts({ sort: "newest", limit: 4 });
      if (res?.data?.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch new arrivals:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve the latest arrivals at this time. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  return (
    <section
      className="el-arrivals-section"
      id="new-arrivals"
      aria-label="New Arrivals"
    >
      <div className="el-section-container">
        {/* Section Header */}
        <div className="el-section-header">
          <div className="el-header-left">
            <span className="el-section-eyebrow">THE LATEST DROPS</span>
            <h2 className="el-section-title">New Arrivals</h2>
          </div>
          <Link to="/collections?sort=newest" className="el-header-link">
            VIEW ALL NEW PIECES →
          </Link>
        </div>

        {/* 1. Loading State — 4 Skeleton Cards */}
        {loading && (
          <div className="el-arrivals-grid" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="el-card-skeleton">
                <div className="el-skeleton-media shimmer" />
                <div className="el-skeleton-content">
                  <div className="el-skeleton-rating shimmer" />
                  <div className="el-skeleton-title shimmer" />
                  <div className="el-skeleton-subtitle shimmer" />
                  <div className="el-skeleton-price shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="el-arrivals-state-box error-box">
            <AlertCircle size={32} className="el-state-icon error-icon" />
            <h3 className="el-state-title">Unable to Load Arrivals</h3>
            <p className="el-state-text">{error}</p>
            <button
              type="button"
              onClick={fetchArrivals}
              className="el-state-action-btn"
            >
              <RefreshCw size={14} /> RETRY REQUEST
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="el-arrivals-state-box empty-box">
            <Sparkles size={32} className="el-state-icon empty-icon" />
            <h3 className="el-state-title">Atelier Releases Pending</h3>
            <p className="el-state-text">
              No new arrivals are currently listed. Discover our archive garments
              in the full collection.
            </p>
            <Link to="/collections" className="el-state-action-btn">
              EXPLORE ARCHIVE
            </Link>
          </div>
        )}

        {/* 4. Real Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="el-arrivals-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                badgeType="NEW"
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .el-arrivals-section {
          background-color: var(--el-cream);
          padding: 60px 0 80px;
        }

        .el-section-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 0 32px;
        }

        .el-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 36px;
          gap: 20px;
        }

        .el-section-eyebrow {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: var(--el-burgundy);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .el-section-title {
          font-family: var(--font-serif);
          font-size: clamp(32px, 3.8vw, 48px);
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0;
          letter-spacing: -0.3px;
        }

        .el-header-link {
          font-family: var(--font-sans);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--el-burgundy);
          text-decoration: none;
          padding-bottom: 4px;
          border-bottom: 1.5px solid transparent;
          transition: all 0.25s ease;
        }

        .el-header-link:hover {
          border-color: var(--el-burgundy);
          transform: translateX(3px);
        }

        .el-arrivals-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        /* State Box (Loading, Error, Empty) */
        .el-arrivals-state-box {
          background-color: #FFFFFF;
          border: 1px solid var(--el-border);
          border-radius: var(--radius-md);
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          max-width: 640px;
          margin: 0 auto;
        }

        .el-state-icon {
          margin-bottom: 4px;
        }

        .el-state-icon.error-icon {
          color: var(--el-burgundy);
        }

        .el-state-icon.empty-icon {
          color: #C49E60;
        }

        .el-state-title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0;
        }

        .el-state-text {
          font-family: var(--font-sans);
          font-size: 13.5px;
          color: var(--el-text-muted);
          margin: 0;
          max-width: 440px;
          line-height: 1.5;
        }

        .el-state-action-btn {
          margin-top: 10px;
          padding: 10px 22px;
          background-color: var(--el-burgundy);
          color: #FAF6F0;
          border-radius: var(--radius-full);
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.25s ease;
        }

        .el-state-action-btn:hover {
          background-color: var(--el-burgundy-deep);
        }

        /* Skeleton Styles */
        .el-card-skeleton {
          background-color: #FFFFFF;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--el-border);
          display: flex;
          flex-direction: column;
        }

        .el-skeleton-media {
          width: 100%;
          aspect-ratio: 3 / 4;
          background-color: #EDE8E1;
        }

        .el-skeleton-content {
          padding: 16px 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .el-skeleton-rating {
          width: 35%;
          height: 12px;
          background-color: #EDE8E1;
          border-radius: 4px;
        }

        .el-skeleton-title {
          width: 80%;
          height: 18px;
          background-color: #EDE8E1;
          border-radius: 4px;
        }

        .el-skeleton-subtitle {
          width: 55%;
          height: 12px;
          background-color: #EDE8E1;
          border-radius: 4px;
        }

        .el-skeleton-price {
          width: 40%;
          height: 16px;
          background-color: #EDE8E1;
          border-radius: 4px;
          margin-top: 4px;
        }

        @keyframes shimmerPulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }

        .shimmer {
          animation: shimmerPulse 1.6s ease-in-out infinite;
        }

        @media (max-width: 1140px) {
          .el-arrivals-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .el-arrivals-grid {
            grid-template-columns: 1fr;
          }

          .el-section-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}

export default NewArrivalsSection;
