import React from "react";
import { Truck, ShieldCheck, Sparkles, Award } from "lucide-react";
import { VALUES_DATA } from "../../data/homeData";

const iconMap = {
  Truck,
  ShieldCheck,
  Sparkles,
  Award,
};

function ValuesSection() {
  const { eyebrow, titleMain, titleAccent, items } = VALUES_DATA;

  return (
    <section className="el-values-section" id="values" aria-label="Sartorial Promises">
      <div className="el-section-container">
        {/* Centered Heading */}
        <div className="el-values-header">
          <span className="el-values-eyebrow">{eyebrow}</span>
          <h2 className="el-values-title">
            <span>{titleMain}</span> <em>{titleAccent}</em>
          </h2>
        </div>

        {/* 4-card Grid */}
        <div className="el-values-grid">
          {items.map((item) => {
            const IconComponent = iconMap[item.iconName] || Award;
            return (
              <div key={item.id} className="el-value-card">
                <div className="el-value-icon-box">
                  <IconComponent size={22} color="#FFFFFF" strokeWidth={1.75} />
                </div>
                <h3 className="el-value-card-title">{item.title}</h3>
                <p className="el-value-card-desc">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .el-values-section {
          background-color: var(--el-cream);
          padding: 80px 0 100px;
          border-top: 1px solid var(--el-border);
          border-bottom: 1px solid var(--el-border);
        }

        .el-section-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 0 32px;
        }

        .el-values-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .el-values-eyebrow {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          color: var(--el-burgundy);
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .el-values-title {
          font-family: var(--font-serif);
          font-size: clamp(34px, 4vw, 50px);
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0;
          letter-spacing: -0.3px;
        }

        .el-values-title em {
          font-style: italic;
          font-weight: 400;
          color: #7B1E2B;
        }

        .el-values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .el-value-card {
          background-color: #FFFFFF;
          border-radius: var(--radius-md);
          border: 1px solid var(--el-border);
          padding: 36px 28px 32px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 16px rgba(42, 1, 7, 0.04);
        }

        .el-value-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(82, 8, 20, 0.08);
          border-color: #D8CAB9;
        }

        .el-value-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: var(--el-burgundy);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          box-shadow: 0 4px 12px rgba(82, 8, 20, 0.2);
        }

        .el-value-card-title {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0 0 10px;
          line-height: 1.25;
        }

        .el-value-card-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.6;
          color: var(--el-text-muted);
          margin: 0;
        }

        @media (max-width: 1024px) {
          .el-values-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 580px) {
          .el-values-grid {
            grid-template-columns: 1fr;
          }

          .el-value-card {
            padding: 28px 24px;
          }
        }
      `}</style>
    </section>
  );
}

export default ValuesSection;
