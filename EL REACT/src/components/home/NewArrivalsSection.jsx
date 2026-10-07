import React from "react";
import ProductCard from "../common/ProductCard";
import { NEW_ARRIVALS_DATA } from "../../data/homeData";

function NewArrivalsSection({ onAddToCart, onToggleWishlist }) {
  const { eyebrow, title, viewAllLink, products } = NEW_ARRIVALS_DATA;

  return (
    <section className="el-arrivals-section" id="new-arrivals" aria-label="New Arrivals">
      <div className="el-section-container">
        {/* Header */}
        <div className="el-section-header">
          <div className="el-header-left">
            <span className="el-section-eyebrow">{eyebrow}</span>
            <h2 className="el-section-title">{title}</h2>
          </div>
          <a href={viewAllLink.href} className="el-header-link">
            {viewAllLink.label}
          </a>
        </div>

        {/* 4-column Product Grid */}
        <div className="el-arrivals-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              badgeType="NEW"
            />
          ))}
        </div>
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
