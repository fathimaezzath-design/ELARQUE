import React from "react";
import { Mail, ArrowRight, LockKeyhole } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function EmailVerified() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    localStorage.getItem("verifiedEmail") ||
    "swaliha@example.com";

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "Poppins", Arial, sans-serif;
          background: #4a0712;
        }

        .verified-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 20% 35%,
              rgba(255, 255, 255, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 70%,
              rgba(255, 255, 255, 0.05),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #4c1018 0%,
              #650817 45%,
              #42030d 100%
            );

          display: flex;
          flex-direction: column;
          align-items: center;

          padding-top: 0;
          min-height: 100vh;
        }

        /* =========================
           TOP BURGUNDY BAR
        ========================= */

        .top-bar {
          width: 100%;
          height: 40px;
          background: #5b0715;
        }

        /* =========================
           NAVBAR
        ========================= */

        .verified-navbar {
          width: 100%;
          height: 80px;
          background: #f8f2ee;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .navbar-inner {
          width: min(1050px, 90%);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 29px;
          font-weight: 600;
          color: #681421;
          letter-spacing: -1px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 43px;
        }

        .nav-link {
          color: #4b3d3d;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-decoration: none;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.1;
        }

        .nav-icons {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-icon {
          position: relative;
          color: #4e1a21;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .badge {
          position: absolute;
          top: -8px;
          right: -8px;

          width: 15px;
          height: 15px;
          border-radius: 50%;

          background: #7a0719;
          color: white;

          font-size: 9px;
          font-weight: 600;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-icon {
          width: 33px;
          height: 33px;
          border-radius: 50%;
          background: #650817;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* =========================
           MAIN CONTENT
        ========================= */

        .verified-content {
          width: 100%;
          flex: 1;

          display: flex;
          justify-content: center;
          align-items: flex-start;

          padding: 34px 20px 70px;
        }

        .verified-card {
          width: 500px;
          min-height: 665px;

          background: #f8f0ec;

          border-radius: 32px;

          padding: 40px 48px 38px;

          display: flex;
          flex-direction: column;
          align-items: center;

          box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.18);

          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        /* =========================
           ICON
        ========================= */

        .verified-icon-wrapper {
          width: 92px;
          height: 92px;

          border-radius: 50%;

          background: #faf4f0;

          border: 4px solid #d7cabd;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          margin-bottom: 17px;
        }

        .verified-icon {
          width: 68px;
          height: 68px;

          border-radius: 50%;

          background: #690a19;

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .verified-lock {
          position: absolute;

          right: -3px;
          bottom: -2px;

          width: 23px;
          height: 23px;

          border-radius: 50%;

          background: #fffaf4;

          color: #8a681e;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        /* =========================
           TEXT
        ========================= */

        .eyebrow {
          margin: 0 0 13px;

          color: #876a2d;

          font-size: 11px;
          font-weight: 600;

          letter-spacing: 3px;

          text-transform: uppercase;

          text-align: center;
        }

        .verified-title {
          margin: 0;

          color: #670a19;

          font-family: Georgia, "Times New Roman", serif;

          font-size: 36px;
          line-height: 1.12;

          font-weight: 500;

          text-align: center;
        }

        .verified-description {
          margin: 15px 0 30px;

          color: #5d5050;

          font-size: 14px;

          line-height: 1.7;

          text-align: center;

          max-width: 390px;
        }

        /* =========================
           EMAIL BOX
        ========================= */

        .email-box {
          width: 100%;

          min-height: 73px;

          background: #ffffff;

          border-radius: 17px;

          display: flex;
          align-items: center;

          padding: 13px 16px;

          margin-bottom: 35px;

          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .email-symbol {
          width: 42px;
          height: 42px;

          border-radius: 13px;

          background: #fff0f1;

          color: #690a19;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 21px;
          font-weight: 500;

          flex-shrink: 0;
        }

        .email-info {
          flex: 1;

          min-width: 0;

          margin-left: 13px;
        }

        .email-label {
          margin: 0 0 4px;

          color: #786d6b;

          font-size: 10px;

          font-weight: 500;

          letter-spacing: 1px;

          text-transform: uppercase;
        }

        .email-address {
          margin: 0;

          color: #241b1c;

          font-size: 14px;

          font-weight: 600;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .authenticated {
          padding: 6px 11px;

          border-radius: 20px;

          background: #fff5df;

          color: #765716;

          font-size: 9px;

          font-weight: 600;

          letter-spacing: 0.4px;

          white-space: nowrap;
        }

        .auth-dot {
          display: inline-block;

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #9b731e;

          margin-right: 6px;
        }

        /* =========================
           BUTTON
        ========================= */

        .continue-btn {
          width: 100%;

          height: 47px;

          border: none;

          border-radius: 24px;

          background: #700b1c;

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 10px;

          font-size: 12px;

          font-weight: 600;

          letter-spacing: 1.2px;

          cursor: pointer;

          box-shadow:
            0 8px 14px rgba(82, 5, 17, 0.18);

          transition: all 0.2s ease;
        }

        .continue-btn:hover {
          background: #5c0715;
          transform: translateY(-1px);
        }

        /* =========================
           FOOTER SECURITY
        ========================= */

        .security-text {
          margin-top: auto;
          padding-top: 55px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          color: #5c5150;

          font-size: 12px;

          text-align: center;
        }

        .security-icon {
          color: #8b6a25;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 900px) {
          .nav-links {
            gap: 20px;
          }

          .navbar-inner {
            width: 94%;
          }
        }

        @media (max-width: 700px) {
          .verified-navbar {
            height: auto;
            padding: 18px 0;
          }

          .navbar-inner {
            flex-wrap: wrap;
            gap: 18px;
          }

          .nav-links {
            order: 3;
            width: 100%;
            justify-content: center;
          }

          .brand {
            font-size: 25px;
          }

          .verified-content {
            padding: 25px 15px 50px;
          }

          .verified-card {
            width: 100%;
            max-width: 500px;

            padding: 35px 25px;

            border-radius: 25px;
          }

          .verified-title {
            font-size: 31px;
          }

          .email-box {
            align-items: flex-start;
          }

          .authenticated {
            display: none;
          }
        }

        @media (max-width: 430px) {
          .nav-links {
            gap: 13px;
          }

          .nav-link {
            font-size: 9px;
          }

          .verified-card {
            min-height: 600px;
          }

          .verified-title {
            font-size: 28px;
          }

          .verified-description {
            font-size: 13px;
          }
        }
      `}</style>

      <div className="verified-page">

        {/* TOP BAR */}
        <div className="top-bar"></div>

        {/* NAVBAR */}
        <header className="verified-navbar">
          <div className="navbar-inner">

            <div className="brand">
              ELARQUE
            </div>

            <nav className="nav-links">
              <a href="/" className="nav-link">
                MAIN
              </a>

              <a href="#" className="nav-link">
                COLLECTIONS
              </a>

              <a href="#" className="nav-link">
                BEST
                <br />
                SELLERS
              </a>

              <a href="#" className="nav-link">
                CATEGORIES
              </a>

              <a href="#" className="nav-link">
                NEW
                <br />
                ARRIVALS
              </a>
            </nav>

            <div className="nav-icons">

              <div className="nav-icon">
                <span style={{ fontSize: "22px" }}>
                  ♡
                </span>

                <span className="badge">
                  2
                </span>
              </div>

              <div className="nav-icon">
                <span style={{ fontSize: "20px" }}>
                  ♧
                </span>

                <span className="badge">
                  1
                </span>
              </div>

              <div className="profile-icon">
                <span style={{ fontSize: "17px" }}>
                  ♙
                </span>
              </div>

            </div>
          </div>
        </header>

        {/* MAIN */}
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
            <p className="eyebrow">
              ACCOUNT SECURITY PROTOCOL
            </p>

            {/* TITLE */}
            <h1 className="verified-title">
              Email Verified
              <br />
              Successfully
            </h1>

            {/* DESCRIPTION */}
            <p className="verified-description">
              Your patronage credential has been validated
              and committed to your permanent ELARQUE
              atelier dossier.
            </p>

            {/* EMAIL */}
            <div className="email-box">

              <div className="email-symbol">
                @
              </div>

              <div className="email-info">

                <p className="email-label">
                  VERIFIED ADDRESS
                </p>

                <p className="email-address">
                  {email}
                </p>

              </div>

              <div className="authenticated">
                <span className="auth-dot"></span>
                VAULT AUTHENTICATED
              </div>

            </div>

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

              <LockKeyhole
                size={14}
                className="security-icon"
              />

              <span>
                Protected with TLS 256-bit patronage verification
              </span>

            </div>

          </div>

        </main>
      </div>
    </>
  );
}

export default EmailVerified;