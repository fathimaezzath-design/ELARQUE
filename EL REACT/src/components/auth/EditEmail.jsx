import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";

import { sendEmailChangeOTP } from "../../services/authService";

function EditEmail() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your new email address.");
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response =
        await sendEmailChangeOTP(normalizedEmail);

      navigate("/verify-email", {
        state: {
          email: response.data.email,
        },
      });
    } catch (error) {
      console.error(
        "SEND EMAIL OTP ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="edit-email-page">

        {/* TOP STRIP */}
        <div className="top-strip"></div>

        {/* NAVBAR */}
        <header className="edit-navbar">

          <div className="logo">
            ELARQUE
          </div>

          <nav className="nav-links">

            <span>MAIN</span>

            <span>COLLECTIONS</span>

            <span className="two-line">
              BEST
              <br />
              SELLERS
            </span>

            <span>CATEGORIES</span>

            <span className="two-line">
              NEW
              <br />
              ARRIVALS
            </span>

          </nav>

          <div className="nav-icons">

            <div className="nav-heart">
              ♡
              <small>2</small>
            </div>

            <div className="nav-bag">
              ♧
              <small>1</small>
            </div>

            <div className="profile-icon">
              ♙
            </div>

          </div>

        </header>

        {/* MAIN */}
        <main className="edit-main">

          <div className="edit-card">

            {/* ICON */}
            <div className="security-icon-wrapper">

              <div className="security-icon">
                <Mail
                  size={29}
                  strokeWidth={2.2}
                />
              </div>

              <div className="security-badge">
                <LockKeyhole
                  size={13}
                />
              </div>

            </div>

            {/* LABEL */}
            <p className="security-label">
              ACCOUNT SECURITY
            </p>

            {/* TITLE */}
            <h1>
              Change Your Email
            </h1>

            {/* DESCRIPTION */}
            <p className="edit-description">
              Enter your new email address.
              <br />
              We will send a confidential
              verification code to confirm
              the change.
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <div className="email-input-section">

                <label>
                  NEW EMAIL ADDRESS
                </label>

                <div className="email-input-box">

                  <Mail size={19} />

                  <input
                    type="email"
                    value={email}
                    placeholder="Enter your new email"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />

                </div>

                {error && (
                  <p className="email-error">
                    {error}
                  </p>
                )}

              </div>

              {/* SEND BUTTON */}
              <button
                type="submit"
                className="send-button"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "SENDING..."
                    : "SEND VERIFICATION CODE"}
                </span>

                {!loading && (
                  <ArrowRight size={19} />
                )}

              </button>

            </form>

            {/* CANCEL */}
            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/profile")
              }
            >
              CANCEL
            </button>

          </div>

          {/* FOOTER */}
          <div className="edit-footer">
            ELARQUE CONCIERGE SERVICE
            <span>•</span>
            SALONS VENDÔME & MILAN
          </div>

        </main>

      </div>

      <style>{`

        * {
          box-sizing: border-box;
        }

        .edit-email-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 40%,
              #681421 0%,
              #4b0712 48%,
              #38050d 100%
            );

          font-family: "Poppins", sans-serif;
          color: #4a0f19;
        }

        /* TOP STRIP */

        .top-strip {
          height: 42px;
          background: #650817;
        }

        /* NAVBAR */

        .edit-navbar {
          height: 77px;
          background: #eee5e3;

          display: flex;
          align-items: center;

          padding: 0 9.5%;

          gap: 65px;
        }

        .logo {
          color: #68101d;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 29px;
          font-weight: 600;

          white-space: nowrap;
        }

        .nav-links {
          flex: 1;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 45px;

          color: #43383a;

          font-size: 12px;

          letter-spacing: 0.3px;
        }

        .nav-links span {
          white-space: nowrap;
        }

        .two-line {
          line-height: 14px;
        }

        .nav-icons {
          display: flex;
          align-items: center;
          gap: 21px;
        }

        .nav-heart,
        .nav-bag {
          position: relative;

          color: #51151e;

          font-size: 28px;
          line-height: 1;
        }

        .nav-heart small,
        .nav-bag small {
          position: absolute;

          top: -7px;
          right: -8px;

          width: 13px;
          height: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #6b1724;
          color: white;

          font-size: 8px;
        }

        .profile-icon {
          width: 34px;
          height: 34px;

          border-radius: 50%;

          background: #65091a;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;
        }

        /* MAIN */

        .edit-main {
          min-height: calc(100vh - 119px);

          display: flex;
          flex-direction: column;
          align-items: center;

          padding-top: 64px;
          padding-bottom: 50px;
        }

        /* CARD */

        .edit-card {
          width: 540px;

          min-height: 650px;

          background: #f5efec;

          border-radius: 32px;

          padding: 47px 48px 42px;

          text-align: center;

          box-shadow:
            0 20px 45px
            rgba(0, 0, 0, 0.17);
        }

        /* ICON */

        .security-icon-wrapper {
          position: relative;

          width: 66px;
          height: 66px;

          margin: 0 auto 22px;
        }

        .security-icon {
          width: 64px;
          height: 64px;

          border-radius: 50%;

          background: #6b0c1d;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 6px 12px
            rgba(74, 15, 25, 0.25);
        }

        .security-badge {
          position: absolute;

          right: -5px;
          bottom: -4px;

          width: 25px;
          height: 25px;

          border-radius: 50%;

          background: #9a7737;
          color: white;

          border: 2px solid #f5efec;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* LABEL */

        .security-label {
          margin: 0 0 12px;

          color: #866524;

          font-size: 11px;
          font-weight: 600;

          letter-spacing: 3px;
        }

        /* TITLE */

        .edit-card h1 {
          margin: 0;

          color: #65101d;

          font-family:
            "Cormorant Garamond",
            Georgia,
            serif;

          font-size: 40px;

          font-weight: 500;

          line-height: 1.05;
        }

        /* DESCRIPTION */

        .edit-description {
          margin: 17px 0 38px;

          color: #57484a;

          font-size: 14px;

          line-height: 24px;
        }

        /* INPUT */

        .email-input-section {
          text-align: left;

          margin-bottom: 26px;
        }

        .email-input-section label {
          display: block;

          margin-bottom: 9px;

          color: #806d6e;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 1.8px;
        }

        .email-input-box {
          height: 59px;

          background: #fffdfb;

          border: 1px solid #e5dcd8;

          border-radius: 15px;

          display: flex;
          align-items: center;

          padding: 0 18px;

          gap: 12px;

          transition: 0.2s;
        }

        .email-input-box:focus-within {
          border-color: #721020;

          box-shadow:
            0 0 0 3px
            rgba(114, 16, 32, 0.08);
        }

        .email-input-box svg {
          color: #6b0d1c;

          flex-shrink: 0;
        }

        .email-input-box input {
          width: 100%;

          border: none;
          outline: none;

          background: transparent;

          color: #4d111b;

          font-size: 14px;

          font-family: "Poppins", sans-serif;
        }

        .email-input-box input::placeholder {
          color: #aa9d9e;
        }

        /* ERROR */

        .email-error {
          margin: 8px 2px 0;

          color: #c62828;

          font-size: 12px;
        }

        /* SEND BUTTON */

        .send-button {
          width: 100%;

          height: 49px;

          border: none;

          border-radius: 25px;

          background: #69091a;

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 12px;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 1.7px;

          cursor: pointer;

          box-shadow:
            0 7px 13px
            rgba(76, 8, 19, 0.2);

          transition: 0.2s;
        }

        .send-button:hover {
          background: #570715;
        }

        .send-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;
        }

        /* CANCEL */

        .cancel-button {
          width: 100%;

          height: 45px;

          margin-top: 12px;

          border: none;

          border-radius: 24px;

          background: #fffdfb;

          color: #650b1b;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 2px;

          cursor: pointer;
        }

        .cancel-button:hover {
          background: white;
        }

        /* FOOTER */

        .edit-footer {
          margin-top: 29px;

          color: #bd6570;

          font-size: 10px;

          letter-spacing: 1.3px;

          display: flex;

          align-items: center;

          gap: 12px;
        }

        /* RESPONSIVE */

        @media (max-width: 900px) {

          .edit-navbar {
            padding: 0 30px;
            gap: 30px;
          }

          .nav-links {
            gap: 22px;
          }

        }

        @media (max-width: 700px) {

          .top-strip {
            height: 30px;
          }

          .edit-navbar {
            height: auto;

            padding: 18px 20px;

            flex-wrap: wrap;

            justify-content: center;

            gap: 20px;
          }

          .nav-links {
            order: 3;

            width: 100%;

            overflow-x: auto;

            justify-content: flex-start;

            padding-bottom: 5px;
          }

          .edit-main {
            padding: 35px 15px;
          }

          .edit-card {
            width: 100%;

            max-width: 540px;

            padding: 40px 25px;

            border-radius: 25px;
          }

        }

      `}</style>
    </>
  );
}

export default EditEmail;