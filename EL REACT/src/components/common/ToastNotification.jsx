import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Heart, Lock, CheckCircle2, AlertCircle, X } from "lucide-react";

function ToastNotification() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleToastEvent = (e) => {
      const toastData = e.detail;
      if (!toastData) return;

      // Add new toast, keep at most 3 visible at once
      setToasts((prev) => [toastData, ...prev.slice(0, 2)]);
    };

    window.addEventListener("elarque_toast", handleToastEvent);
    return () => window.removeEventListener("elarque_toast", handleToastEvent);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <aside className="el-toast-viewport" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
          onNavigate={(url) => {
            removeToast(toast.id);
            navigate(url);
          }}
        />
      ))}

      <style>{`
        .el-toast-viewport {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 420px;
          width: calc(100vw - 32px);
          pointer-events: none;
        }

        .el-toast-item {
          pointer-events: auto;
          background: #FFFFFF;
          border: 1px solid #DFD6C9;
          border-left: 3.5px solid var(--el-burgundy, #520814);
          border-radius: 8px;
          box-shadow: 0 16px 36px rgba(82, 8, 20, 0.12), 0 4px 14px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: stretch;
          position: relative;
          overflow: hidden;
          animation: elToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }

        @keyframes elToastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .el-toast-inner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          width: 100%;
        }

        .el-toast-media {
          width: 50px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          background-color: #F5EFE6;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #EFE8DE;
        }

        .el-toast-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }

        .el-toast-icon-placeholder {
          color: var(--el-burgundy, #520814);
        }

        .el-toast-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .el-toast-header-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .el-toast-type-icon {
          color: var(--el-burgundy, #520814);
          flex-shrink: 0;
        }

        .el-toast-title {
          font-family: var(--font-serif, "Cinzel", "Playfair Display", serif);
          font-size: 13.5px;
          font-weight: 600;
          color: #2D2825;
          letter-spacing: 0.3px;
          margin: 0;
          line-height: 1.25;
        }

        .el-toast-message {
          font-family: var(--font-sans, "Montserrat", sans-serif);
          font-size: 12px;
          color: #6B625B;
          margin: 0;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .el-toast-action-btn {
          align-self: flex-start;
          margin-top: 4px;
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-sans, "Montserrat", sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: var(--el-burgundy, #520814);
          cursor: pointer;
          text-transform: uppercase;
          border-bottom: 1px solid var(--el-burgundy, #520814);
          transition: all 0.2s ease;
        }

        .el-toast-action-btn:hover {
          color: var(--el-burgundy-deep, #3b050e);
          border-color: var(--el-burgundy-deep, #3b050e);
          transform: translateX(2px);
        }

        .el-toast-close-btn {
          background: none;
          border: none;
          color: #9C9188;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 2px;
        }

        .el-toast-close-btn:hover {
          color: #2D2825;
          background-color: #F5EFE6;
        }

        .el-toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2.5px;
          background: linear-gradient(90deg, var(--el-burgundy, #520814) 0%, #C49E60 100%);
          width: 100%;
          transform-origin: left;
        }

        @media (max-width: 480px) {
          .el-toast-viewport {
            top: 16px;
            right: 16px;
            left: 16px;
            width: auto;
          }
        }
      `}</style>
    </aside>
  );
}

function ToastItem({ toast, onClose, onNavigate }) {
  const [paused, setPaused] = useState(false);
  const remainingTimeRef = useRef(toast.duration || 3800);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onClose();
    }, remainingTimeRef.current);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [paused, onClose]);

  const handleMouseEnter = () => {
    setPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    setPaused(false);
  };

  // Icon by type
  const renderIcon = () => {
    switch (toast.type) {
      case "cart":
        return <ShoppingBag size={14} className="el-toast-type-icon" />;
      case "wishlist":
        return <Heart size={14} className="el-toast-type-icon" fill="currentColor" />;
      case "auth":
        return <Lock size={14} className="el-toast-type-icon" />;
      case "error":
        return <AlertCircle size={14} className="el-toast-type-icon" color="#b91c1c" />;
      default:
        return <CheckCircle2 size={14} className="el-toast-type-icon" color="#C49E60" />;
    }
  };

  return (
    <div
      className="el-toast-item"
      role="status"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="el-toast-inner">
        {/* Media Thumbnail or Fallback Icon */}
        <div className="el-toast-media">
          {toast.image ? (
            <img
              src={toast.image}
              alt=""
              className="el-toast-thumb"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="el-toast-icon-placeholder">{renderIcon()}</div>
          )}
        </div>

        {/* Text Content */}
        <div className="el-toast-content">
          <div className="el-toast-header-row">
            {toast.image && renderIcon()}
            <h4 className="el-toast-title">{toast.title}</h4>
          </div>
          <p className="el-toast-message" title={toast.message}>
            {toast.message}
          </p>

          {/* Action Link / Button */}
          {toast.actionLabel && toast.actionLink && (
            <button
              type="button"
              className="el-toast-action-btn"
              onClick={() => {
                if (toast.onAction) toast.onAction();
                onNavigate(toast.actionLink);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="el-toast-close-btn"
          aria-label="Close notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress Bar */}
      <div
        className="el-toast-progress-bar"
        style={{
          animation: `elToastProgress ${toast.duration || 3800}ms linear forwards`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />

      <style>{`
        @keyframes elToastProgress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ToastNotification;
