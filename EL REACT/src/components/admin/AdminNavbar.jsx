import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Shirt,
  Layers,
  FolderTree,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import "./AdminNavbar.css";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Products", path: "/admin/products", icon: Shirt },
  { label: "Variants", path: "/admin/variants", icon: Layers },
  { label: "Categories", path: "/admin/categories", icon: FolderTree },
  { label: "Customers", path: "/admin/users", icon: Users },
];

const getInitialAdminName = () => {
  try {
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.name) return parsed.name;
      if (parsed?.email) return parsed.email.split("@")[0];
    }
  } catch {
    // Fallback stays as default "Administrator"
  }
  return "Administrator";
};

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName] = useState(getInitialAdminName);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active route matching helper
  const isItemActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  // Logout using existing admin authentication mechanism
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="el-admin-navbar-header">
      <nav className="el-admin-navbar" aria-label="Admin Navigation">
        <div className="el-admin-nav-container">
          {/* Brand Logo & Atelier Admin Title */}
          <Link
            to="/admin"
            className="el-admin-nav-brand"
            title="ELARQUE Admin Dashboard"
            onClick={closeMobileMenu}
          >
            <span className="el-admin-brand-crest">EL</span>
            <div className="el-admin-brand-text">
              <span className="el-admin-brand-name">ELARQUE</span>
              <span className="el-admin-brand-tag">Atelier Admin</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="el-admin-nav-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`el-admin-nav-link ${active ? "active" : ""}`}
                >
                  <Icon size={14} className="el-admin-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions: Admin Badge & Logout */}
          <div className="el-admin-nav-actions">
            <div className="el-admin-user-badge" title="Authenticated Admin Session">
              <span className="el-admin-status-dot" aria-hidden="true" />
              <ShieldCheck size={13} className="el-admin-badge-icon" />
              <span className="el-admin-badge-name">{adminName}</span>
            </div>

            <button
              type="button"
              className="el-admin-logout-btn"
              onClick={handleLogout}
              title="Sign Out of Admin Panel"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="el-admin-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="el-admin-mobile-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer / Dropdown */}
      <div
        className={`el-admin-mobile-drawer ${mobileMenuOpen ? "open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="el-admin-mobile-drawer-inner">
          <div className="el-admin-mobile-user-row">
            <div className="el-admin-user-badge">
              <span className="el-admin-status-dot" aria-hidden="true" />
              <ShieldCheck size={13} className="el-admin-badge-icon" />
              <span className="el-admin-badge-name">{adminName}</span>
            </div>
            <span className="el-admin-mobile-portal-label">AUTHENTICATED PORTAL</span>
          </div>

          <div className="el-admin-mobile-nav-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`el-admin-mobile-nav-link ${active ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <Icon size={16} className="el-admin-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="el-admin-mobile-footer">
            <button
              type="button"
              className="el-admin-mobile-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Sign Out of Atelier Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
