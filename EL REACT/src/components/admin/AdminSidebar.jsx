import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const closeMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const isItemActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    if (path === "/admin/products") {
      return (
        location.pathname.startsWith("/admin/products") ||
        location.pathname.startsWith("/admin/variants")
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="el-sidebar-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`el-admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="el-sidebar-inner">
          {/* 1. Header Branding */}
          <div className="el-sidebar-brand-wrapper">
            <Link to="/admin" className="el-sidebar-brand-link" onClick={closeMobile}>
              <h1 className="el-sidebar-brand-title">ELARQUE</h1>
              <span className="el-sidebar-brand-subtitle">ADMIN DASHBOARD</span>
            </Link>
          </div>

          {/* 2. Navigation Items */}
          <nav className="el-sidebar-nav" aria-label="Admin Navigation">
            {/* Dashboard */}
            <Link
              to="/admin"
              className={`el-sidebar-item ${isItemActive("/admin") ? "active" : ""}`}
              onClick={closeMobile}
            >
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="1.5" />
                    <rect x="13" y="3" width="8" height="8" rx="1.5" />
                    <rect x="3" y="13" width="8" height="8" rx="1.5" />
                    <rect x="13" y="13" width="8" height="8" rx="1.5" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Dashboard</span>
              </div>
              {isItemActive("/admin") && <span className="el-sidebar-active-dot" />}
            </Link>

            {/* Products */}
            <Link
              to="/admin/products"
              className={`el-sidebar-item ${isItemActive("/admin/products") ? "active" : ""}`}
              onClick={closeMobile}
            >
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3c0 .8.4 1.5 1 2L2.5 15A2 2 0 0 0 4 18h16a2 2 0 0 0 1.5-3L14 7c.6-.5 1-1.2 1-2a3 3 0 0 0-3-3z" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Products</span>
              </div>
              <div className="el-sidebar-item-right">
                <span className="el-sidebar-count-badge">1,250</span>
                {isItemActive("/admin/products") && <span className="el-sidebar-active-dot" />}
              </div>
            </Link>

            {/* Categories */}
            <Link
              to="/admin/categories"
              className={`el-sidebar-item ${isItemActive("/admin/categories") ? "active" : ""}`}
              onClick={closeMobile}
            >
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="8.5" y="14" width="7" height="7" rx="1" />
                    <path d="M6.5 10v2a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
                    <path d="M12 14v-2" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Categories</span>
              </div>
              {isItemActive("/admin/categories") && <span className="el-sidebar-active-dot" />}
            </Link>

            {/* Orders */}
            <Link
              to="/admin/orders"
              className={`el-sidebar-item ${isItemActive("/admin/orders") ? "active" : ""}`}
              onClick={closeMobile}
            >
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-2.43-2.92A1 1 0 0 0 18.57 9H14v9h1" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Orders</span>
              </div>
              <div className="el-sidebar-item-right">
                {isItemActive("/admin/orders") && <span className="el-sidebar-active-dot" />}
              </div>
            </Link>

            {/* Customers */}
            <Link
              to="/admin/users"
              className={`el-sidebar-item ${isItemActive("/admin/users") ? "active" : ""}`}
              onClick={closeMobile}
            >
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Customers</span>
              </div>
              {isItemActive("/admin/users") && <span className="el-sidebar-active-dot" />}
            </Link>

            {/* Offers */}
            <div className="el-sidebar-item inactive-link">
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Offers</span>
              </div>
            </div>

            {/* Coupons */}
            <div className="el-sidebar-item inactive-link">
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Coupons</span>
              </div>
            </div>

            {/* Returns */}
            <div className="el-sidebar-item inactive-link">
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Returns</span>
              </div>
            </div>

            {/* Sales Report */}
            <div className="el-sidebar-item inactive-link">
              <div className="el-sidebar-item-left">
                <span className="el-sidebar-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </span>
                <span className="el-sidebar-label">Sales Report</span>
              </div>
            </div>
          </nav>

          {/* 3. Bottom Logout Section */}
          <div className="el-sidebar-footer">
            <button
              type="button"
              className="el-sidebar-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <span className="el-sidebar-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </span>
              <span className="el-sidebar-label">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
