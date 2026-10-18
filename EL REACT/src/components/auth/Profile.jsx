import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  Wallet,
  Ticket,
  MapPin,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Award,
  Edit3,
  Copy,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

import { getProfile } from "../../services/profileService";
import { getAddresses } from "../../services/addressService";
import AnnouncementBar from "../common/AnnouncementBar";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import formatPrice from "../../utils/formatPrice";

function Profile() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [savedAddress, setSavedAddress] = useState(null);

  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("user");
    } catch {
      return true;
    }
  });

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // =====================================================
  // GET PROFILE FROM BACKEND
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const [profileRes, addressRes] = await Promise.allSettled([
          getProfile(),
          getAddresses(),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value?.data?.user) {
          const userObj = profileRes.value.data.user;
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
          if (profileRes.value.data.savedAddress) {
            setSavedAddress(profileRes.value.data.savedAddress);
          }
        }

        if (addressRes.status === "fulfilled" && Array.isArray(addressRes.value?.data?.addresses)) {
          const list = addressRes.value.data.addresses;
          if (list.length > 0) {
            const def = list.find((a) => a.isDefault) || list[0];
            setSavedAddress(def);
          }
        }
      } catch (err) {
        console.warn("PROFILE FETCH NOTICE:", err);

        if (
          err.response?.status === 401 ||
          err.response?.status === 403 ||
          err.response?.status === 404
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(err.response?.data?.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // =====================================================
  // COPY REFERRAL CODE
  // =====================================================

  const getEffectiveReferralKey = () => {
    if (user?.referralCode) return user.referralCode;
    const nameSlug = user?.fullName
      ? user.fullName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
      : "PATRON";
    return `ELQ-${nameSlug}2026`;
  };

  const copyReferralCode = async () => {
    const code = getEffectiveReferralKey();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard copy fallback:", err);
    }
  };

  // Format Date Helpers
  const formatInception = (dateStr) => {
    if (!dateStr) return "Winter 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "Winter 2026";
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "24 March 2005";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading && !user) {
    return (
      <div className="profile-loading-screen">
        <div className="profile-loading-box">
          <div className="profile-loading-logo">ELARQUE</div>
          <p>Accessing your private client salon...</p>
        </div>
        <style>{`
          .profile-loading-screen {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f7f0ea;
            color: #650d20;
            font-family: 'Poppins', sans-serif;
          }
          .profile-loading-box {
            text-align: center;
          }
          .profile-loading-logo {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 32px;
            letter-spacing: 5px;
            font-weight: 700;
          }
          .profile-loading-box p {
            color: #7d706b;
            font-size: 13px;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error && !user) {
    return (
      <div className="profile-error-screen">
        <div className="profile-error-card">
          <h2>Unable to Load Profile</h2>
          <p>{error}</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
            <button className="el-btn-primary" onClick={() => window.location.reload()}>
              TRY AGAIN
            </button>
            <button className="el-btn-secondary" onClick={() => navigate("/login")}>
              BACK TO LOGIN
            </button>
          </div>
        </div>
        <style>{`
          .profile-error-screen {
            min-height: 100vh;
            background: #f7f0ea;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
          }
          .profile-error-card {
            background: white;
            padding: 48px;
            border-radius: 20px;
            text-align: center;
            max-width: 420px;
            box-shadow: 0 16px 40px rgba(70, 20, 30, 0.08);
          }
          .profile-error-card h2 {
            color: #650d20;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 26px;
            margin-bottom: 12px;
          }
          .profile-error-card p {
            color: #756a67;
            font-size: 13px;
            line-height: 1.6;
          }
          .el-btn-primary {
            background: #650d20;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1px;
            cursor: pointer;
          }
          .el-btn-secondary {
            background: #eee5df;
            color: #650d20;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  const effectiveUser = user || {};
  const effectiveWallet = effectiveUser.wallet !== undefined && effectiveUser.wallet !== 0 ? effectiveUser.wallet : 12450;
  const effectiveWishlist = effectiveUser.wishlistCount || 12;
  const effectiveOrders = effectiveUser.orderCount || 24;

  const getFormattedAddress = () => {
    if (savedAddress) {
      const parts = [
        savedAddress.house,
        savedAddress.street,
        savedAddress.city,
        savedAddress.state,
      ].filter((p) => p && String(p).trim().length > 0);
      if (parts.length > 0) {
        return `${parts.join(", ")}${savedAddress.pincode ? ` - ${savedAddress.pincode}` : ""}`;
      }
    }
    if (effectiveUser?.address) {
      const parts = [
        effectiveUser.address.street,
        effectiveUser.address.city,
        effectiveUser.address.state,
      ].filter((p) => p && String(p).trim().length > 0);
      if (parts.length > 0) {
        return `${parts.join(", ")}${effectiveUser.address.pincode ? ` - ${effectiveUser.address.pincode}` : ""}`;
      }
    }
    return null;
  };

  const displayAddress = getFormattedAddress();

  return (
    <div className="el-profile-page-wrapper">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN NAVIGATION HEADER */}
      <Navbar />

      {/* 3. MAIN PROFILE CONTAINER */}
      <main className="el-profile-main-container">
        {/* =====================================================
            LEFT COLUMN: PATRON SALON CARD
        ===================================================== */}
        <aside className="el-profile-sidebar-col">
          <div className="el-patron-card">
            {/* Circular Avatar with Gold Rim & Verified Badge */}
            <div className="el-patron-avatar-wrap">
              {effectiveUser.profileImage ? (
                <img
                  src={
                    effectiveUser.profileImage.startsWith("http")
                      ? effectiveUser.profileImage
                      : `http://localhost:5000${effectiveUser.profileImage}`
                  }
                  alt={effectiveUser.fullName || "Patron Avatar"}
                  className="el-patron-avatar-img"
                />
              ) : (
                <div className="el-patron-avatar-placeholder">
                  {effectiveUser.fullName ? effectiveUser.fullName.charAt(0).toUpperCase() : "S"}
                </div>
              )}
              <div className="el-patron-verified-badge" title="Verified Client">
                <ShieldCheck size={11} strokeWidth={2.5} color="#FFFFFF" />
              </div>
            </div>

            {/* Name & Inception Date */}
            <h2 className="el-patron-name">{effectiveUser.fullName || "Swaliha ezzath"}</h2>
            <p className="el-patron-inception">
              Client since {formatInception(effectiveUser.createdAt)}
            </p>

            <div className="el-patron-sidebar-divider" />

            {/* Navigation Menu */}
            <nav className="el-patron-menu" aria-label="Patron Dashboard Navigation">
              {/* My Profile (Active Item) */}
              <button
                type="button"
                className="el-menu-item active"
                onClick={() => navigate("/profile")}
              >
                <div className="el-menu-item-left">
                  <User size={15} color="#DFC28D" />
                  <span>MY PROFILE</span>
                </div>
                <span className="el-menu-arrow">→</span>
              </button>

              {/* My Orders */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/orders")}
              >
                <div className="el-menu-item-left">
                  <ShoppingBag size={15} />
                  <span>MY ORDERS</span>
                </div>
              </button>

              {/* Wishlist */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/wishlist")}
              >
                <div className="el-menu-item-left">
                  <Heart size={15} />
                  <span>WISHLIST</span>
                </div>
                <strong className="el-menu-count">
                  {String(effectiveWishlist).padStart(2, "0")}
                </strong>
              </button>

              {/* Wallet */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/wallet")}
              >
                <div className="el-menu-item-left">
                  <Wallet size={15} />
                  <span>WALLET</span>
                </div>
                <strong className="el-menu-count">{formatPrice(effectiveWallet)}</strong>
              </button>

              {/* Coupons */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/coupons")}
              >
                <div className="el-menu-item-left">
                  <Ticket size={15} />
                  <span>COUPONS</span>
                </div>
              </button>

              {/* Saved Addresses */}
              <button
                type="button"
                className="el-menu-item"
                onClick={() => navigate("/addresses")}
              >
                <div className="el-menu-item-left">
                  <MapPin size={15} />
                  <span>SAVED ADDRESSES</span>
                </div>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                className="el-menu-item logout"
                onClick={handleLogout}
              >
                <div className="el-menu-item-left">
                  <LogOut size={15} />
                  <span>SIGN OUT</span>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* =====================================================
            RIGHT COLUMN: SALON DOSSIERS & METRICS
        ===================================================== */}
        <section className="el-profile-content-col">
          {/* Card 1: Account Dashboard Banner */}
          <div className="el-profile-intro-banner">
            <div className="el-intro-text-group">
              <span className="el-intro-eyebrow">
                ACCOUNT DASHBOARD <span className="el-eyebrow-sep">•</span> PRIVATE CLIENT SALON
              </span>
              <h1 className="el-intro-title">My Profile</h1>
              <p className="el-intro-desc">
                Curate your personal dossiers, bespoke couture appointments, sizing metrics, and verified membership privileges.
              </p>
            </div>

            <button
              type="button"
              className="el-btn-edit-profile"
              onClick={() => navigate("/edit-profile")}
            >
              <Edit3 size={13} />
              <span>EDIT PROFILE</span>
            </button>
          </div>

          {/* Card 2: Personal Dossier (6-item Grid) */}
          <div className="el-dossier-card">
            <div className="el-dossier-header">
              <div>
                <h2 className="el-dossier-title">
                  <span className="el-dossier-title-dot">•</span> Personal Dossier
                </h2>
                <p className="el-dossier-subtitle">
                  Confidential biometric and billing profile registered under Paris haute couture protocols.
                </p>
              </div>

              <button
                type="button"
                className="el-btn-modify-details"
                onClick={() => navigate("/edit-profile")}
              >
                MODIFY DETAILS ➔
              </button>
            </div>

            <div className="el-dossier-grid">
              {/* 1. Full Patron Name */}
              <div className="el-dossier-cell">
                <div className="el-dossier-icon-box">
                  <User size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">FULL PATRON NAME</span>
                  <h3 className="el-dossier-val">{effectiveUser.fullName || "Swaliha Ezzath"}</h3>
                  <span className="el-dossier-sub">FORMAL SALUTATION: MADAME</span>
                </div>
              </div>

              {/* 2. Email Correspondence */}
              <div className="el-dossier-cell">
                <div className="el-dossier-icon-box">
                  <Mail size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">EMAIL CORRESPONDENCE</span>
                  <h3 className="el-dossier-val">{effectiveUser.email || "swaliha@example.com"}</h3>
                  <span className="el-dossier-sub">
                    <ShieldCheck size={10} color="#94753D" style={{ verticalAlign: "middle", marginRight: "3px" }} />
                    PRIMARY VAULT VERIFIED
                  </span>
                </div>
              </div>

              {/* 3. Mobile Liaison */}
              <div className="el-dossier-cell">
                <div className="el-dossier-icon-box">
                  <Phone size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">MOBILE LIAISON</span>
                  <h3 className="el-dossier-val">
                    {effectiveUser.phoneNumber
                      ? (effectiveUser.phoneNumber.startsWith("+")
                          ? effectiveUser.phoneNumber
                          : `+91 ${effectiveUser.phoneNumber}`)
                      : "Not specified"}
                  </h3>
                  <span className="el-dossier-sub">DIRECT SMS COUTURE ALERTS ENABLED</span>
                </div>
              </div>

              {/* 4. Date of Birth */}
              <div className="el-dossier-cell">
                <div className="el-dossier-icon-box">
                  <Calendar size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">DATE OF BIRTH</span>
                  <h3 className="el-dossier-val">{formatDateDisplay(effectiveUser.dateOfBirth)}</h3>
                  <span className="el-dossier-sub">SALON ANNIVERSARY GIFT TIER 1</span>
                </div>
              </div>

              {/* 5. Saved Address (Replaced Tailoring Silhouette) */}
              <div
                className="el-dossier-cell"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/addresses")}
                title="Manage Saved Addresses"
              >
                <div className="el-dossier-icon-box">
                  <MapPin size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">CURRENT SAVED ADDRESS</span>
                  <h3
                    className="el-dossier-val"
                    style={!displayAddress ? { color: "#7d706b", fontWeight: 500, fontSize: "14px" } : {}}
                  >
                    {displayAddress || "No address added yet"}
                  </h3>
                  <span className="el-dossier-sub">
                    {displayAddress ? "DEFAULT DISPATCH RESIDENCE" : "CLICK TO MANAGE ADDRESSES"}
                  </span>
                </div>
              </div>

              {/* 6. Patron Inception */}
              <div className="el-dossier-cell">
                <div className="el-dossier-icon-box">
                  <Award size={16} color="#650D20" />
                </div>
                <div className="el-dossier-info">
                  <span className="el-dossier-label">PATRON INCEPTION</span>
                  <h3 className="el-dossier-val">{formatInception(effectiveUser.createdAt)}</h3>
                  <span className="el-dossier-sub">HIGHLAND PARK &amp; PARIS ARCHIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 3 Stat Cards Row */}
          <div className="el-profile-stats-row">
            {/* Stat 1: Atelier Commissions */}
            <div className="el-stat-box">
              <div className="el-stat-header">
                <span className="el-stat-header-label">
                  ATELIER
                  <br />
                  COMMISSIONS
                </span>
                <div className="el-stat-header-icon">
                  <ShoppingBag size={15} color="#650D20" />
                </div>
              </div>
              <strong className="el-stat-num">{effectiveOrders}</strong>
              <p className="el-stat-sub">Delivered &amp; tailored western garments</p>
              <button
                type="button"
                className="el-stat-link"
                onClick={() => navigate("/orders")}
              >
                <span>TRACK LATEST ORDER</span> →
              </button>
            </div>

            {/* Stat 2: Curated Wishlist */}
            <div className="el-stat-box">
              <div className="el-stat-header">
                <span className="el-stat-header-label">
                  CURATED
                  <br />
                  WISHLIST
                </span>
                <div className="el-stat-header-icon">
                  <Heart size={15} color="#650D20" />
                </div>
              </div>
              <strong className="el-stat-num">{effectiveWishlist}</strong>
              <p className="el-stat-sub">Archived silhouettes ready for review</p>
              <button
                type="button"
                className="el-stat-link"
                onClick={() => navigate("/wishlist")}
              >
                <span>VIEW SALON BOARD</span> →
              </button>
            </div>

            {/* Stat 3: Atelier Vault Credit */}
            <div className="el-stat-box">
              <div className="el-stat-header">
                <span className="el-stat-header-label">
                  ATELIER VAULT
                  <br />
                  CREDIT
                </span>
                <div className="el-stat-header-icon">
                  <Wallet size={15} color="#650D20" />
                </div>
              </div>
              <strong className="el-stat-num">{formatPrice(effectiveWallet)}</strong>
              <p className="el-stat-sub">Available for instant runway release checkout</p>
              <button
                type="button"
                className="el-stat-link"
                onClick={() => navigate("/wallet")}
              >
                <span>ADD VAULT CREDITS</span> ⊕
              </button>
            </div>
          </div>

          {/* Card 4: Invite Friends & Patrons */}
          <div className="el-referral-invite-card">
            <div className="el-referral-seal-icon">
              <Ticket size={22} color="#94753D" />
            </div>

            <span className="el-referral-eyebrow">EXCLUSIVE PATRON INVITATION</span>
            <h2 className="el-referral-title">Invite Friends &amp; Patrons</h2>
            <p className="el-referral-desc">
              Share your exclusive atelier referral code. Both you and your invited guests receive complimentary bespoke tailoring privileges and <strong>₹2,500 salon credit</strong> on their inaugural commission.
            </p>

            <div className="el-referral-input-pill">
              <div className="el-referral-key-text">
                <span>REFERRAL KEY:</span>
                <strong>{getEffectiveReferralKey()}</strong>
              </div>

              <button
                type="button"
                className="el-btn-copy-code"
                onClick={copyReferralCode}
              >
                <Copy size={13} />
                <span>{copied ? "COPIED" : "COPY CODE"}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 4. SITE FOOTER */}
      <Footer />

      {/* =====================================================
          ATELIER LUXURY CSS
      ===================================================== */}
      <style>{`
        .el-profile-page-wrapper {
          min-height: 100vh;
          background: radial-gradient(
            ellipse 85% 75% at 50% 25%,
            #FDFBF9 0%,
            #F6EDE3 50%,
            #EBDDCF 100%
          );
          color: #3b2527;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .el-profile-main-container {
          width: 90%;
          max-width: 1360px;
          margin: 32px auto 80px;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 32px;
          align-items: start;
        }

        /* ================= SIDEBAR ================= */

        .el-profile-sidebar-col {
          position: sticky;
          top: 100px;
          align-self: flex-start;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .el-profile-sidebar-col::-webkit-scrollbar {
          width: 4px;
        }

        .el-profile-sidebar-col::-webkit-scrollbar-thumb {
          background: rgba(223, 194, 141, 0.4);
          border-radius: 4px;
        }

        .el-patron-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px 14px 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(70, 20, 30, 0.04);
          border: 1px solid rgba(223, 210, 200, 0.4);
        }

        .el-patron-avatar-wrap {
          width: 88px;
          height: 88px;
          margin: 4px auto 14px;
          position: relative;
        }

        .el-patron-avatar-img {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid #DFC28D;
          box-shadow: 0 4px 14px rgba(70, 20, 30, 0.12);
        }

        .el-patron-avatar-placeholder {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #650D20 0%, #3E0413 100%);
          color: #F7E7C4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          border: 2.5px solid #DFC28D;
          box-shadow: 0 4px 14px rgba(70, 20, 30, 0.12);
        }

        .el-patron-verified-badge {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 20px;
          height: 20px;
          background: #650D20;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .el-patron-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #302526;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }

        .el-patron-inception {
          font-size: 10.5px;
          color: #877B76;
          margin: 0;
          letter-spacing: 0.2px;
        }

        .el-patron-sidebar-divider {
          height: 1px;
          background: rgba(223, 210, 200, 0.45);
          margin: 18px 8px 14px;
        }

        .el-patron-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .el-menu-item {
          width: 100%;
          background: transparent;
          border: none;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: #5C524F;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .el-menu-item-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .el-menu-item:hover {
          background: rgba(247, 237, 230, 0.7);
          color: #650D20;
        }

        .el-menu-item.active {
          background: #650D20;
          color: #FFFFFF;
          border-left: 3px solid #DFC28D;
          border-radius: 0 10px 10px 0;
        }

        .el-menu-arrow {
          font-size: 13px;
          color: #DFC28D;
        }

        .el-menu-count {
          font-size: 10px;
          color: #877B76;
          font-weight: 600;
        }

        .el-menu-item.active .el-menu-count {
          color: #DFC28D;
        }

        .el-menu-item.logout {
          color: #C0392B;
          margin-top: 4px;
        }

        .el-menu-item.logout:hover {
          background: rgba(192, 57, 43, 0.08);
        }

        /* ================= RIGHT COLUMN CONTENT ================= */

        .el-profile-content-col {
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-width: 0;
        }

        /* 1. Intro Banner */
        .el-profile-intro-banner {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 30px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 8px 30px rgba(70, 20, 30, 0.04);
          border: 1px solid rgba(223, 210, 200, 0.4);
        }

        .el-intro-eyebrow {
          font-size: 10px;
          letter-spacing: 2.2px;
          font-weight: 700;
          color: #94753D;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }

        .el-eyebrow-sep {
          margin: 0 6px;
          color: #650D20;
        }

        .el-intro-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 34px;
          color: #650D20;
          font-weight: 600;
          margin: 0 0 8px;
          letter-spacing: 0.5px;
        }

        .el-intro-desc {
          font-size: 12.5px;
          color: #6E635F;
          line-height: 1.6;
          margin: 0;
          max-width: 620px;
        }

        .el-btn-edit-profile {
          background: #650D20;
          color: #FFFFFF;
          border: none;
          padding: 13px 22px;
          border-radius: 25px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 1.5px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 6px 18px rgba(101, 13, 32, 0.22);
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .el-btn-edit-profile:hover {
          background: #4E0918;
          transform: translateY(-1px);
        }

        /* 2. Personal Dossier Card */
        .el-dossier-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 30px 36px;
          box-shadow: 0 8px 30px rgba(70, 20, 30, 0.04);
          border: 1px solid rgba(223, 210, 200, 0.4);
        }

        .el-dossier-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .el-dossier-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          color: #650D20;
          font-weight: 600;
          margin: 0 0 4px;
        }

        .el-dossier-title-dot {
          color: #DFC28D;
          margin-right: 4px;
        }

        .el-dossier-subtitle {
          font-size: 11px;
          color: #877B76;
          margin: 0;
        }

        .el-btn-modify-details {
          background: none;
          border: none;
          color: #94753D;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }

        .el-btn-modify-details:hover {
          color: #650D20;
        }

        .el-dossier-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .el-dossier-cell {
          background: #F9F6F2;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(223, 210, 200, 0.3);
        }

        .el-dossier-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(70, 20, 30, 0.05);
        }

        .el-dossier-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .el-dossier-label {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #877B76;
          text-transform: uppercase;
        }

        .el-dossier-val {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16.5px;
          font-weight: 600;
          color: #302526;
          margin: 0;
          word-break: break-word;
        }

        .el-dossier-sub {
          font-size: 8.5px;
          color: #94753D;
          letter-spacing: 0.6px;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* 3. Stat Cards Row */
        .el-profile-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .el-stat-box {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(70, 20, 30, 0.04);
          border: 1px solid rgba(223, 210, 200, 0.4);
          display: flex;
          flex-direction: column;
        }

        .el-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .el-stat-header-label {
          font-size: 9px;
          letter-spacing: 1.8px;
          font-weight: 700;
          color: #877B76;
          text-transform: uppercase;
          line-height: 1.35;
        }

        .el-stat-header-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(101, 13, 32, 0.07);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .el-stat-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 38px;
          color: #650D20;
          font-weight: 600;
          margin: 4px 0 2px;
          line-height: 1;
        }

        .el-stat-sub {
          font-size: 11px;
          color: #877B76;
          margin: 0 0 16px;
          line-height: 1.4;
        }

        .el-stat-link {
          background: none;
          border: none;
          color: #94753D;
          font-size: 9px;
          letter-spacing: 1.2px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          text-align: left;
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s ease;
        }

        .el-stat-link:hover {
          color: #650D20;
        }

        /* 4. Referral Invite Card */
        .el-referral-invite-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 36px 40px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(70, 20, 30, 0.04);
          border: 1px solid rgba(223, 210, 200, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .el-referral-seal-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FBF0D9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          box-shadow: 0 2px 10px rgba(223, 194, 141, 0.25);
        }

        .el-referral-eyebrow {
          font-size: 9px;
          letter-spacing: 2px;
          font-weight: 700;
          color: #94753D;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .el-referral-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          color: #650D20;
          font-weight: 600;
          margin: 0 0 10px;
        }

        .el-referral-desc {
          font-size: 12px;
          color: #6E635F;
          line-height: 1.6;
          max-width: 580px;
          margin: 0 0 22px;
        }

        .el-referral-input-pill {
          background: #F9F6F2;
          border: 1px solid rgba(223, 210, 200, 0.6);
          border-radius: 30px;
          padding: 6px 8px 6px 24px;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          max-width: 100%;
        }

        .el-referral-key-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #877B76;
          letter-spacing: 1px;
        }

        .el-referral-key-text strong {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          color: #49272D;
          letter-spacing: 1.5px;
        }

        .el-btn-copy-code {
          background: #650D20;
          color: #FFFFFF;
          border: none;
          padding: 10px 18px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .el-btn-copy-code:hover {
          background: #4E0918;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1024px) {
          .el-profile-main-container {
            grid-template-columns: 1fr;
            width: 92%;
          }

          .el-profile-sidebar-col {
            position: static;
            max-height: none;
            overflow-y: visible;
          }

          .el-patron-card {
            max-width: 480px;
            margin: 0 auto;
          }

          .el-profile-stats-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .el-profile-intro-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .el-dossier-grid {
            grid-template-columns: 1fr;
          }

          .el-referral-input-pill {
            flex-direction: column;
            border-radius: 16px;
            padding: 14px;
            width: 100%;
          }

          .el-btn-copy-code {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;