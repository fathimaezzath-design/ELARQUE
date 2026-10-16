import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { NEWSLETTER_DATA } from "../../data/homeData";

function NewsletterSection() {
  const { eyebrow, title, description, disclaimer } = NEWSLETTER_DATA;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid salon email address.");
      return;
    }
    setError("");
    setSubmitted(true);
    // Simulating newsletter signup
    console.log("Subscribed email to salon dispatches:", email);
  };

  return (
    <section className="el-newsletter-section" aria-label="VIP Newsletter Invitation">
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

        {/* Form / Success State */}
        {submitted ? (
          <div className="el-newsletter-success">
            <CheckCircle2 size={20} color="#D4AF37" />
            <span>Welcome to the ELARQUE Salon dispatches. Check your inbox for your private invitation.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="el-newsletter-form">
            <div className="el-input-group">
              <input
                type="email"
                placeholder="client@elarque.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="el-newsletter-input"
                aria-label="Email Address"
              />
              <button type="submit" className="el-newsletter-btn">
                <span>SUBSCRIBE</span> <ArrowRight size={15} />
              </button>
            </div>
            {error && <p className="el-newsletter-error">{error}</p>}
          </form>
        )}

        {/* Disclaimer */}
        <p className="el-newsletter-disclaimer">{disclaimer}</p>
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
          margin: 0 0 36px;
          max-width: 540px;
        }

        .el-newsletter-form {
          width: 100%;
          max-width: 520px;
          margin-bottom: 20px;
        }

        .el-input-group {
          display: flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(232, 223, 213, 0.25);
          border-radius: var(--radius-full);
          padding: 6px 8px 6px 20px;
          transition: border-color 0.25s ease, background-color 0.25s ease;
        }

        .el-input-group:focus-within {
          border-color: var(--el-gold-light);
          background-color: rgba(255, 255, 255, 0.12);
        }

        .el-newsletter-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-sans);
          font-size: 14px;
          color: #FAF6F0;
          padding: 10px 0;
        }

        .el-newsletter-input::placeholder {
          color: rgba(250, 246, 240, 0.45);
        }

        .el-newsletter-btn {
          background: linear-gradient(135deg, #DFBE82 0%, #C49E60 50%, #A57E3B 100%);
          color: #2A0107;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 12px 24px;
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .el-newsletter-btn:hover {
          filter: brightness(1.1);
          transform: translateX(2px);
        }

        .el-newsletter-error {
          font-family: var(--font-sans);
          font-size: 12px;
          color: #FF9B9B;
          margin-top: 10px;
        }

        .el-newsletter-success {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.4);
          padding: 16px 24px;
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: 13.5px;
          color: var(--el-gold-light);
          margin-bottom: 24px;
        }

        .el-newsletter-disclaimer {
          font-family: var(--font-sans);
          font-size: 11.5px;
          letter-spacing: 1px;
          color: rgba(250, 246, 240, 0.5);
          margin: 0;
        }

        @media (max-width: 580px) {
          .el-newsletter-section {
            padding: 64px 20px 56px;
          }

          .el-input-group {
            flex-direction: column;
            border-radius: var(--radius-md);
            padding: 12px;
            gap: 12px;
          }

          .el-newsletter-input {
            width: 100%;
            text-align: center;
          }

          .el-newsletter-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}

export default NewsletterSection;
