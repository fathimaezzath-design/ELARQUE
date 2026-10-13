import React from "react";
import { Mail, ArrowRight, LockKeyhole } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";

function EmailVerified() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    localStorage.getItem("verifiedEmail") ||
    "";

  return (
    <UserLayout>
      <div className="verified-page">
        <main className="verified-content">
          <div className="verified-card">
            {/* ICON */}
            <div className="verified-icon-wrapper">
              <div className="verified-icon">
                <Mail size={34} strokeWidth={2} />
              </div>
              <div className="verified-lock">
                <LockKeyhole size={13} />
              </div>
            </div>

            {/* EYEBROW */}
            <p className="eyebrow">ACCOUNT SECURITY PROTOCOL</p>

            {/* TITLE */}
            <h1 className="verified-title">
              Email Verified
              <br />
              Successfully
            </h1>

            {/* DESCRIPTION */}
            <p className="verified-description">
              Your patronage credential has been validated and committed to
              your permanent ELARQUE atelier dossier.
            </p>

            {/* EMAIL */}
            {email && (
              <div className="email-box">
                <div className="email-symbol">@</div>
                <div className="email-info">
                  <p className="email-label">VERIFIED ADDRESS</p>
                  <p className="email-address">{email}</p>
                </div>
                <div className="authenticated">
                  <span className="auth-dot"></span>
                  VAULT AUTHENTICATED
                </div>
              </div>
            )}

            {/* BUTTON */}
            <button
              className="continue-btn"
              onClick={() => navigate("/profile")}
            >
              CONTINUE TO PROFILE
              <ArrowRight size={18} />
            </button>

            {/* SECURITY */}
            <div className="security-text">
              <LockKeyhole size={14} className="security-icon" />
              <span>
                Protected with TLS 256-bit patronage verification
              </span>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .verified-page {
          min-height: calc(100vh - 200px);
          background: #FAF6F0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 24px;
          font-family: var(--font-sans, 'Poppins', sans-serif);
        }

        .verified-content {
          width: 100%;
          max-width: 520px;
          display: flex;
          justify-content: center;
        }

        .verified-card {
          width: 100%;
          background: #ffffff;
          border-radius: 28px;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 30px rgba(82, 8, 20, 0.05);
          border: 1px solid var(--el-border, #E8DFD5);
          text-align: center;
        }

        .verified-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #FAF6F0;
          border: 3px solid #E8DFD5;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 20px;
        }

        .verified-icon {
          color: var(--el-burgundy, #520814);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .verified-lock {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--el-burgundy, #520814);
          color: #FAF6F0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--el-gold, #C49E60);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .verified-title {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 32px;
          color: var(--el-burgundy, #520814);
          margin-bottom: 12px;
          line-height: 1.2;
          font-weight: 600;
        }

        .verified-description {
          font-size: 13.5px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 400px;
        }

        .email-box {
          width: 100%;
          background: #FAF6F0;
          border: 1px solid #E8DFD5;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          text-align: left;
        }

        .email-symbol {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--el-burgundy, #520814);
          color: #FAF6F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          flex-shrink: 0;
        }

        .email-info {
          flex: 1;
        }

        .email-label {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #888;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .email-address {
          font-size: 13.5px;
          color: var(--el-burgundy, #520814);
          font-weight: 600;
          margin: 0;
          word-break: break-all;
        }

        .authenticated {
          font-size: 10.5px;
          letter-spacing: 1px;
          color: #166534;
          background: #DCFCE7;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .auth-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #166534;
        }

        .continue-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: var(--el-burgundy, #520814);
          color: #FAF6F0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          margin-bottom: 20px;
        }

        .continue-btn:hover {
          background: #3B040D;
        }

        .security-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #888;
          font-size: 12px;
        }

        .security-text .security-icon {
          color: var(--el-gold, #C49E60);
        }

        @media (max-width: 500px) {
          .verified-card {
            padding: 32px 20px;
          }
          .email-box {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </UserLayout>
  );
}

export default EmailVerified;