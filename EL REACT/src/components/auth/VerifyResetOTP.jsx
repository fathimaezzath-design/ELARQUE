import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import API from "../../services/authService";

function VerifyResetOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);

  const inputRefs = useRef([]);

  // If email is not available
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP input
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);
    setError("");

    // Move to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste 6 digit OTP
  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedData) return;

    const newOtp = ["", "", "", "", "", ""];

    pastedData.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);
    setError("");

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/verify-reset-otp", {
        email,
        otp: enteredOtp,
      });

      console.log("VERIFY RESET OTP RESPONSE:", response.data);

      // Save reset token temporarily
      sessionStorage.setItem(
        "resetToken",
        response.data.resetToken
      );

      // Move to reset password page
      navigate("/reset-password", {
        state: {
          email,
          resetToken: response.data.resetToken,
        },
      });
    } catch (err) {
      console.log("VERIFY RESET OTP ERROR:", err);
      console.log("RESPONSE:", err.response);
      console.log("RESPONSE DATA:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Invalid verification code. Please try again."
      );

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timer > 0) return;

    try {
      setError("");
      setLoading(true);

      await API.post("/resend-reset-otp", {
        email,
      });

      setOtp(["", "", "", "", "", ""]);
      setTimer(45);

      inputRefs.current[0]?.focus();
    } catch (err) {
      console.log("RESEND RESET OTP ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to resend the verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    return `00:${seconds.toString().padStart(2, "0")}`;
  };

  if (!email) {
    return null;
  }

  return (
    <div className="verify-reset-page">

      {/* LEFT SIDE */}
      <div className="verify-reset-left">

        <div className="top-left-label">
          <span className="dot"></span>
          ELARQUE ATELIER N° 04
        </div>

        <div className="top-right-label">
          PARIS — SANTA FE
          <span></span>
          FW 2025
        </div>

        <div className="hero-content">
          <p className="edition">MONOGRAPH EDITION</p>

          <h1>
            The Modern
            <br />
            <i>Frontier.</i>
          </h1>
        </div>

        <div className="bottom-left-content">
          <p className="archive-title">
            <span className="small-dot"></span>
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
          <span>CLIENT VERIFICATION</span>
          <strong>Cadence Archive</strong>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="verify-reset-right">

        <div className="verify-card">

          <div className="brand">
            <h2>ELARQUE</h2>

            <div className="brand-small">
              ATELIER • PARIS • DALLAS
            </div>
          </div>

          <p className="fashion-text">
            LUXURY WESTERN FASHION
          </p>

          <p className="tagline">
            TIMELESS ELEGANCE • MODERN CONFIDENCE
          </p>

          <h1>Verify Your Code</h1>

          <p className="description">
            Enter the 6-digit verification code sent to
            <br />
            <strong>{email}</strong> to continue resetting
            <br />
            your password.
          </p>

          <form onSubmit={handleVerify}>

            <label className="security-label">
              ENTER SECURITY CODE
            </label>

            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) =>
                    handleChange(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  onPaste={handlePaste}
                  className={
                    digit
                      ? "otp-input filled"
                      : "otp-input"
                  }
                />
              ))}
            </div>

            {error && (
              <p className="verify-error">
                {error}
              </p>
            )}

            <div className="resend-row">

              <div className="timer">
                <Clock size={14} />
                <span>
                  Resend code in{" "}
                  <strong>{formatTime(timer)}</strong>
                </span>
              </div>

              <span className="separator">•</span>

              <button
                type="button"
                className={
                  timer === 0
                    ? "resend-button active"
                    : "resend-button"
                }
                onClick={handleResend}
                disabled={timer > 0 || loading}
              >
                RESEND CODE
              </button>

            </div>

            <button
              type="submit"
              className="verify-button"
              disabled={loading}
            >
              {loading ? "VERIFYING..." : "VERIFY CODE"}
              <span>→</span>
            </button>

          </form>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/forgot-password")}
          >
            <ArrowLeft size={14} />
            BACK TO FORGOT PASSWORD
          </button>

          <div className="private-salon">
            <span></span>
            <p>PRIVATE SALON</p>
            <span></span>
          </div>

          <div className="support-box">
            <p>
              Need assistance accessing your private vault?
            </p>

            <strong>
              CONTACT CONCIERGE SUPPORT →
            </strong>
          </div>

        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .verify-reset-page {
          min-height: 100vh;
          display: flex;
          background: #f6f1eb;
          font-family: "Poppins", sans-serif;
        }

        /* LEFT */

        .verify-reset-left {
          width: 58%;
          min-height: 100vh;
          position: relative;
          background:
            linear-gradient(
              to bottom,
              rgba(40, 16, 8, 0.1),
              rgba(65, 14, 25, 0.75)
            ),
            url("/src/assets/images/VerifyResetOTP.png");

          background-size: cover;
          background-position: center;
          color: white;
          overflow: hidden;
        }

        .top-left-label {
          position: absolute;
          top: 65px;
          left: 65px;
          padding: 10px 18px;
          border-radius: 20px;
          background: rgba(40, 30, 25, 0.65);
          backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.4px;
        }

        .dot,
        .small-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f1d28d;
          margin-right: 10px;
        }

        .top-right-label {
          position: absolute;
          top: 72px;
          right: 70px;
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.5px;
        }

        .top-right-label span {
          width: 35px;
          height: 1px;
          background: rgba(255,255,255,0.5);
        }

        .hero-content {
          position: absolute;
          left: 70px;
          bottom: 430px;
        }

        .edition {
          font-size: 11px;
          letter-spacing: 4px;
          color: #f2d49a;
          margin-bottom: 15px;
        }

        .hero-content h1 {
          font-family: Georgia, serif;
          font-size: 68px;
          line-height: 0.95;
          font-weight: 400;
          margin: 0;
        }

        .hero-content h1 i {
          color: #e5bf76;
        }

        .bottom-left-content {
          position: absolute;
          bottom: 55px;
          left: 65px;
        }

        .archive-title {
          font-size: 11px;
          letter-spacing: 1.3px;
          color: #f0d28e;
          font-weight: 600;
        }

        .bottom-left-content p:last-child {
          font-size: 12px;
          line-height: 1.8;
          color: rgba(255,255,255,0.9);
        }

        .client-verification {
          position: absolute;
          right: 60px;
          bottom: 55px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .client-verification span {
          font-size: 9px;
          letter-spacing: 2px;
          color: #d8c2a7;
        }

        .client-verification strong {
          font-family: Georgia, serif;
          font-size: 20px;
          font-style: italic;
          font-weight: 400;
        }

        /* RIGHT */

        .verify-reset-right {
          width: 42%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .verify-card {
          width: 100%;
          max-width: 410px;
          background: #fff;
          border-radius: 28px;
          padding: 55px 48px 48px;
          box-shadow: 0 15px 40px rgba(60, 30, 20, 0.08);
          text-align: center;
        }

        .brand h2 {
          margin: 0;
          color: #741525;
          font-family: Georgia, serif;
          font-size: 24px;
          letter-spacing: 6px;
        }

        .brand-small {
          margin-top: 2px;
          font-size: 6px;
          letter-spacing: 2px;
          color: #9c7954;
        }

        .fashion-text {
          margin: 32px 0 6px;
          color: #76501e;
          font-size: 9px;
          letter-spacing: 3px;
          font-weight: 600;
        }

        .tagline {
          margin: 0;
          color: #917e76;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .verify-card h1 {
          margin: 48px 0 12px;
          font-family: Georgia, serif;
          color: #691025;
          font-size: 38px;
          font-weight: 400;
        }

        .description {
          color: #5f5050;
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 38px;
        }

        .description strong {
          color: #6d1726;
        }

        .security-label {
          display: block;
          color: #443838;
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .otp-container {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .otp-input {
          width: 58px;
          height: 62px;
          border: 1px solid #eadfdb;
          border-radius: 16px;
          outline: none;
          text-align: center;
          font-size: 24px;
          color: #641023;
          font-weight: 600;
          background: #fff;
          transition: 0.2s;
        }

        .otp-input:focus {
          border: 2px solid #741525;
          box-shadow: 0 0 0 3px rgba(116, 21, 37, 0.06);
        }

        .otp-input.filled {
          border-color: #741525;
        }

        .verify-error {
          margin: 12px 0 0;
          color: #c62828;
          font-size: 11px;
        }

        .resend-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 10px;
        }

        .timer {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #655454;
        }

        .timer strong {
          color: #641023;
        }

        .separator {
          color: #b8aaa4;
        }

        .resend-button {
          border: none;
          background: transparent;
          color: #aaa09b;
          font-size: 10px;
          font-weight: 700;
          text-decoration: underline;
          cursor: not-allowed;
          padding: 0;
        }

        .resend-button.active {
          color: #691025;
          cursor: pointer;
        }

        .verify-button {
          margin-top: 27px;
          width: 100%;
          height: 49px;
          border: none;
          border-radius: 30px;
          background: #65091e;
          color: white;
          font-size: 12px;
          letter-spacing: 1px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(101, 9, 30, 0.18);
        }

        .verify-button span {
          margin-left: 10px;
          font-size: 18px;
        }

        .verify-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .back-button {
          margin-top: 34px;
          border: none;
          background: transparent;
          color: #651025;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .private-salon {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 35px;
        }

        .private-salon span {
          flex: 1;
          height: 1px;
          background: #e8e0db;
        }

        .private-salon p {
          margin: 0;
          color: #9b8982;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 600;
        }

        .support-box {
          margin-top: 28px;
          padding: 18px;
          border-radius: 14px;
          background: #f8f4ef;
        }

        .support-box p {
          margin: 0 0 6px;
          color: #665a56;
          font-size: 10px;
        }

        .support-box strong {
          color: #651025;
          font-size: 10px;
        }

        @media (max-width: 1000px) {
          .verify-reset-left {
            width: 50%;
          }

          .verify-reset-right {
            width: 50%;
            padding: 25px;
          }

          .hero-content h1 {
            font-size: 52px;
          }

          .otp-input {
            width: 45px;
            height: 52px;
          }
        }

        @media (max-width: 750px) {
          .verify-reset-left {
            display: none;
          }

          .verify-reset-right {
            width: 100%;
            padding: 20px;
          }

          .verify-card {
            max-width: 450px;
          }
        }
      `}</style>
    </div>
  );
}

export default VerifyResetOTP;