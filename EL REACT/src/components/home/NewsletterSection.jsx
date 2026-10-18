import React from "react";
import { Sparkles } from "lucide-react";
import { NEWSLETTER_DATA } from "../../data/homeData";

function NewsletterSection() {
  const { eyebrow, title, description } = NEWSLETTER_DATA;

  return (
    <section className="el-newsletter-section" aria-label="VIP Salon Dispatches">
      <div className="el-newsletter-container">
        {/* Gold Seal / Monogram Icon */}
        <div className="el-newsletter-seal" aria-hidden="true">
          <Sparkles size={24} color="#D4AF37" strokeWidth={1.5} />
        </div>

        {/* Eyebrow */}
        <span className="el-newsletter-eyebrow">{eyebrow}</span>

        {/* Title */}
        <h2 className="el-newsletter-title">{title}</h2>

        {/* Description */}
        <p className="el-newsletter-desc">{description}</p>
      </div>

      <style>{`
        .el-newsletter-section {
          background-color: var(--el-burgundy-deep);
          background: linear-gradient(180deg, #43040E 0%, #2A0107 100%);
          padding: 96px 24px 80px;
          text-align: center;
          color: #FAF6F0;
          position: relative;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
        }

        .el-newsletter-container {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .el-newsletter-seal {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(212, 175, 55, 0.4);
          background-color: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .el-newsletter-eyebrow {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3.5px;
          color: var(--el-gold-light);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .el-newsletter-title {
          font-family: var(--font-serif);
          font-size: clamp(38px, 4.5vw, 56px);
          font-weight: 600;
          color: #FAF6F0;
          margin: 0 0 16px;
          letter-spacing: -0.5px;
        }

        .el-newsletter-desc {
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.7;
          color: rgba(250, 246, 240, 0.85);
          margin: 0;
          max-width: 540px;
        }

        @media (max-width: 580px) {
          .el-newsletter-section {
            padding: 64px 20px 56px;
          }
        }
      `}</style>
    </section>
  );
}

export default NewsletterSection;
