import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { HERO_DATA } from "../../data/homeData";
import formatPrice from "../../utils/formatPrice";

function HeroSection() {
  const {
    eyebrow,
    headingMain,
    headingAccent,
    description,
    primaryCta,
    secondaryCta,
    metrics,
    heroImage,
    featuredCard,
  } = HERO_DATA;

  return (
    <section className="el-hero-section" aria-label="Hero Introduction">
      <div className="el-hero-container">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="el-hero-left">
          {/* Eyebrow Label */}
          <div className="el-hero-eyebrow">
            <span className="el-eyebrow-dot">•</span>
            <span>{eyebrow}</span>
          </div>

          {/* Main Headline */}
          <h1 className="el-hero-title">
            <span className="el-title-main">{headingMain}</span>{" "}
            <span className="el-title-accent">{headingAccent}</span>
          </h1>

          {/* Description */}
          <p className="el-hero-desc">{description}</p>

          {/* CTA Buttons */}
          <div className="el-hero-actions">
            <a href={primaryCta.href} className="el-btn el-btn-primary">
              {primaryCta.label} <ArrowRight size={15} />
            </a>
            <a href={secondaryCta.href} className="el-btn el-btn-secondary">
              {secondaryCta.label}
            </a>
          </div>

          {/* Sartorial Metrics */}
          <div className="el-hero-metrics">
            {metrics.map((item, idx) => (
              <div key={idx} className="el-metric-box">
                <span className="el-metric-val">{item.value}</span>
                <span className="el-metric-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Imagery & Floating Card Overlay */}
        <div className="el-hero-right">
          <div className="el-hero-media-wrapper">
            <img
              src={heroImage.url}
              alt={heroImage.alt}
              className="el-hero-img"
              loading="eager"
            />

            {/* Floating Product Card */}
            {featuredCard && (
              <div className="el-floating-card">
                <div className="el-floating-card-header">
                  <span className="el-floating-tag">{featuredCard.tag}</span>
                  <span className="el-floating-badge">{featuredCard.badge}</span>
                </div>

                <h4 className="el-floating-title">{featuredCard.title}</h4>
                <p className="el-floating-desc">{featuredCard.description}</p>

                <div className="el-floating-footer">
                  <div className="el-floating-pricing">
                    <span className="el-floating-price">
                      {formatPrice(featuredCard.price)}
                    </span>
                    {featuredCard.originalPrice && (
                      <span className="el-floating-original">
                        {formatPrice(featuredCard.originalPrice)}
                      </span>
                    )}
                  </div>

                  <a
                    href="#bestsellers"
                    className="el-floating-btn"
                    title={featuredCard.ctaLabel}
                  >
                    <span>{featuredCard.ctaLabel}</span>
                    <ShoppingBag size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .el-hero-section {
          background-color: var(--el-cream);
          padding: 48px 0 80px;
          position: relative;
          overflow: hidden;
        }

        .el-hero-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 64px;
          align-items: center;
        }

        /* Left Column */
        .el-hero-left {
          display: flex;
          flex-direction: column;
          padding-right: 16px;
        }

        .el-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 3px;
          color: var(--el-burgundy);
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .el-eyebrow-dot {
          color: var(--el-gold);
          font-size: 18px;
          line-height: 0;
        }

        .el-hero-title {
          font-family: var(--font-serif);
          font-size: clamp(42px, 5.2vw, 68px);
          font-weight: 600;
          line-height: 1.08;
          color: var(--el-text-heading);
          margin: 0 0 24px;
          letter-spacing: -0.5px;
        }

        .el-title-main {
          display: block;
          color: #211A18;
        }

        .el-title-accent {
          display: block;
          font-style: italic;
          font-weight: 400;
          color: #7B1E2B;
        }

        .el-hero-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.7;
          color: var(--el-text-muted);
          max-width: 500px;
          margin: 0 0 36px;
        }

        .el-hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .el-btn {
          font-family: var(--font-sans);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .el-btn-primary {
          background-color: var(--el-burgundy);
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(82, 8, 20, 0.25);
        }

        .el-btn-primary:hover {
          background-color: var(--el-burgundy-deep);
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(82, 8, 20, 0.35);
        }

        .el-btn-secondary {
          background-color: transparent;
          color: #2D2825;
          border: 1px solid #D6C7B7;
        }

        .el-btn-secondary:hover {
          background-color: rgba(82, 8, 20, 0.04);
          border-color: var(--el-burgundy);
          color: var(--el-burgundy);
        }

        .el-hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding-top: 32px;
          border-top: 1px solid var(--el-border);
        }

        .el-metric-box {
          display: flex;
          flex-direction: column;
        }

        .el-metric-val {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 600;
          color: #2D2825;
          margin-bottom: 4px;
        }

        .el-metric-label {
          font-family: var(--font-sans);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--el-text-muted);
          line-height: 1.3;
        }

        /* Right Column */
        .el-hero-right {
          position: relative;
        }

        .el-hero-media-wrapper {
          position: relative;
          width: 100%;
          border-radius: var(--radius-xl);
          overflow: visible;
          box-shadow: 0 20px 48px rgba(42, 1, 7, 0.12);
        }

        .el-hero-img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: var(--radius-xl);
          display: block;
        }

        /* Floating Highlight Card */
        .el-floating-card {
          position: absolute;
          bottom: -24px;
          left: -32px;
          background: #FFFFFF;
          border-radius: var(--radius-md);
          padding: 20px 22px;
          width: 320px;
          max-width: 90%;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
          border: 1px solid var(--el-border);
          z-index: 10;
          animation: elFloat 4s ease-in-out infinite alternate;
        }

        @keyframes elFloat {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }

        .el-floating-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .el-floating-tag {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: var(--el-text-muted);
          text-transform: uppercase;
        }

        .el-floating-badge {
          font-family: var(--font-sans);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          background: linear-gradient(135deg, #F5E8D0 0%, #E7C994 100%);
          color: #4A2E05;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }

        .el-floating-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0 0 4px;
        }

        .el-floating-desc {
          font-family: var(--font-sans);
          font-size: 11.5px;
          color: var(--el-text-muted);
          line-height: 1.4;
          margin: 0 0 14px;
        }

        .el-floating-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--el-border-light);
        }

        .el-floating-pricing {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .el-floating-price {
          font-family: var(--font-sans);
          font-size: 16px;
          font-weight: 600;
          color: var(--el-burgundy);
        }

        .el-floating-original {
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--el-text-light);
          text-decoration: line-through;
        }

        .el-floating-btn {
          background-color: var(--el-burgundy);
          color: #FFFFFF;
          padding: 8px 14px;
          border-radius: var(--radius-full);
          font-family: var(--font-sans);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.25s ease;
        }

        .el-floating-btn:hover {
          background-color: var(--el-burgundy-deep);
        }

        /* Responsiveness */
        @media (max-width: 1080px) {
          .el-hero-container {
            grid-template-columns: 1fr;
            gap: 56px;
          }

          .el-hero-left {
            padding-right: 0;
            text-align: center;
            align-items: center;
          }

          .el-hero-desc {
            margin-left: auto;
            margin-right: auto;
          }

          .el-hero-actions {
            justify-content: center;
          }

          .el-hero-metrics {
            width: 100%;
            max-width: 520px;
          }

          .el-hero-media-wrapper {
            max-width: 560px;
            margin: 0 auto;
          }

          .el-floating-card {
            left: 16px;
            bottom: -20px;
          }
        }

        @media (max-width: 640px) {
          .el-hero-section {
            padding: 32px 0 60px;
          }

          .el-hero-title {
            font-size: 38px;
          }

          .el-floating-card {
            position: relative;
            left: auto;
            bottom: auto;
            margin-top: 20px;
            width: 100%;
            animation: none;
          }

          .el-hero-metrics {
            grid-template-columns: 1fr;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
