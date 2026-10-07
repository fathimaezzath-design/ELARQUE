import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation before sending request
    const trimmedEmail = email.trim();

    if (!trimmedEmail && !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Admin email is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Secure passcode is required.');
      return;
    }

    // 2. Submit to backend API
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await axios.post('http://localhost:5000/api/admin/login', {
        email: trimmedEmail,
        password,
      });

      if (response.data?.success && response.data?.token) {
        // Store only in dedicated admin localStorage keys
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));

        // Navigate to /admin
        navigate('/admin');
      } else {
        setErrorMessage(response.data?.message || 'Login failed.');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        // Backend error response (e.g., 401 "Invalid email or password.")
        setErrorMessage(error.response.data.message);
      } else if (error.request) {
        // Network / connection error
        setErrorMessage('Unable to connect to the server. Please try again.');
      } else {
        // Other unexpected error
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        {/* Logo and Header */}
        <div className="admin-login-header">
          <h1 className="admin-brand-logo">ELARQUE</h1>
          <p className="admin-brand-subtitle">ADMIN CONTROL CENTER</p>
          <div className="admin-header-divider" aria-hidden="true" />
        </div>

        {/* Login Form */}
        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {/* Error Message Display */}
          {errorMessage && (
            <div className="admin-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Admin Email */}
          <div className="admin-form-group">
            <label htmlFor="admin-email">ADMIN EMAIL</label>
            <div className="admin-input-wrapper">
              <span className="admin-input-icon">
                <Mail size={18} strokeWidth={1.8} />
              </span>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="director.atelier@elarque.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Secure Passcode */}
          <div className="admin-form-group">
            <label htmlFor="admin-password">SECURE PASSCODE</label>
            <div className="admin-input-wrapper">
              <span className="admin-input-icon">
                <Lock size={18} strokeWidth={1.8} />
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Passcode */}
          <div className="admin-options-row">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="admin-forgot-btn"
              onClick={() => {}}
            >
              Forgot Passcode?
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span>AUTHENTICATING...</span>
                <span className="admin-spinner" aria-hidden="true" />
              </>
            ) : (
              <>
                <span>LOGIN</span>
                <span className="admin-submit-arrow">&gt;</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="admin-login-footer">
          <div className="admin-security-badge">
            <ShieldCheck size={14} strokeWidth={2} />
            <span>ENCRYPTED PORTAL &bull; AUTHORIZED PERSONNEL ONLY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
