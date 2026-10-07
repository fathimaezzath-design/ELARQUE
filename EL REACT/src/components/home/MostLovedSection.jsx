import React from "react";
import ProductCard from "../common/ProductCard";
import { MOST_LOVED_DATA } from "../../data/homeData";

function MostLovedSection({ onAddToCart, onToggleWishlist }) {
  const { eyebrow, title, subtitle, products } = MOST_LOVED_DATA;

  return (
    <section className="el-most-loved-section" id="bestsellers" aria-label="Most Loved by Clients">
      <div className="el-section-container">
        {/* Scoped Vertical Header */}
        <div className="el-loved-header">
          <span className="el-loved-eyebrow">{eyebrow}</span>
          <h2 className="el-loved-title">{title}</h2>
          {subtitle && <p className="el-loved-subtitle">{subtitle}</p>}
        </div>

        {/* 5-column Product Grid */}
        <div className="el-loved-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              badgeType="BEST SELLER"
            />
          ))}
        </div>
      </div>

      <style>{`
        .el-most-loved-section {
          background-color: var(--el-cream);
          padding: 60px 0 90px;
        }

        .el-section-container {
          max-width: var(--container-max);
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
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: var(--el-burgundy);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .el-loved-title {
          font-family: var(--font-serif);
          font-size: clamp(32px, 3.8vw, 48px);
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0 0 10px;
          letter-spacing: -0.3px;
          line-height: 1.15;
        }

        .el-loved-subtitle {
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.6;
          color: var(--el-text-muted);
          margin: 0;
        }

        .el-loved-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }

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
      `}</style>
    </section>
  );
}

export default MostLovedSection;
