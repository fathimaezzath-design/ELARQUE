import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { changePassword } from "../../services/profileService";

function ChangePassword() {
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must contain at least 8 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await changePassword(passwordData);

      alert(response?.data?.message || "Password changed successfully");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});

      navigate("/edit-profile");
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      alert(error?.response?.data?.message || "Unable to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

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
                <h1>Change Password</h1>
                <p>Update your account password for enhanced security</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="password-form">
              {/* CURRENT PASSWORD */}
              <div className="form-group full-width">
                <label>Current Password</label>
                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.currentPassword ? "input-error" : ""
                  }`}
                >
                  <Lock size={18} />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
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

              {/* NEW PASSWORD */}
              <div className="form-group full-width">
                <label>New Password</label>
                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.newPassword ? "input-error" : ""
                  }`}
                >
                  <Lock size={18} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="password-eye"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="error-text">
                    {passwordErrors.newPassword}
                  </span>
                )}
                <small className="field-note">
                  Password must contain at least 8 characters.
                </small>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group full-width">
                <label>Confirm New Password</label>
                <div
                  className={`input-wrapper password-input ${
                    passwordErrors.confirmPassword ? "input-error" : ""
                  }`}
                >
                  <Lock size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
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
                  disabled={passwordLoading}
                >
                  <Lock size={17} />
                  <span>
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .change-password-page {
    min-height: 100vh;
    background: #faf6f1;
    padding: 40px 7%;
    color: #2d1b1f;
    font-family: 'Poppins', sans-serif;
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
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 30px;
    padding-bottom: 24px;
    border-bottom: 1px solid #eee5df;
  }

  .icon-wrapper {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #faf6f1;
    color: #6b1f2a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-header h1 {
    margin: 0 0 4px;
    font-family: "Cormorant Garamond", serif;
    font-size: 32px;
    font-weight: 600;
    color: #4a0f19;
  }

  .card-header p {
    margin: 0;
    color: #777;
    font-size: 13.5px;
  }

  .password-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    width: 100%;
  }

  .form-group label {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #4a0f19;
  }

  .input-wrapper {
    position: relative;
    width: 100%;
    min-height: 48px;
    display: flex;
    align-items: center;
    background: #fcfbfa;
    border: 1px solid #dcd3cb;
    border-radius: 8px;
    padding: 0 14px;
    box-sizing: border-box;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .input-wrapper:focus-within {
    border-color: #6b1f2a;
    background: #ffffff;
  }

  .input-wrapper svg {
    color: #8c7679;
    flex-shrink: 0;
  }

  .input-wrapper input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 12px 10px;
    font-size: 14px;
    font-family: inherit;
    color: #2d1b1f;
  }

  .password-input input {
    padding-right: 36px;
  }

  .password-eye {
    position: absolute;
    right: 12px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #777;
    cursor: pointer;
    padding: 0;
  }

  .password-eye:hover {
    color: #4a0f19;
  }

  .input-error {
    border-color: #c62828 !important;
  }

  .error-text {
    margin-top: 6px;
    color: #c62828;
    font-size: 12px;
  }

  .field-note {
    margin-top: 6px;
    font-size: 11.5px;
    color: #888;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
    margin-top: 10px;
    padding-top: 20px;
    border-top: 1px solid #eee5df;
  }

  .cancel-btn {
    padding: 11px 22px;
    border: 1px solid #dcd3cb;
    background: #ffffff;
    color: #555;
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

  .submit-btn:hover {
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
    .form-actions {
      flex-direction: column-reverse;
    }
    .cancel-btn,
    .submit-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default ChangePassword;
