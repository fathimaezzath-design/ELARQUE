import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import API from "../../services/authService";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken =
    location.state?.resetToken ||
    sessionStorage.getItem("resetToken");

  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Please enter your new password.";
    } else if (password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password =
        "Password must contain at least one number.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password =
        "Password must contain at least one special symbol.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      setErrors({
        server:
          "Your password reset session has expired. Please request a new code.",
      });
      return;
    }

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      setErrors({});

      const response = await API.post("/reset-password", {
        resetToken,
        password,
        confirmPassword,
      });

      console.log(
        "RESET PASSWORD RESPONSE:",
        response.data
      );

      sessionStorage.removeItem("resetToken");

      navigate("/login", {
        state: {
          message:
            "Your password has been updated successfully. Please login.",
        },
      });
    } catch (err) {
      console.log("RESET PASSWORD ERROR:", err);
      console.log("RESPONSE:", err.response);
      console.log(
        "RESPONSE DATA:",
        err.response?.data
      );

      setErrors({
        server:
          err.response?.data?.message ||
          "Unable to update your password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/verify-reset-otp", {
      state: {
        email,
      },
    });
  };

  return (
    <div className="reset-password-page">

      {/* LEFT SIDE */}
      <div className="reset-left">

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
          <p className="edition">
            MONOGRAPH EDITION
          </p>

          <h1>
            The Modern
            <br />
            <i>Frontier.</i>
          </h1>

          <p className="hero-description">
            A bespoke synthesis of European haute couture drape and
            timeless southwestern heritage. Hand-crafted silhouettes
            for the discerning voyager.
          </p>
        </div>

        <div className="bottom-left-content">

          <p className="archive-title">
            <span className="small-dot"></span>
            ARCHIVAL PIECE NO. 042
          </p>

          <p>
            Sculpted wool crepe with hand-cut leather fringe and
            <br />
            cast brass hardware. Crafted inside our Florence and
            <br />
            Santa Fe ateliers.
          </p>

        </div>

        <div className="client-verification">
          <span>CLIENT VERIFICATION</span>
          <strong>Cadence Archive</strong>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="reset-right">

        <div className="reset-card">

          {/* BRAND */}
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

          {/* TITLE */}
          <h1>Create New Password</h1>

          <p className="description">
            Create a strong new password to secure your Elarque
            <br />
            account. Your new password must be different from your
            <br />
            previous one.
          </p>

          <form onSubmit={handleSubmit}>

            {/* NEW PASSWORD */}
            <div className="field-header">

              <label>NEW PASSWORD</label>

              <span>ENTER PASSWORD</span>

            </div>

            <div className="password-input">

              <Lock size={16} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                  }));
                }}
                placeholder="••••••••••"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

            {/* PASSWORD REQUIREMENTS */}
            <div className="strength-bars">

              <span
                className={
                  password.length >= 8
                    ? "active"
                    : ""
                }
              ></span>

              <span
                className={
                  /[A-Z]/.test(password)
                    ? "active"
                    : ""
                }
              ></span>

              <span
                className={
                  /[0-9]/.test(password)
                    ? "active"
                    : ""
                }
              ></span>

              <span
                className={
                  /[!@#$%^&*(),.?":{}|<>]/.test(
                    password
                  )
                    ? "active"
                    : ""
                }
              ></span>

            </div>

            <div className="requirements">

              <p
                className={
                  password.length >= 8
                    ? "valid"
                    : ""
                }
              >
                <span>○</span>
                Min. 8 characters
              </p>

              <p
                className={
                  /[A-Z]/.test(password)
                    ? "valid"
                    : ""
                }
              >
                <span>○</span>
                One uppercase letter
              </p>

              <p
                className={
                  /[0-9]/.test(password)
                    ? "valid"
                    : ""
                }
              >
                <span>○</span>
                One number
              </p>

              <p
                className={
                  /[!@#$%^&*(),.?":{}|<>]/.test(
                    password
                  )
                    ? "valid"
                    : ""
                }
              >
                <span>○</span>
                One special symbol
              </p>

            </div>

            {errors.password && (
              <p className="error-text">
                {errors.password}
              </p>
            )}

            {/* CONFIRM PASSWORD */}
            <div className="field-header confirm-header">

              <label>CONFIRM PASSWORD</label>

            </div>

            <div className="password-input">

              <Lock size={16} />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );

                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: "",
                  }));
                }}
                placeholder="••••••••••"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

            {errors.confirmPassword && (
              <p className="error-text">
                {errors.confirmPassword}
              </p>
            )}

            {/* SERVER ERROR */}
            {errors.server && (
              <p className="error-text server-error">
                {errors.server}
              </p>
            )}

            {/* UPDATE BUTTON */}
            <button
              type="submit"
              className="update-button"
              disabled={loading}
            >
              {loading
                ? "UPDATING..."
                : "UPDATE PASSWORD"}

              <span>→</span>
            </button>

          </form>

          {/* BACK */}
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={14} />
            BACK TO VERIFICATION
          </button>

          {/* PRIVATE SALON */}
          <div className="private-salon">

            <span></span>

            <p>PRIVATE SALON</p>

            <span></span>

          </div>

          {/* SUPPORT */}
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

        .reset-password-page {
          min-height: 100vh;
          display: flex;
          background: #f6f1eb;
          font-family: "Poppins", sans-serif;
        }

        /* LEFT */

        .reset-left {
          width: 58%;
          min-height: 100vh;
          position: relative;

          background:
            linear-gradient(
              to bottom,
              rgba(35, 20, 22, 0.10),
              rgba(60, 20, 30, 0.55)
            ),
            url("/src/assets/images/ResetPassword.png");

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

          background: rgba(40, 30, 25, 0.55);

          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.4px;
        }

        .dot,
        .small-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e6c77d;
          margin-right: 10px;
        }

        .top-right-label {
          position: absolute;
          top: 72px;
          right: 70px;

          display: flex;
          align-items: center;

          gap: 15px;

          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .top-right-label span {
          width: 30px;
          height: 1px;
          background: rgba(255,255,255,0.45);
        }

        .hero-content {
          position: absolute;
          left: 65px;
          bottom: 390px;
        }

        .edition {
          margin-bottom: 18px;

          font-size: 11px;
          letter-spacing: 4px;

          color: #e5c47b;
        }

        .hero-content h1 {
          margin: 0;

          font-family: Georgia, serif;

          font-size: 68px;
          line-height: 0.95;
          font-weight: 400;
        }

        .hero-content h1 i {
          color: #dfc084;
        }

        .hero-description {
          margin-top: 25px;

          max-width: 430px;

          font-size: 14px;
          line-height: 1.7;

          color: rgba(255,255,255,0.85);
        }

        .bottom-left-content {
          position: absolute;
          left: 65px;
          bottom: 50px;
        }

        .archive-title {
          color: #e4c57c;

          font-size: 10px;

          letter-spacing: 1.7px;

          font-weight: 600;
        }

        .bottom-left-content p:last-child {
          color: rgba(255,255,255,0.85);

          font-size: 11px;

          line-height: 1.6;
        }

        .client-verification {
          position: absolute;
          right: 60px;
          bottom: 55px;

          display: flex;
          flex-direction: column;

          gap: 5px;
        }

        .client-verification span {
          color: #c7b5a7;

          font-size: 9px;

          letter-spacing: 2px;
        }

        .client-verification strong {
          font-family: Georgia, serif;

          font-size: 18px;

          font-style: italic;

          font-weight: 400;

          color: #dfc58f;
        }

        /* RIGHT */

        .reset-right {
          width: 42%;
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 35px;
        }

        .reset-card {
          width: 100%;
          max-width: 470px;

          padding: 48px 45px 42px;

          background: #fff;

          border: 1px solid #e8ddd5;

          border-radius: 30px;

          box-shadow:
            0 18px 40px rgba(60,30,20,0.08);

          text-align: center;
        }

        /* BRAND */

        .brand h2 {
          margin: 0;

          color: #741525;

          font-family: Georgia, serif;

          font-size: 26px;

          letter-spacing: 7px;
        }

        .brand-small {
          margin-top: 3px;

          color: #9a7760;

          font-size: 6px;

          letter-spacing: 2px;
        }

        .fashion-text {
          margin: 27px 0 5px;

          color: #80612d;

          font-size: 8px;

          letter-spacing: 3px;

          font-weight: 600;
        }

        .tagline {
          margin: 0;

          color: #93827b;

          font-size: 8px;

          letter-spacing: 1.8px;
        }

        /* TITLE */

        .reset-card h1 {
          margin: 38px 0 10px;

          color: #242020;

          font-family: Georgia, serif;

          font-size: 34px;

          font-weight: 400;
        }

        .description {
          margin: 0 0 32px;

          color: #655a56;

          font-size: 12px;

          line-height: 1.7;
        }

        /* INPUT */

        .field-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-bottom: 8px;
        }

        .field-header label {
          color: #403a38;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 1.8px;
        }

        .field-header span {
          color: #aaa4a1;

          font-size: 9px;

          font-weight: 600;
        }

        .password-input {
          height: 47px;

          display: flex;

          align-items: center;

          gap: 10px;

          padding: 0 14px;

          border: 1px solid #e4d9d2;

          border-radius: 14px;

          background: #fff;
        }

        .password-input svg {
          color: #9b938e;

          flex-shrink: 0;
        }

        .password-input input {
          flex: 1;

          border: none;

          outline: none;

          background: transparent;

          font-size: 14px;

          color: #4a3030;
        }

        .password-input input::placeholder {
          color: #b7b0ac;

          letter-spacing: 3px;
        }

        .password-input button {
          border: none;

          background: transparent;

          padding: 0;

          display: flex;

          cursor: pointer;

          color: #9b938e;
        }

        .strength-bars {
          display: flex;

          gap: 6px;

          margin-top: 13px;
        }

        .strength-bars span {
          flex: 1;

          height: 4px;

          border-radius: 5px;

          background: #e6e1de;
        }

        .strength-bars span.active {
          background: #711426;
        }

        .requirements {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 6px 20px;

          margin-top: 10px;

          text-align: left;
        }

        .requirements p {
          margin: 0;

          color: #77706c;

          font-size: 10px;
        }

        .requirements p span {
          margin-right: 7px;

          color: #b7afaa;
        }

        .requirements p.valid {
          color: #6b1424;
        }

        .requirements p.valid span {
          color: #6b1424;
        }

        .confirm-header {
          margin-top: 26px;
        }

        .error-text {
          margin: 8px 0 0;

          color: #c62828;

          font-size: 10px;

          text-align: left;
        }

        .server-error {
          text-align: center;

          margin-top: 12px;
        }

        /* BUTTON */

        .update-button {
          width: 100%;

          height: 49px;

          margin-top: 25px;

          border: none;

          border-radius: 28px;

          background: #65091e;

          color: white;

          font-size: 11px;

          letter-spacing: 2px;

          font-weight: 600;

          cursor: pointer;

          box-shadow:
            0 10px 20px rgba(101,9,30,0.18);
        }

        .update-button span {
          margin-left: 10px;

          font-size: 17px;
        }

        .update-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;
        }

        /* BACK */

        .back-button {
          margin-top: 28px;

          border: none;

          background: transparent;

          color: #5d5551;

          font-size: 10px;

          letter-spacing: 1.5px;

          cursor: pointer;

          display: inline-flex;

          align-items: center;

          gap: 7px;
        }

        /* PRIVATE SALON */

        .private-salon {
          display: flex;

          align-items: center;

          gap: 15px;

          margin-top: 32px;
        }

        .private-salon span {
          flex: 1;

          height: 1px;

          background: #e9e1dc;
        }

        .private-salon p {
          margin: 0;

          color: #9b8d86;

          font-size: 8px;

          letter-spacing: 2px;
        }

        /* SUPPORT */

        .support-box {
          margin-top: 24px;

          padding: 17px;

          border: 1px solid #e9ded6;

          border-radius: 15px;

          background: #faf7f3;
        }

        .support-box p {
          margin: 0 0 7px;

          color: #655c58;

          font-size: 10px;
        }

        .support-box strong {
          color: #6a1426;

          font-size: 10px;

          letter-spacing: 1.2px;
        }

        /* RESPONSIVE */

        @media (max-width: 1000px) {

          .reset-left {
            width: 50%;
          }

          .reset-right {
            width: 50%;

            padding: 20px;
          }

          .hero-content h1 {
            font-size: 50px;
          }

          .reset-card {
            padding: 38px 30px;
          }

        }

        @media (max-width: 750px) {

          .reset-left {
            display: none;
          }

          .reset-right {
            width: 100%;

            padding: 20px;
          }

          .reset-card {
            max-width: 480px;
          }

        }

      `}</style>
    </div>
  );
}

export default ResetPassword;