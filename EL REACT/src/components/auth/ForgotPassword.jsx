import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import API from "../../services/authService";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setServerError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      console.log(response.data);

      navigate("/verify-reset-otp", {
        state: {
          email: email.trim().toLowerCase(),
        },
      });
    } catch (err) {
      console.log(err);

      setServerError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="forgot-page">

        {/* ================= LEFT SIDE ================= */}

        <div className="forgot-left">

          <div className="left-top">

            <div className="atelier-badge">
              <span></span>
              ELARQUE ATELIER N° 04
            </div>

            <div className="left-location">
              PARIS — SANTA FE
              <span className="location-line"></span>
              FW 2025
            </div>

          </div>

          <div className="left-content">

            <p className="edition">
              MONOGRAPH EDITION
            </p>

            <h1>
              The Modern
              <br />
              <span>Frontier.</span>
            </h1>

          </div>

          <div className="left-bottom">

            <div className="archive-info">

              <p className="archive-title">
                <span></span>
                ARCHIVAL PIECE NO. 042
              </p>

              <p>
                Sculpted wool crepe with hand-cut leather fringe and cast brass
                hardware.
                <br />
                Crafted inside our Florence and Santa Fe ateliers.
              </p>

            </div>

            <div className="client-verification">

              <p>
                CLIENT VERIFICATION
              </p>

              <span>
                Cadence Archive
              </span>

            </div>

          </div>

        </div>


        {/* ================= RIGHT SIDE ================= */}

        <div className="forgot-right">

          {/* TOP HEADER */}

          <div className="catalog-header">

            <div className="catalog-title">
              <ArrowLeft size={15} />
              <span>ATELIER CATALOG</span>
            </div>

            <div className="concierge">
              <span></span>
              CONCIERGE ONLINE
            </div>

          </div>


          {/* CARD */}

          <div className="forgot-card">

            {/* BRAND */}

            <div className="brand-section">

              <div className="brand-name">
                ELARQUE
              </div>

              <div className="brand-subtitle">
                ATELIER • PARIS • DALLAS
              </div>

              <div className="brand-fashion">
                LUXURY WESTERN FASHION
              </div>

              <div className="brand-tagline">
                TIMELESS ELEGANCE • MODERN CONFIDENCE
              </div>

            </div>


            {/* HEADING */}

            <div className="forgot-heading">

              <h2>
                Reset Your
                <br />
                Password
              </h2>

              <p>
                Enter your email to receive a secure
                <br />
                verification code and continue your Elarque
                <br />
                fashion journey.
              </p>

            </div>


            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <label className="forgot-label">
                REGISTERED EMAIL ADDRESS
              </label>

              <div
                className={`forgot-input ${
                  error ? "input-error" : ""
                }`}
              >

                <Mail size={18} />

                <input
                  type="email"
                  placeholder="e.g. eleanor@vanderbilt.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setServerError("");
                  }}
                />

              </div>


              {/* VALIDATION ERROR */}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}


              {/* BACKEND ERROR */}

              {serverError && (
                <p className="error-message">
                  {serverError}
                </p>
              )}


              {/* SEND BUTTON */}

              <button
                type="submit"
                className="verification-btn"
                disabled={loading}
              >

                {loading ? (
                  "SENDING..."
                ) : (
                  <>
                    SEND VERIFICATION CODE
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>


            {/* BACK TO LOGIN */}

            <button
              type="button"
              className="back-login"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft size={14} />
              BACK TO LOGIN
            </button>


            

          </div>


          {/* FOOTER */}

          <div className="forgot-footer">

            <div className="footer-copy">
              © 2025
              <br />
              ELARQUE
              <br />
              ATELIER
              <br />
              COMPAGNIE.
              <br />
              ALL RIGHTS
              <br />
              RESERVED.
            </div>

            <div>
              CLIENT
              <br />
              CONFIDENTIALITY
            </div>

            <div>
              SECURITY
              <br />
              PROTOCOL
            </div>

            <div>
              BESPOKE
              <br />
              INQUIRIES
            </div>

          </div>

        </div>

      </div>


      {/* ================= CSS ================= */}

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Poppins:wght@300;400;500;600&display=swap'
        );

        * {
          box-sizing: border-box;
        }

        .forgot-page {
          width: 100%;
          min-height: 100vh;

          display: flex;

          background: #f5eeea;

          font-family: "Poppins", sans-serif;
        }


        /* =====================================
           LEFT SIDE
        ===================================== */

        .forgot-left {
          width: 58.5%;
          min-height: 100vh;

          position: relative;

          overflow: hidden;

          background:
            linear-gradient(
              to bottom,
              rgba(70, 30, 30, 0.02),
              rgba(70, 20, 25, 0.72)
            ),
            url("/src/assets/images/ForgotPassword.png");

          background-size: cover;
          background-position: center;

          color: white;
        }


        /* TOP */

        .left-top {
          position: absolute;

          top: 68px;
          left: 65px;
          right: 65px;

          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .atelier-badge {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px 18px;

          border-radius: 30px;

          background: rgba(255,255,255,0.13);

          font-size: 11px;
          font-weight: 500;

          letter-spacing: 1.4px;
        }

        .atelier-badge span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #e7c878;
        }


        .left-location {
          display: flex;
          align-items: center;

          gap: 16px;

          font-size: 11px;

          letter-spacing: 1.5px;
        }

        .location-line {
          width: 32px;
          height: 1px;

          background: rgba(255,255,255,0.6);
        }


        /* LEFT HEADING */

        .left-content {
          position: absolute;

          left: 72px;
          bottom: 46%;

          transform: translateY(50%);
        }

        .edition {
          margin: 0 0 15px;

          font-size: 12px;

          letter-spacing: 4px;

          color: #ead18b;
        }

        .left-content h1 {
          margin: 0;

          font-family: "Cormorant Garamond", serif;

          font-size: clamp(65px, 6vw, 100px);

          line-height: 0.88;

          font-weight: 500;

          letter-spacing: -3px;
        }

        .left-content h1 span {
          color: #e8ca7a;

          font-style: italic;
        }


        /* LEFT BOTTOM */

        .left-bottom {
          position: absolute;

          bottom: 62px;

          left: 65px;
          right: 65px;

          display: flex;

          justify-content: space-between;

          align-items: flex-end;
        }

        .archive-title {
          display: flex;
          align-items: center;

          gap: 9px;

          margin: 0 0 10px;

          font-size: 11px;

          letter-spacing: 1.4px;

          color: #e7cf8b;

          font-weight: 600;
        }

        .archive-title span {
          width: 7px;
          height: 7px;

          border: 1px solid #e7cf8b;

          border-radius: 50%;
        }

        .archive-info p:last-child {
          margin: 0;

          font-size: 12px;

          line-height: 1.8;

          color: rgba(255,255,255,0.9);
        }

        .client-verification {
          text-align: left;
        }

        .client-verification p {
          margin: 0 0 4px;

          font-size: 10px;

          letter-spacing: 2px;

          color: rgba(255,255,255,0.65);
        }

        .client-verification span {
          font-family: "Cormorant Garamond", serif;

          font-size: 25px;

          font-style: italic;
        }


        /* =====================================
           RIGHT SIDE
        ===================================== */

        .forgot-right {
          width: 41.5%;
          min-height: 100vh;

          background: #f6efeb;

          padding: 65px 4.8% 30px;

          position: relative;
        }


        /* HEADER */

        .catalog-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-bottom: 3px;

          color: #4d3d3d;

          font-size: 11px;

          letter-spacing: 1.1px;
        }

        .catalog-title {
          display: flex;

          align-items: center;

          gap: 8px;
        }

        .concierge {
          display: flex;

          align-items: center;

          gap: 8px;

          font-weight: 500;
        }

        .concierge span {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #399b76;
        }


        /* =====================================
           CARD
        ===================================== */

        .forgot-card {
          width: 100%;

          background: #fff;

          border-radius: 30px;

          padding: 56px 48px 47px;

          box-shadow:
            0 15px 40px rgba(80,40,40,0.06);
        }


        /* BRAND */

        .brand-section {
          text-align: center;
        }

        .brand-name {
          font-family: "Cormorant Garamond", serif;

          color: #7b2632;

          font-size: 23px;

          line-height: 1;

          letter-spacing: 5px;

          font-weight: 600;
        }

        .brand-subtitle {
          margin-top: 4px;

          color: #c1a078;

          font-size: 6px;

          letter-spacing: 2px;
        }

        .brand-fashion {
          margin-top: 23px;

          color: #96703c;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 3px;
        }

        .brand-tagline {
          margin-top: 9px;

          color: #927e7e;

          font-size: 9px;

          letter-spacing: 2px;
        }


        /* HEADING */

        .forgot-heading {
          text-align: center;

          margin-top: 47px;

          margin-bottom: 34px;
        }

        .forgot-heading h2 {
          margin: 0;

          font-family: "Cormorant Garamond", serif;

          color: #610b18;

          font-size: 39px;

          line-height: 1.05;

          font-weight: 500;
        }

        .forgot-heading p {
          margin: 17px 0 0;

          color: #554646;

          font-size: 13px;

          line-height: 1.8;
        }


        /* FORM */

        .forgot-label {
          display: block;

          margin-bottom: 11px;

          color: #251f1f;

          font-size: 11px;

          font-weight: 500;

          letter-spacing: 0.3px;
        }

        .forgot-input {
          width: 100%;

          height: 58px;

          display: flex;

          align-items: center;

          gap: 13px;

          padding: 0 17px;

          border: 1px solid #eee9e6;

          border-radius: 14px;

          background: #fff;

          transition: 0.2s ease;
        }

        .forgot-input svg {
          color: #927b7b;

          flex-shrink: 0;
        }

        .forgot-input:focus-within {
          border-color: #7b2632;

          box-shadow:
            0 0 0 3px rgba(123,38,50,0.05);
        }

        .forgot-input input {
          width: 100%;

          border: none;

          outline: none;

          background: transparent;

          color: #332525;

          font-family: "Poppins", sans-serif;

          font-size: 13px;
        }

        .forgot-input input::placeholder {
          color: #b8aaaa;
        }

        .input-error {
          border-color: #c62828;
        }

        .error-message {
          margin: 7px 0 0;

          color: #c62828;

          font-size: 11px;
        }


        /* BUTTON */

        .verification-btn {
          width: 100%;

          height: 51px;

          margin-top: 22px;

          border: none;

          border-radius: 28px;

          background: #690b19;

          color: white;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;

          font-family: "Poppins", sans-serif;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 1.3px;

          cursor: pointer;

          box-shadow:
            0 12px 20px rgba(105,11,25,0.16);

          transition: 0.2s ease;
        }

        .verification-btn:hover {
          background: #560814;

          transform: translateY(-1px);
        }

        .verification-btn:disabled {
          opacity: 0.65;

          cursor: not-allowed;

          transform: none;
        }


        /* BACK LOGIN */

        .back-login {
          margin: 27px auto 0;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          border: none;

          background: transparent;

          color: #650b18;

          font-family: "Poppins", sans-serif;

          font-size: 10px;

          font-weight: 500;

          cursor: pointer;

          letter-spacing: 0.5px;
        }


        /* DIVIDER */

        .private-divider {
          margin-top: 32px;

          display: flex;

          align-items: center;

          gap: 15px;
        }

        .private-divider span {
          height: 1px;

          flex: 1;

          background: #e7e0dc;
        }

        .private-divider p {
          margin: 0;

          color: #958484;

          font-size: 9px;

          font-weight: 500;

          letter-spacing: 1px;
        }


        /* SUPPORT */

        .support-box {
          margin-top: 27px;

          padding: 17px;

          border-radius: 13px;

          background: #f8f4f0;

          text-align: center;
        }

        .support-box p {
          margin: 0 0 6px;

          color: #594b4b;

          font-size: 10px;
        }

        .support-box button {
          display: inline-flex;

          align-items: center;

          gap: 6px;

          border: none;

          background: transparent;

          color: #690b19;

          font-family: "Poppins", sans-serif;

          font-size: 10px;

          font-weight: 600;

          cursor: pointer;
        }


        /* =====================================
           FOOTER
        ===================================== */

        .forgot-footer {
          margin-top: 24px;

          display: grid;

          grid-template-columns:
            1.5fr 1fr 1fr 1fr;

          gap: 20px;

          color: #857575;

          font-size: 9px;

          line-height: 1.35;

          letter-spacing: 0.2px;
        }

        .footer-copy {
          line-height: 1.25;
        }


        /* =====================================
           RESPONSIVE
        ===================================== */

        @media (max-width: 1000px) {

          .forgot-left {
            width: 50%;
          }

          .forgot-right {
            width: 50%;

            padding: 45px 25px 25px;
          }

          .forgot-card {
            padding: 45px 30px;
          }

          .left-top {
            left: 30px;
            right: 30px;
          }

          .left-content {
            left: 35px;
          }

          .left-bottom {
            left: 30px;
            right: 30px;
          }

        }


        @media (max-width: 768px) {

          .forgot-page {
            display: block;
          }

          .forgot-left {
            display: none;
          }

          .forgot-right {
            width: 100%;

            min-height: 100vh;

            padding: 25px 18px;
          }

          .forgot-card {
            padding: 40px 25px;
          }

          .forgot-footer {
            padding-bottom: 20px;
          }

        }

      `}</style>
    </>
  );
}

export default ForgotPassword;