import React from "react";
import { EDITORIAL_GALLERY_DATA } from "../../data/homeData";

function EditorialGallerySection() {
  const { eyebrow, title, viewLink, photos } = EDITORIAL_GALLERY_DATA;

  return (
    <section className="el-gallery-section" id="editorial" aria-label="Editorial Gallery">
      <div className="el-section-container">
        {/* Header */}
        <div className="el-section-header">
          <div className="el-header-left">
            <span className="el-section-eyebrow">{eyebrow}</span>
            <h2 className="el-section-title">{title}</h2>
          </div>
          <a href={viewLink.href} className="el-header-link">
            {viewLink.label}
          </a>
        </div>

        {/* 6-image Grid */}
        <div className="el-gallery-grid">
          {photos.map((item) => (
            <div key={item.id} className="el-gallery-item">
              <img
                src={item.image}
                alt={item.caption}
                className="el-gallery-img"
                loading="lazy"
              />
              <div className="el-gallery-overlay">
                <span className="el-gallery-city">{item.city}</span>
                <span className="el-gallery-caption">{item.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .el-gallery-section {
          background-color: var(--el-cream);
          padding: 80px 0;
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
          gap: 24px;
        }

        .el-header-left {
          flex: 1;
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
          font-size: clamp(28px, 3.5vw, 46px);
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0;
          letter-spacing: -0.3px;
          line-height: 1.15;
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
          white-space: nowrap;
          flex-shrink: 0;
        }

        .el-header-link:hover {
          border-color: var(--el-burgundy);
          transform: translateX(3px);
        }

        .el-gallery-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        .el-gallery-item {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background-color: #E8E0D5;
          box-shadow: 0 4px 12px rgba(42, 1, 7, 0.06);
          border: 1px solid var(--el-border);
        }

        .el-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .el-gallery-item:hover .el-gallery-img {
          transform: scale(1.08);
        }

        .el-gallery-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(42, 1, 7, 0) 30%,
            rgba(42, 1, 7, 0.85) 100%
          );
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px;
          opacity: 0;
          transition: opacity 0.3s ease;
          color: #FFFFFF;
        }

        .el-gallery-item:hover .el-gallery-overlay {
          opacity: 1;
        }

        .el-gallery-city {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: var(--el-gold-light);
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .el-gallery-caption {
          font-family: var(--font-serif);
          font-size: 13px;
          line-height: 1.25;
          color: #FAF6F0;
        }

        @media (max-width: 1100px) {
          .el-gallery-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 600px) {
          .el-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
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

export default EditorialGallerySection;
