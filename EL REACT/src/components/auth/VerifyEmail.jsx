import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
  LockKeyhole,
  Pencil,
  ArrowRight,
} from "lucide-react";

import {
  verifyEmailChangeOTP,
  sendEmailChangeOTP,
} from "../../services/authService";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(120);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/profile");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pasted
      .split("")
      .forEach((digit, index) => {
        newOtp[index] = digit;
      });

    setOtp(newOtp);
    setError("");

    inputRefs.current[
      Math.min(pasted.length, 5)
    ]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError(
        "Please enter the complete 6-digit code."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await verifyEmailChangeOTP(otpValue);

      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            email,
          })
        );
      } catch {
        // Fallback if parsing fails
      }

      navigate("/email-verified", {
        state: {
          email,
        },
      });
    } catch (error) {
      console.error(
        "VERIFY EMAIL ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Invalid verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) {
      return;
    }

    try {
      setResending(true);
      setError("");

      await sendEmailChangeOTP(email);

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setTimer(120);

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(
        "RESEND EMAIL ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to resend verification code."
      );
    } finally {
      setResending(false);
    }
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);

    const seconds = timer % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  if (!email) {
    return null;
  }

  return (
    <>
      <div className="verify-email-page">

        {/* TOP STRIP */}
        <div className="top-strip"></div>

        {/* NAVBAR */}
        <header className="verify-navbar">

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
        <main className="verify-main">

          <div className="verify-card">

            {/* ICON */}
            <div className="security-icon-wrapper">

              <div className="security-icon">
                <Mail
                  size={29}
                  strokeWidth={2.2}
                />
              </div>

              <div className="security-badge">
                <LockKeyhole size={13} />
              </div>

            </div>

            <p className="security-label">
              ACCOUNT SECURITY
            </p>

            <h1>
              Verify Your New Email
            </h1>

            <p className="verify-description">
              We have dispatched a confidential
              6-digit credential to
              <br />
              your nominated address. Input the
              sequence below to
              <br />
              re-anchor your patron dossier.
            </p>

            {/* EMAIL */}
            <div className="email-display">

              <div className="email-symbol">
                @
              </div>

              <div className="email-info">

                <span>
                  NEW EMAIL
                </span>

                <strong>
                  {email}
                </strong>

              </div>

              <button
                type="button"
                className="edit-email"
                onClick={() =>
                  navigate("/edit-email")
                }
              >
                EDIT
                <Pencil size={13} />
              </button>

            </div>

            <form onSubmit={handleVerify}>

              {/* OTP BOXES */}
              <div className="otp-container">

                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] =
                        element;
                    }}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(
                        e,
                        index
                      )
                    }
                    onPaste={handlePaste}
                  />
                ))}

              </div>

              {/* TIMER */}
              <div className="security-timer">

                <span>
                  ⌛
                </span>

                Security window valid for:

                <strong>
                  {formatTimer()}
                </strong>

              </div>

              {error && (
                <p className="otp-error">
                  {error}
                </p>
              )}

              {/* RESEND */}
              <div className="resend-section">

                <span>
                  Did not receive the cipher?
                </span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={
                    timer > 0 ||
                    resending
                  }
                >
                  {resending
                    ? "Sending..."
                    : "Resend Code"}
                </button>

                {timer > 0 && (
                  <span className="resend-time">
                    (Available in {timer}s)
                  </span>
                )}

              </div>

              {/* VERIFY */}
              <button
                type="submit"
                className="verify-button"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "VERIFYING..."
                    : "VERIFY EMAIL"}
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
          <div className="verify-footer">

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

        .verify-email-page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 50% 40%,
              #681421 0%,
              #4b0712 48%,
              #38050d 100%
            );

          font-family:
            "Poppins",
            sans-serif;
        }

        /* TOP */

        .top-strip {
          height: 42px;
          background: #650817;
        }

        /* NAVBAR */

        .verify-navbar {
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

        .verify-main {
          min-height:
            calc(100vh - 119px);

          display: flex;
          flex-direction: column;

          align-items: center;

          padding-top: 64px;
          padding-bottom: 55px;
        }

        /* CARD */

        .verify-card {
          width: 540px;

          min-height: 738px;

          background: #f5efec;

          border-radius: 32px;

          padding: 48px;

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

          margin:
            0 auto 22px;
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

        .verify-card h1 {
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

        .verify-description {
          margin:
            17px 0 34px;

          color: #57484a;

          font-size: 14px;

          line-height: 24px;
        }

        /* EMAIL */

        .email-display {
          width: 100%;

          min-height: 80px;

          background: #fbf9f7;

          border-radius: 17px;

          display: flex;

          align-items: center;

          padding: 14px 18px;

          text-align: left;

          margin-bottom: 31px;
        }

        .email-symbol {
          width: 40px;
          height: 40px;

          border-radius: 11px;

          background: #eee9e5;

          display: flex;

          align-items: center;
          justify-content: center;

          color: #650b1b;

          font-size: 21px;

          margin-right: 14px;
        }

        .email-info {
          flex: 1;

          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .email-info span {
          color: #8c7a79;

          font-size: 9px;

          letter-spacing: 2px;

          margin-bottom: 5px;
        }

        .email-info strong {
          color: #4d111b;

          font-size: 14px;

          font-weight: 600;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        /* EDIT */

        .edit-email {
          border: none;

          background: #f2efed;

          color: #67111e;

          border-radius: 10px;

          padding: 7px 12px;

          display: flex;
          align-items: center;

          gap: 5px;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 1px;

          cursor: pointer;
        }

        /* OTP */

        .otp-container {
          display: flex;

          justify-content: space-between;

          gap: 12px;

          margin-bottom: 17px;
        }

        .otp-box {
          width: 57px;
          height: 57px;

          border: 1px solid transparent;

          border-radius: 15px;

          background: #fff;

          outline: none;

          text-align: center;

          font-size: 21px;

          color: #68101d;

          box-shadow:
            0 1px 3px
            rgba(0, 0, 0, 0.02);

          transition: 0.2s;
        }

        .otp-box:focus {
          border:
            2px solid #67101c;
        }

        /* TIMER */

        .security-timer {
          display: flex;

          justify-content: center;
          align-items: center;

          gap: 5px;

          color: #625557;

          font-size: 10px;

          letter-spacing: 1.3px;

          margin-bottom: 26px;
        }

        .security-timer strong {
          color: #86652b;
        }

        /* ERROR */

        .otp-error {
          color: #c62828;

          font-size: 12px;

          margin:
            -12px 0 15px;
        }

        /* RESEND */

        .resend-section {
          display: flex;

          justify-content: center;
          align-items: center;

          flex-wrap: wrap;

          gap: 5px;

          color: #5b4e50;

          font-size: 12px;

          margin-bottom: 32px;
        }

        .resend-section button {
          border: none;

          background: transparent;

          padding: 0;

          color: #6b0d1c;

          font-weight: 600;

          text-decoration: underline;

          cursor: pointer;

          font-size: 12px;
        }

        .resend-section button:disabled {
          cursor: default;
        }

        .resend-time {
          color: #8e7d7e;
        }

        /* VERIFY BUTTON */

        .verify-button {
          width: 100%;

          height: 48px;

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

          letter-spacing: 2px;

          cursor: pointer;

          box-shadow:
            0 7px 13px
            rgba(76, 8, 19, 0.2);
        }

        .verify-button:hover {
          background: #570715;
        }

        .verify-button:disabled {
          opacity: 0.65;

          cursor: not-allowed;
        }

        /* CANCEL */

        .cancel-button {
          width: 100%;

          height: 44px;

          border: none;

          border-radius: 23px;

          background: #fffdfb;

          color: #650b1b;

          margin-top: 12px;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 2px;

          cursor: pointer;
        }

        /* FOOTER */

        .verify-footer {
          margin-top: 30px;

          color: #bd6570;

          font-size: 10px;

          letter-spacing: 1.3px;

          display: flex;

          align-items: center;

          gap: 12px;
        }

        /* RESPONSIVE */

        @media (max-width: 900px) {

          .verify-navbar {
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

          .verify-navbar {
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
          }

          .verify-main {
            padding:
              35px 15px;
          }

          .verify-card {
            width: 100%;

            max-width: 540px;

            padding: 40px 25px;

            border-radius: 25px;
          }

          .verify-card h1 {
            font-size: 33px;
          }

        }

        @media (max-width: 480px) {

          .otp-container {
            gap: 7px;
          }

          .otp-box {
            width: 45px;
            height: 52px;
          }

          .email-info strong {
            font-size: 12px;
          }

          .email-display {
            padding: 12px;
          }

        }

      `}</style>
    </>
  );
}

export default VerifyEmail;