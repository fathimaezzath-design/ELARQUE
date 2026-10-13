import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { changePassword, getProfile } from "../../services/profileService";
import UserLayout from "../../layouts/UserLayout";

function ChangePassword() {
  const navigate = useNavigate();

  const [hasPassword, setHasPassword] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user account info on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setInitialLoading(true);
        const res = await getProfile();
        if (res?.data?.user) {
          const user = res.data.user;
          const userHasPassword = user.hasPassword !== false;
          setHasPassword(userHasPassword);
          setIsGoogleUser(Boolean(user.isGoogleUser || (!user.hasPassword && user.googleId)));
        }
      } catch (err) {
        console.error("Failed to load user info in ChangePassword:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setFeedback({ type: "", message: "" });
  };

  // Password rule tests
  const rules = {
    length: passwordData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordData.newPassword),
    number: /[0-9]/.test(passwordData.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword),
  };

  const validatePassword = () => {
    const newErrors = {};

    if (hasPassword && !passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = "Password must contain at least 8 characters";
      } else if (!rules.uppercase) {
        newErrors.newPassword = "Password must contain at least one uppercase letter";
      } else if (!rules.number) {
        newErrors.newPassword = "Password must contain at least one number";
      } else if (!rules.special) {
        newErrors.newPassword = "Password must contain at least one special symbol (!@#$%^&*)";
      } else if (hasPassword && passwordData.currentPassword === passwordData.newPassword) {
        newErrors.newPassword = "New password must be different from your current password";
      }
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordLoading(true);

      const payload = {
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      if (hasPassword) {
        payload.currentPassword = passwordData.currentPassword;
      }

      const response = await changePassword(payload);

      setFeedback({
        type: "success",
        message:
          response?.data?.message ||
          (hasPassword
            ? "Password changed successfully."
            : "Password created successfully."),
      });

      // Clear fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setHasPassword(true);

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      const resData = error?.response?.data;
      if (resData?.field) {
        setPasswordErrors((prev) => ({
          ...prev,
          [resData.field]: resData.message,
        }));
      }
      setFeedback({
        type: "error",
        message: resData?.message || "Unable to update password. Please check the inputs.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="change-password-page">
        <div className="change-password-container">
          {/* Back Navigation */}
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/edit-profile")}
          >
            <ArrowLeft size={16} />
            <span>Back to Edit Profile</span>
          </button>

          {/* Card */}
          <div className="change-password-card">
            <div className="card-header">
              <div className="icon-wrapper">
                <Lock size={22} />
              </div>
              <div>
                <h1>
                  {hasPassword ? "Change Password" : "Create Account Password"}
                </h1>
                <p>
                  {hasPassword
                    ? "Update your account password for enhanced security"
                    : "Set a password to enable email & password sign-in alongside Google"}
                </p>
              </div>
            </div>

            {/* Google Notice if setting password for first time */}
            {!hasPassword && isGoogleUser && (
              <div className="google-auth-notice">
                <ShieldCheck size={18} />
                <span>
                  This account was created with Google. Creating a password will allow
                  you to sign in using both Google and email/password credentials.
                </span>
              </div>
            )}

            {/* Feedback Alert */}
            {feedback.message && (
              <div className={`password-feedback-banner ${feedback.type}`}>
                {feedback.type === "error" ? (
                  <AlertCircle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="password-form">
              {/* CURRENT PASSWORD (Only shown if account has local password) */}
              {hasPassword && (
                <div className="form-group full-width">
                  <label>Current Password</label>
                  <div
                    className={`input-wrapper password-input ${
                      passwordErrors.currentPassword ? "input-error" : ""
                    }`}
                  >
                    <Lock size={18} className="field-icon" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      disabled={initialLoading || passwordLoading}
                    />
                    <button
                      type="button"
                      className="password-eye"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      aria-label="Toggle current password visibility"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="error-text">
                      {passwordErrors.currentPassword}
                    </span>
                  )}
                </div>
              )}

              {/* NEW PASSWORD */}
              <div className="form-group full-width">
                <label>
                  {hasPassword ? "New Password" : "Create Password"}
                </label>
                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.newPassword ? "input-error" : ""
                  }`}
                >
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    disabled={initialLoading || passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-eye"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="error-text">
                    {passwordErrors.newPassword}
                  </span>
                )}

                {/* Password Rules Checklist */}
                <div className="password-rules-box">
                  <span className="rules-heading">Password requirements:</span>
                  <div className="rules-grid">
                    <span className={`rule-item ${rules.length ? "valid" : ""}`}>
                      • At least 8 characters
                    </span>
                    <span className={`rule-item ${rules.uppercase ? "valid" : ""}`}>
                      • 1 uppercase letter (A-Z)
                    </span>
                    <span className={`rule-item ${rules.number ? "valid" : ""}`}>
                      • 1 number (0-9)
                    </span>
                    <span className={`rule-item ${rules.special ? "valid" : ""}`}>
                      • 1 symbol (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group full-width">
                <label>
                  {hasPassword ? "Confirm New Password" : "Confirm Password"}
                </label>
                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.confirmPassword ? "input-error" : ""
                  }`}
                >
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm password"
                    disabled={initialLoading || passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="error-text">
                    {passwordErrors.confirmPassword}
                  </span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate("/edit-profile")}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={passwordLoading || initialLoading}
                >
                  <Lock size={17} />
                  <span>
                    {passwordLoading
                      ? "Updating..."
                      : hasPassword
                      ? "Change Password"
                      : "Create Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .change-password-page {
          min-height: calc(100vh - 200px);
          background: #faf6f1;
          padding: 40px 7%;
          color: #2d1b1f;
          font-family: var(--font-sans, 'Poppins', sans-serif);
        }

        .change-password-container {
          max-width: 640px;
          margin: 0 auto;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: #6b1f2a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
          transition: opacity 0.2s ease;
        }

        .back-btn:hover {
          opacity: 0.75;
        }

        .change-password-card {
          background: #ffffff;
          border: 1px solid #e8dfd5;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(82, 8, 20, 0.04);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0e9e1;
        }

        .icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fbf5ef;
          color: #6b1f2a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-header h1 {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: 26px;
          color: #4a0f19;
          margin: 0 0 4px;
        }

        .card-header p {
          color: #777;
          font-size: 13.5px;
          margin: 0;
        }

        .google-auth-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .password-feedback-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .password-feedback-banner.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .password-feedback-banner.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .password-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12.5px;
          font-weight: 600;
          color: #4a0f19;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #dcd3c9;
          border-radius: 8px;
          padding: 11px 14px;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: #6b1f2a;
          box-shadow: 0 0 0 3px rgba(107, 31, 42, 0.08);
        }

        .input-wrapper.input-error {
          border-color: #c93b4a;
          background: #fffafa;
        }

        .field-icon {
          color: #888;
          flex-shrink: 0;
        }

        .input-wrapper input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #2d1b1f;
          background: transparent;
        }

        .password-eye {
          border: none;
          background: transparent;
          color: #888;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .password-eye:hover {
          color: #6b1f2a;
        }

        .error-text {
          color: #c93b4a;
          font-size: 12px;
          margin-top: 2px;
        }

        .password-rules-box {
          background: #faf6f1;
          border: 1px solid #eee4d8;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 6px;
        }

        .rules-heading {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          color: #6b1f2a;
          margin-bottom: 6px;
        }

        .rules-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 12px;
        }

        .rule-item {
          font-size: 11.5px;
          color: #888;
          transition: color 0.2s ease;
        }

        .rule-item.valid {
          color: #166534;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
          padding-top: 20px;
          border-top: 1px solid #f0e9e1;
        }

        .cancel-btn {
          padding: 11px 22px;
          border: 1px solid #dcd3c9;
          background: transparent;
          color: #6b1f2a;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cancel-btn:hover {
          background: #faf6f1;
        }

        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 26px;
          border: 1px solid #6b1f2a;
          background: #6b1f2a;
          color: #ffffff;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: #4a0f19;
          border-color: #4a0f19;
        }

        .submit-btn:disabled,
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .change-password-page {
            padding: 24px 5%;
          }
          .change-password-card {
            padding: 24px 18px;
          }
          .rules-grid {
            grid-template-columns: 1fr;
          }
          .form-actions {
            flex-direction: column-reverse;
          }
          .cancel-btn,
          .submit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </UserLayout>
  );
}

export default ChangePassword;
