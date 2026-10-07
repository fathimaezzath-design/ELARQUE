import React from "react";
import { ArrowRight } from "lucide-react";
import { SILHOUETTES_DATA } from "../../data/homeData";

function SilhouetteSection() {
  const { eyebrow, title, viewAllLink, items } = SILHOUETTES_DATA;

  return (
    <section className="el-silhouette-section" id="collections" aria-label="Explore by Silhouette">
      <div className="el-section-container">
        {/* Section Header */}
        <div className="el-section-header">
          <div className="el-header-left">
            <span className="el-section-eyebrow">{eyebrow}</span>
            <h2 className="el-section-title">{title}</h2>
          </div>
          <a href={viewAllLink.href} className="el-header-link">
            {viewAllLink.label}
          </a>
        </div>

        {/* 2x2 Grid */}
        <div className="el-silhouette-grid">
          {items.map((card) => (
            <article key={card.id} className="el-silhouette-card">
              <img
                src={card.image}
                alt={card.alt || card.title}
                className="el-silhouette-img"
                loading="lazy"
              />
              <div className="el-silhouette-gradient" />

              <div className="el-silhouette-content">
                {card.badge && (
                  <span className="el-silhouette-badge">{card.badge}</span>
                )}
                <h3 className="el-silhouette-title">{card.title}</h3>
                <p className="el-silhouette-desc">{card.subtitle}</p>
                <a href={card.href} className="el-silhouette-cta">
                  <span>{card.cta}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .el-silhouette-section {
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
          margin-bottom: 40px;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .el-header-link:hover {
          border-color: var(--el-burgundy);
          transform: translateX(3px);
        }

        .el-silhouette-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }

        .el-silhouette-card {
          position: relative;
          height: 480px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(42, 1, 7, 0.08);
          border: 1px solid var(--el-border);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }

        .el-silhouette-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(42, 1, 7, 0.16);
        }

        .el-silhouette-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .el-silhouette-card:hover .el-silhouette-img {
          transform: scale(1.05);
        }

        .el-silhouette-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(30, 2, 7, 0.05) 0%,
            rgba(30, 2, 7, 0.2) 40%,
            rgba(40, 2, 8, 0.88) 85%,
            rgba(40, 2, 8, 0.96) 100%
          );
          pointer-events: none;
        }

        .el-silhouette-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 36px 36px 32px;
          display: flex;
          flex-direction: column;
          z-index: 2;
          color: #FFFFFF;
        }

        .el-silhouette-badge {
          align-self: flex-start;
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--el-gold-light);
          margin-bottom: 10px;
        }

        .el-silhouette-title {
          font-family: var(--font-serif);
          font-size: clamp(24px, 2.5vw, 32px);
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .el-silhouette-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.5;
          color: rgba(250, 246, 240, 0.85);
          margin: 0 0 20px;
          max-width: 440px;
        }

        .el-silhouette-cta {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.25s ease, color 0.25s ease;
        }

        .el-silhouette-cta:hover {
          color: var(--el-gold-light);
          transform: translateX(4px);
        }

        @media (max-width: 860px) {
          .el-silhouette-grid {
            grid-template-columns: 1fr;
          }

          .el-silhouette-card {
            height: 400px;
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

export default SilhouetteSection;
