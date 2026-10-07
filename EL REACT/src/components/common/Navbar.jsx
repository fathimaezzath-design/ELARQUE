import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../data/homeData";

function Navbar({ wishlistCount = 0, cartCount = 0 }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleProfileClick = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Search for:", searchQuery);
    }
  };

  return (
    <header className="el-navbar-wrapper">
      <nav className="el-navbar" aria-label="Main Navigation">
        <div className="el-nav-container">
          {/* Mobile Menu Button */}
          <button
            className="el-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Brand Logo */}
          <div className="el-nav-brand">
            <Link to="/" className="el-brand-link">
              <h1 className="el-brand-title">ELARQUE</h1>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <ul className="el-nav-menu">
            {NAV_LINKS.map((link) => (
              <li key={link.label} className="el-nav-item">
                <a href={link.href} className="el-nav-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Actions: Search, Wishlist, Cart, Profile */}
          <div className="el-nav-actions">
            {/* Search Trigger */}
            <div className="el-search-wrapper">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="el-search-form">
                  <input
                    type="text"
                    placeholder="Search silhouettes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="el-search-input"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="el-search-close"
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="el-icon-btn"
                  aria-label="Search"
                >
                  <Search size={20} strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => navigate("/profile")}
              className="el-icon-btn"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={1.75} />
              {wishlistCount > 0 && (
                <span className="el-badge">{wishlistCount}</span>
              )}
            </button>

            {/* Shopping Bag */}
            <button
              onClick={() => console.log("Open Cart")}
              className="el-icon-btn"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="el-badge">{cartCount}</span>
              )}
            </button>

            {/* User Profile */}
            <button
              onClick={handleProfileClick}
              className="el-icon-btn el-profile-btn"
              aria-label="Client Account"
              title="Client Account"
            >
              <User size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="el-mobile-drawer">
            <ul className="el-mobile-menu">
              {NAV_LINKS.map((link) => (
                <li key={link.label} className="el-mobile-item">
                  <a
                    href={link.href}
                    className="el-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="el-mobile-item">
                <button
                  className="el-mobile-link el-mobile-auth-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleProfileClick();
                  }}
                >
                  <User size={18} /> CLIENT ACCOUNT / SALON
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <style>{`
        .el-navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: var(--el-cream);
          border-bottom: 1px solid var(--el-border);
          transition: background-color 0.3s ease;
        }

        .el-navbar {
          width: 100%;
        }

        .el-nav-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .el-nav-brand {
          flex: 0 0 auto;
        }

        .el-brand-link {
          text-decoration: none;
          color: var(--el-burgundy);
          display: inline-block;
        }

        .el-brand-title {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 6px;
          margin: 0;
          color: var(--el-burgundy);
          text-transform: uppercase;
        }

        .el-nav-menu {
          display: flex;
          align-items: center;
          gap: 36px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .el-nav-link {
          font-family: var(--font-sans);
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 1.8px;
          color: #2D2825;
          text-decoration: none;
          text-transform: uppercase;
          position: relative;
          padding: 6px 0;
          transition: color 0.25s ease;
        }

        .el-nav-link::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1.5px;
          background-color: var(--el-burgundy);
          transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .el-nav-link:hover {
          color: var(--el-burgundy);
        }

        .el-nav-link:hover::after {
          width: 100%;
        }

        .el-nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .el-icon-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          color: #2D2825;
          transition: all 0.25s ease;
        }

        .el-icon-btn:hover {
          color: var(--el-burgundy);
          background-color: rgba(82, 8, 20, 0.05);
        }

        .el-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: var(--el-burgundy);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .el-search-wrapper {
          position: relative;
        }

        .el-search-form {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid var(--el-border);
          border-radius: var(--radius-full);
          padding: 4px 12px;
          gap: 8px;
          animation: elFadeIn 0.25s ease;
        }

        .el-search-input {
          border: none;
          outline: none;
          font-family: var(--font-sans);
          font-size: 13px;
          width: 180px;
          background: transparent;
        }

        .el-search-close {
          color: var(--el-text-muted);
          display: flex;
          align-items: center;
        }

        .el-mobile-toggle {
          display: none;
          color: var(--el-text-dark);
          padding: 4px;
        }

        .el-mobile-drawer {
          display: none;
        }

        @keyframes elFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 992px) {
          .el-nav-menu {
            display: none;
          }

          .el-mobile-toggle {
            display: inline-flex;
            order: -1;
          }

          .el-brand-title {
            font-size: 22px;
            letter-spacing: 4px;
          }

          .el-mobile-drawer {
            display: block;
            background-color: var(--el-cream);
            border-top: 1px solid var(--el-border);
            padding: 20px 24px 28px;
            animation: elFadeIn 0.25s ease;
          }

          .el-mobile-menu {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .el-mobile-link {
            font-family: var(--font-sans);
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 2px;
            color: #2D2825;
            text-decoration: none;
            text-transform: uppercase;
            display: block;
            padding: 8px 0;
            border-bottom: 1px solid rgba(232, 223, 213, 0.4);
          }

          .el-mobile-auth-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--el-burgundy);
            font-weight: 600;
            margin-top: 8px;
            border-bottom: none;
          }
        }
      `}</style>
    </header>
  );
}

export default Navbar;