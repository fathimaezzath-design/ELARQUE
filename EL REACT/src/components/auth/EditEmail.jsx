import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { sendEmailChangeOTP, getProfile } from "../../services/authService";
import UserLayout from "../../layouts/UserLayout";

function EditEmail() {
  const navigate = useNavigate();

  const [currentEmail, setCurrentEmail] = useState("");
  const [hasPassword, setHasPassword] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setPageLoading(true);
        const { data } = await getProfile();
        if (data?.user) {
          setCurrentEmail(data.user.email || "");
          setHasPassword(data.user.hasPassword !== false);
          setIsGoogleUser(Boolean(data.user.isGoogleUser || (!data.user.hasPassword && data.user.googleId)));
        }
      } catch (err) {
        console.error("Failed to load user profile in EditEmail:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const validate = () => {
    const errs = {};
    const normalizedNew = newEmail.trim().toLowerCase();

    if (!normalizedNew) {
      errs.newEmail = "Please enter your new email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNew)) {
      errs.newEmail = "Please enter a valid email address.";
    } else if (currentEmail && normalizedNew === currentEmail.toLowerCase()) {
      errs.newEmail = "New email cannot be the same as your current email.";
    }

    if (hasPassword && !currentPassword) {
      errs.currentPassword = "Current password is required to change your email.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) {
      return;
    }

    const normalizedNew = newEmail.trim().toLowerCase();

    try {
      setLoading(true);
      await sendEmailChangeOTP(normalizedNew, currentPassword);

      navigate("/verify-email", {
        state: {
          email: normalizedNew,
        },
      });
    } catch (err) {
      console.error("SEND EMAIL OTP ERROR:", err);
      setServerError(
        err.response?.data?.message ||
          "Unable to send verification code. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="edit-email-page">
        <div className="edit-email-container">
          {/* Back button */}
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/edit-profile")}
          >
            <ArrowLeft size={16} />
            <span>Back to Edit Profile</span>
          </button>

          {/* Central Security Card */}
          <div className="edit-card">
            {/* Security Icon Badge */}
            <div className="security-icon-wrapper">
              <div className="security-icon">
                <Mail size={28} strokeWidth={2.2} />
              </div>
              <div className="security-badge">
                <ShieldCheck size={14} />
              </div>
            </div>

            <p className="security-label">ACCOUNT SECURITY</p>
            <h1>Change Email Address</h1>

            <p className="edit-description">
              {currentEmail && (
                <span className="current-email-text">
                  Current Email: <strong>{currentEmail}</strong>
                  <br />
                </span>
              )}
              Enter your new email address. A confidential verification code will
              be sent to confirm the change.
            </p>

            {/* Google-authenticated notice if user has no local password */}
            {!hasPassword && isGoogleUser && (
              <div className="google-auth-notice">
                <ShieldCheck size={18} />
                <span>
                  Authenticated via Google. You do not need to enter a local password
                  to request verification for your new email address.
                </span>
              </div>
            )}

            {/* Server Error Alert */}
            {serverError && (
              <div className="server-error-banner">
                <AlertCircle size={18} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="edit-email-form">
              {/* CURRENT PASSWORD (Required if user has local password) */}
              {hasPassword && (
                <div className="form-group">
                  <label>CURRENT PASSWORD</label>
                  <div
                    className={`input-box ${
                      fieldErrors.currentPassword ? "has-error" : ""
                    }`}
                  >
                    <Lock size={19} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      placeholder="Enter your current password"
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          currentPassword: "",
                        }));
                        setServerError("");
                      }}
                      disabled={pageLoading || loading}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className="field-error-text">
                      {fieldErrors.currentPassword}
                    </p>
                  )}
                  <small className="field-tip">
                    Your password confirms ownership before the email can be updated.
                  </small>
                </div>
              )}

              {/* NEW EMAIL ADDRESS */}
              <div className="form-group">
                <label>NEW EMAIL ADDRESS</label>
                <div
                  className={`input-box ${
                    fieldErrors.newEmail ? "has-error" : ""
                  }`}
                >
                  <Mail size={19} className="input-icon" />
                  <input
                    type="email"
                    value={newEmail}
                    placeholder="Enter your new email address"
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, newEmail: "" }));
                      setServerError("");
                    }}
                    disabled={pageLoading || loading}
                  />
                </div>
                {fieldErrors.newEmail && (
                  <p className="field-error-text">{fieldErrors.newEmail}</p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="send-button"
                disabled={loading || pageLoading}
              >
                <span>
                  {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
                </span>
                {!loading && <ArrowRight size={19} />}
              </button>

              {/* CANCEL BUTTON */}
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/edit-profile")}
                disabled={loading}
              >
                CANCEL
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .edit-email-page {
          min-height: calc(100vh - 200px);
          background: #FAF6F0;
          padding: 40px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: var(--font-sans, 'Poppins', sans-serif);
        }

        .edit-email-container {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: var(--el-burgundy, #520814);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          transition: opacity 0.2s ease;
        }

        .back-btn:hover {
          opacity: 0.75;
        }

        .edit-card {
          background: #ffffff;
          border: 1px solid var(--el-border, #E8DFD5);
          border-radius: 24px;
          padding: 42px 36px;
          box-shadow: 0 10px 30px rgba(82, 8, 20, 0.05);
          text-align: center;
        }

        .security-icon-wrapper {
          position: relative;
          width: 68px;
          height: 68px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .security-icon {
          width: 64px;
          height: 64px;
          background: #FAF6F0;
          border: 1px solid #E8DFD5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--el-burgundy, #520814);
        }

        .security-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          background: var(--el-burgundy, #520814);
          color: #FAF6F0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
        }

        .security-label {
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--el-gold, #C49E60);
          font-weight: 600;
          margin-bottom: 6px;
        }

        .edit-card h1 {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 32px;
          color: var(--el-burgundy, #520814);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .edit-description {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .current-email-text {
          display: block;
          margin-bottom: 4px;
          color: #444;
        }

        .current-email-text strong {
          color: var(--el-burgundy, #520814);
        }

        .google-auth-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          color: #166534;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          text-align: left;
          margin-bottom: 20px;
        }

        .server-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #991B1B;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          text-align: left;
          margin-bottom: 20px;
        }

        .edit-email-form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: var(--el-burgundy, #520814);
          margin-bottom: 8px;
        }

        .input-box {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #DDD3C7;
          border-radius: 12px;
          padding: 12px 14px;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-box:focus-within {
          border-color: var(--el-burgundy, #520814);
          box-shadow: 0 0 0 3px rgba(82, 8, 20, 0.08);
        }

        .input-box.has-error {
          border-color: #DC2626;
          background: #FFFBFB;
        }

        .input-icon {
          color: #8B8B8B;
          flex-shrink: 0;
        }

        .input-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #333;
          background: transparent;
        }

        .eye-toggle {
          border: none;
          background: transparent;
          color: #8B8B8B;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .eye-toggle:hover {
          color: var(--el-burgundy, #520814);
        }

        .field-error-text {
          color: #DC2626;
          font-size: 12px;
          margin-top: 6px;
        }

        .field-tip {
          display: block;
          color: #888;
          font-size: 12px;
          margin-top: 4px;
        }

        .send-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          background: var(--el-burgundy, #520814);
          color: #FAF6F0;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          margin-top: 10px;
        }

        .send-button:hover:not(:disabled) {
          background: #3B040D;
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-button {
          width: 100%;
          border: none;
          background: transparent;
          color: #777;
          font-size: 12px;
          letter-spacing: 1.5px;
          padding: 12px;
          margin-top: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .cancel-button:hover {
          color: var(--el-burgundy, #520814);
        }
      `}</style>
    </UserLayout>
  );
}

export default EditEmail;