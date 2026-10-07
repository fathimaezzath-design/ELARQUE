import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { FOOTER_DATA } from "../../data/homeData";

function Footer() {
  const { brand, columns, legal, copyright } = FOOTER_DATA;

  return (
    <footer className="el-footer" aria-label="Site Footer">
      <div className="el-footer-container">
        {/* Main 4-column Grid */}
        <div className="el-footer-grid">
          {/* Brand Info */}
          <div className="el-footer-brand-col">
            <Link to="/" className="el-footer-logo-link">
              <span className="el-footer-logo">{brand.name}</span>
            </Link>
            <p className="el-footer-statement">{brand.statement}</p>
            <div className="el-footer-salons">
              <MapPin size={13} color="#C49E60" />
              <span>{brand.salons}</span>
            </div>
            <div className="el-footer-contacts">
              <a href={`mailto:${brand.email}`} className="el-contact-item">
                <Mail size={13} /> {brand.email}
              </a>
              <a href="tel:+18003527783" className="el-contact-item">
                <Phone size={13} /> {brand.phone}
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          {columns.map((col) => (
            <div key={col.title} className="el-footer-col">
              <h4 className="el-footer-col-title">{col.title}</h4>
              <ul className="el-footer-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="el-footer-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="el-footer-bottom">
          <div className="el-footer-bottom-left">
            <span className="el-copyright">{copyright}</span>
          </div>

          <div className="el-footer-legal-links">
            {legal.map((item) => (
              <a key={item.label} href={item.href} className="el-legal-link">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .el-footer {
          background-color: var(--el-burgundy-darkest);
          color: #FAF6F0;
          padding: 80px 0 36px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-sans);
        }

        .el-footer-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 0 32px;
        }

        .el-footer-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 64px;
        }

        .el-footer-brand-col {
          display: flex;
          flex-direction: column;
          padding-right: 24px;
        }

        .el-footer-logo-link {
          text-decoration: none;
          margin-bottom: 16px;
          display: inline-block;
        }

        .el-footer-logo {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #FAF6F0;
          text-transform: uppercase;
        }

        .el-footer-statement {
          font-size: 13px;
          line-height: 1.7;
          color: rgba(250, 246, 240, 0.7);
          margin: 0 0 20px;
          max-width: 360px;
        }

        .el-footer-salons {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10.5px;
          letter-spacing: 2px;
          color: var(--el-gold-light);
          font-weight: 600;
          margin-bottom: 18px;
          text-transform: uppercase;
        }

        .el-footer-contacts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .el-contact-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(250, 246, 240, 0.65);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .el-contact-item:hover {
          color: var(--el-gold-light);
        }

        .el-footer-col {
          display: flex;
          flex-direction: column;
        }

        .el-footer-col-title {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--el-gold-light);
          margin: 0 0 20px;
        }

        .el-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .el-footer-link {
          font-size: 13px;
          color: rgba(250, 246, 240, 0.75);
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }

        .el-footer-link:hover {
          color: #FAF6F0;
          transform: translateX(3px);
        }

        .el-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
          color: rgba(250, 246, 240, 0.5);
          flex-wrap: wrap;
          gap: 16px;
        }

        .el-footer-legal-links {
          display: flex;
          gap: 24px;
        }

        .el-legal-link {
          color: rgba(250, 246, 240, 0.5);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .el-legal-link:hover {
          color: var(--el-gold-light);
        }

        @media (max-width: 992px) {
          .el-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
          }
        }

        @media (max-width: 600px) {
          .el-footer-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .el-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .el-footer-legal-links {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
