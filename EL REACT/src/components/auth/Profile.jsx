import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  Wallet,
  Ticket,
  MapPin,
  Lock,
  LogOut,
  Mail,
  Phone,
  Calendar,
  MapPinned,
  Edit3,
  Copy,
  ShieldCheck,
} from "lucide-react";

import { getProfile } from "../../services/authService";

function Profile() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

        const response = await getProfile();

        console.log("PROFILE RESPONSE:", response.data);

        setUser(response.data.user);

        // Keep user data locally also
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      } catch (err) {
        console.log("PROFILE ERROR:", err);
        console.log("PROFILE RESPONSE:", err.response);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load profile."
        );
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

  const copyReferralCode = async () => {
    if (!user?.referralCode) return;

    try {
      await navigator.clipboard.writeText(user.referralCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.log("Copy failed:", error);
    }
  };

  // =====================================================
  // FORMAT ADDRESS OBJECT INTO READABLE TEXT
  // =====================================================

  const formatAddress = (address) => {
    if (!address) return "No address added";

    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "No address added";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-content">
          <div className="loading-logo">ELARQUE</div>
          <p>Loading your private profile...</p>
        </div>

        <style>{`
          .profile-loading {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f7f0ea;
            color: #650d20;
            font-family: Arial, sans-serif;
          }

          .loading-content {
            text-align: center;
          }

          .loading-logo {
            font-family: Georgia, serif;
            font-size: 30px;
            letter-spacing: 4px;
            font-weight: bold;
          }

          .loading-content p {
            color: #7d706b;
            font-size: 13px;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-box">
          <h2>Unable to Load Profile</h2>

          <p>{error}</p>

          <button onClick={() => window.location.reload()}>
            TRY AGAIN
          </button>

          <button
            className="back-login"
            onClick={() => navigate("/login")}
          >
            BACK TO LOGIN
          </button>
        </div>

        <style>{`
          .profile-error {
            min-height: 100vh;
            background: #f7f0ea;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
          }

          .error-box {
            background: white;
            padding: 45px;
            border-radius: 18px;
            text-align: center;
            width: 400px;
            box-shadow: 0 15px 40px rgba(70, 20, 30, 0.08);
          }

          .error-box h2 {
            color: #650d20;
            font-family: Georgia, serif;
          }

          .error-box p {
            color: #756a67;
            font-size: 13px;
          }

          .error-box button {
            margin-top: 15px;
            border: none;
            background: #650d20;
            color: white;
            padding: 12px 22px;
            border-radius: 22px;
            cursor: pointer;
            font-size: 11px;
            letter-spacing: 1px;
          }

          .error-box .back-login {
            background: #eee5df;
            color: #650d20;
            margin-left: 8px;
          }
        `}</style>
      </div>
    );
  }

  // =====================================================
  // PROFILE DATA
  // =====================================================

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="profile-header">

        <div
          className="profile-logo"
          onClick={() => navigate("/")}
        >
          ELARQUE
        </div>

        <nav className="profile-nav">

          <span onClick={() => navigate("/")}>
            MAIN
          </span>

          <span>
            COLLECTIONS
          </span>

          <span>
            BEST SELLERS
          </span>

          <span>
            CATEGORIES
          </span>

          <span>
            NEW ARRIVALS
          </span>

        </nav>

        <div className="profile-header-icons">

          <Heart size={19} />

          <Wallet size={19} />

          <div
            className="header-user"
            onClick={() => navigate("/profile")}
          >
            <User size={17} />
          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="profile-container">


        {/* =====================================================
            LEFT SIDEBAR
        ===================================================== */}

        <aside className="profile-sidebar">

          <div className="profile-card">

            {/* PROFILE IMAGE */}

            <div className="profile-image-wrapper">

              {user.profileImage ? (

                <img
                  src={`http://localhost:5000${user.profileImage}`}
                  alt="Profile"
                  className="profile-image"
                />

              ) : (

                <div className="profile-image-placeholder">
                  {user.fullName
                    ? user.fullName.charAt(0).toUpperCase()
                    : "U"}
                </div>

              )}

              <div className="profile-camera">
                <User size={13} />
              </div>

            </div>


            <h2>
              {user.fullName || "User"}
            </h2>

            <p className="client-since">
              ELARQUE PRIVATE CLIENT
            </p>

            <div className="sidebar-line"></div>


            {/* SIDEBAR MENU */}

            <div className="sidebar-menu">

              <button
                className="sidebar-item active"
                onClick={() => navigate("/profile")}
              >
                <User size={17} />

                <span>
                  MY PROFILE
                </span>

                <span className="menu-arrow">
                  →
                </span>
              </button>


              <button
                className="sidebar-item"
                onClick={() => navigate("/wishlist")}
              >
                <Heart size={17} />

                <span>
                  WISHLIST
                </span>

                <strong>
                  {user.wishlistCount ?? 0}
                </strong>

              </button>


              <button
                className="sidebar-item"
                onClick={() => navigate("/wallet")}
              >
                <Wallet size={17} />

                <span>
                  WALLET
                </span>

                <strong>
                  ₹{user.wallet ?? 0}
                </strong>

              </button>


              <button
                className="sidebar-item"
                onClick={() => navigate("/coupons")}
              >
                <Ticket size={17} />

                <span>
                  COUPONS
                </span>

              </button>


              <button
                className="sidebar-item"
                onClick={() => navigate("/addresses")}
              >
                <MapPin size={17} />

                <span>
                  SAVED ADDRESSES
                </span>

              </button>


              <button
                className="sidebar-item"
                onClick={() => navigate("/change-password")}
              >
                <Lock size={17} />

                <span>
                  CHANGE PASSWORD
                </span>

              </button>


              <button
                className="sidebar-item logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />

                <span>
                  SIGN OUT
                </span>

              </button>

            </div>

          </div>

        </aside>


        {/* =====================================================
            RIGHT CONTENT
        ===================================================== */}

        <section className="profile-content">


          {/* =====================================================
              PROFILE INTRO
          ===================================================== */}

          <div className="profile-intro">

            <div>

              <p className="eyebrow">
                ACCOUNT DASHBOARD
                <span>•</span>
                PRIVATE CLIENT SALON
              </p>

              <h1>
                My Profile
              </h1>

              <p className="intro-text">
                Curate your personal details, saved addresses,
                account information, and verified membership
                privileges.
              </p>

            </div>


            <button
              className="edit-profile-btn"
              onClick={() => navigate("/edit-profile")}
            >
              <Edit3 size={15} />
              EDIT PROFILE
            </button>

          </div>


          {/* =====================================================
              PERSONAL DOSSIER
          ===================================================== */}

          <div className="dossier-card">

            <div className="section-heading">

              <div>

                <h2>
                  <span>•</span>
                  Personal Dossier
                </h2>

                <p>
                  Your personal information stored securely
                  in your Elarque account.
                </p>

              </div>


              <button
                className="modify-btn"
                onClick={() => navigate("/edit-profile")}
              >
                MODIFY DETAILS
              </button>

            </div>


            <div className="details-grid">


              {/* FULL NAME */}

              <div className="detail-box">

                <div className="detail-icon">
                  <User size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    FULL NAME
                  </label>

                  <h3>
                    {user.fullName || "Not added"}
                  </h3>

                  <small>
                    REGISTERED ACCOUNT NAME
                  </small>

                </div>

              </div>


              {/* EMAIL */}

              <div className="detail-box">

                <div className="detail-icon">
                  <Mail size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    EMAIL ADDRESS
                  </label>

                  <h3>
                    {user.email || "Not added"}
                  </h3>

                  <small>
                    <ShieldCheck size={11} />
                    VERIFIED ACCOUNT EMAIL
                  </small>

                </div>

              </div>


              {/* PHONE */}

              <div className="detail-box">

                <div className="detail-icon">
                  <Phone size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    PHONE NUMBER
                  </label>

                  <h3>
                    {user.phoneNumber || "Not added"}
                  </h3>

                  <small>
                    REGISTERED PHONE NUMBER
                  </small>

                </div>

              </div>


              {/* DATE OF BIRTH */}

              <div className="detail-box">

                <div className="detail-icon">
                  <Calendar size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    DATE OF BIRTH
                  </label>

                  <h3>
                    {user.dateOfBirth || "Not added"}
                  </h3>

                  <small>
                    PERSONAL DETAILS
                  </small>

                </div>

              </div>


              {/* GENDER */}

              <div className="detail-box">

                <div className="detail-icon">
                  <User size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    GENDER
                  </label>

                  <h3>
                    {user.gender || "Not added"}
                  </h3>

                  <small>
                    PROFILE INFORMATION
                  </small>

                </div>

              </div>


              {/* ADDRESS */}

              <div className="detail-box">

                <div className="detail-icon">
                  <MapPinned size={18} />
                </div>

                <div className="detail-content">

                  <label>
                    SAVED ADDRESS
                  </label>

                  <h3>
                    {formatAddress(user.address)}
                  </h3>

                  <small>
                    PRIMARY DELIVERY ADDRESS
                  </small>

                </div>

              </div>

            </div>

          </div>


          {/* =====================================================
              STAT CARDS
          ===================================================== */}

          <div className="profile-stats">

            <div className="stat-card">

              <div className="stat-top">

                <span>
                  ATELIER
                  <br />
                  COMMISSIONS
                </span>

                <div className="stat-icon">
                  <Ticket size={16} />
                </div>

              </div>

              <strong>
                {user.orderCount ?? 0}
              </strong>

              <p>
                Completed orders
              </p>

              <button
                onClick={() => navigate("/orders")}
              >
                VIEW ORDERS →
              </button>

            </div>


            <div className="stat-card">

              <div className="stat-top">

                <span>
                  CURATED
                  <br />
                  WISHLIST
                </span>

                <div className="stat-icon">
                  <Heart size={16} />
                </div>

              </div>

              <strong>
                {user.wishlistCount ?? 0}
              </strong>

              <p>
                Products saved to wishlist
              </p>

              <button
                onClick={() => navigate("/wishlist")}
              >
                VIEW WISHLIST →
              </button>

            </div>


            <div className="stat-card">

              <div className="stat-top">

                <span>
                  ATELIER VAULT
                  <br />
                  CREDIT
                </span>

                <div className="stat-icon">
                  <Wallet size={16} />
                </div>

              </div>

              <strong>
                ₹{user.wallet ?? 0}
              </strong>

              <p>
                Available wallet balance
              </p>

              <button
                onClick={() => navigate("/wallet")}
              >
                VIEW WALLET →
              </button>

            </div>

          </div>


          {/* =====================================================
              REFERRAL
          ===================================================== */}

          <div className="referral-card">

            <div className="referral-icon">
              <Ticket size={20} />
            </div>

            <p className="referral-label">
              EXCLUSIVE PATRON INVITATION
            </p>

            <h2>
              Invite Friends & Patrons
            </h2>

            <p className="referral-description">
              Share your exclusive Elarque referral code
              with your friends and family.
            </p>


            <div className="referral-code-area">

              <div className="referral-code">

                <span>
                  REFERRAL KEY:
                </span>

                <strong>
                  {user.referralCode || "Not available"}
                </strong>

              </div>


              <button
                className="copy-btn"
                onClick={copyReferralCode}
              >
                <Copy size={14} />

                {copied ? "COPIED" : "COPY CODE"}
              </button>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="profile-footer">

        <div className="footer-column">

          <h2>
            ELARQUE
          </h2>

          <p>
            Haute couture western tailoring curated with
            architectural composition and legacy European
            craftsmanship.
          </p>

          <small>
            🔒 TLS 256-BIT ENCRYPTED VAULT
          </small>

        </div>


        <div className="footer-column">

          <h3>
            SALONS HAUTE COUTURE
          </h3>

          <p>
            Paris: 12 Place Vendôme, 75001
          </p>

          <p>
            Milan: Via Monte Napoleone 8, 20121
          </p>

          <p>
            Dallas: Highland Park Village
          </p>

        </div>


        <div className="footer-column">

          <h3>
            SHOP ATELIER
          </h3>

          <p>
            RUNWAY CAPES & DUST-COATS
          </p>

          <p>
            SCULPTED LEATHER SILHOUETTES
          </p>

          <p>
            EQUESTRIAN SILK TAILORING
          </p>

          <p>
            BESPOKE FITTING SCHEDULE
          </p>

        </div>


        <div className="footer-column">

          <h3>
            MONOGRAPH JOURNAL
          </h3>

          <p>
            Receive seasonal salon folios, private salon
            viewings, and limited archive drops.
          </p>

        </div>


        <div className="footer-bottom">
          © 2026 ELARQUE • TIMELESS ELEGANCE • MODERN CONFIDENCE
        </div>

      </footer>


      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .profile-page {
          min-height: 100vh;
          background: #f7f0ea;
          color: #3b2527;
          font-family: "Poppins", Arial, sans-serif;
        }


        /* ================= HEADER ================= */

        .profile-header {
          height: 92px;
          background: #fffdfa;
          display: flex;
          align-items: center;
          padding: 0 7%;
          border-bottom: 1px solid #eee3db;
        }

        .profile-logo {
          font-family: Georgia, serif;
          font-size: 27px;
          font-weight: bold;
          letter-spacing: 3px;
          color: #641021;
          cursor: pointer;
        }

        .profile-nav {
          display: flex;
          gap: 38px;
          margin-left: 70px;
          flex: 1;
        }

        .profile-nav span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #756a67;
          cursor: pointer;
        }

        .profile-nav span:hover {
          color: #641021;
        }

        .profile-header-icons {
          display: flex;
          gap: 18px;
          align-items: center;
          color: #641021;
        }

        .header-user {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #641021;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }


        /* ================= MAIN ================= */

        .profile-container {
          width: 86%;
          max-width: 1400px;
          margin: 25px auto 70px;
          display: grid;
          grid-template-columns: 225px 1fr;
          gap: 30px;
        }


        /* ================= SIDEBAR ================= */

        .profile-sidebar {
          background: #fffdfa;
          border-radius: 22px;
          padding: 10px;
          height: fit-content;
        }

        .profile-card {
          text-align: center;
          padding: 15px 8px 18px;
        }

        .profile-image-wrapper {
          width: 92px;
          height: 92px;
          margin: 8px auto 15px;
          position: relative;
        }

        .profile-image {
          width: 92px;
          height: 92px;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid #d0b27d;
        }

        .profile-image-placeholder {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: #691124;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, serif;
          font-size: 35px;
          border: 3px solid #d0b27d;
        }

        .profile-camera {
          position: absolute;
          right: -2px;
          bottom: 3px;
          width: 25px;
          height: 25px;
          background: #691124;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-card h2 {
          font-family: Georgia, serif;
          font-size: 19px;
          font-weight: normal;
          margin: 8px 0;
        }

        .client-since {
          font-size: 10px;
          color: #766b68;
        }

        .sidebar-line {
          height: 1px;
          background: #eee5de;
          margin: 20px 10px 10px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item {
          border: none;
          background: transparent;
          width: 100%;
          padding: 13px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #665b58;
          cursor: pointer;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .7px;
          text-align: left;
        }

        .sidebar-item span {
          flex: 1;
        }

        .sidebar-item strong {
          font-size: 9px;
          color: #76655e;
        }

        .sidebar-item:hover {
          background: #f8efea;
        }

        .sidebar-item.active {
          background: #650d20;
          color: white;
        }

        .sidebar-item.active strong {
          color: white;
        }

        .sidebar-item.logout {
          color: #bd3c43;
        }


        /* ================= CONTENT ================= */

        .profile-content {
          min-width: 0;
        }

        .profile-intro {
          background: white;
          border-radius: 14px;
          padding: 32px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .eyebrow {
          font-size: 9px;
          letter-spacing: 2px;
          font-weight: 700;
          color: #97764d;
        }

        .eyebrow span {
          margin: 0 8px;
          color: #8c1e32;
        }

        .profile-intro h1 {
          font-family: Georgia, serif;
          color: #650d20;
          font-size: 29px;
          margin: 8px 0;
        }

        .intro-text {
          max-width: 650px;
          color: #746965;
          font-size: 12px;
          line-height: 1.7;
        }

        .edit-profile-btn {
          border: none;
          background: #650d20;
          color: white;
          border-radius: 25px;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(101, 13, 32, .18);
        }

        .edit-profile-btn:hover {
          background: #4e0918;
        }


        /* ================= DOSSIER ================= */

        .dossier-card {
          background: white;
          border-radius: 14px;
          padding: 30px 36px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .section-heading h2 {
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: normal;
          margin: 0;
        }

        .section-heading h2 span {
          color: #a68136;
          margin-right: 5px;
        }

        .section-heading p {
          font-size: 10px;
          color: #837773;
        }

        .modify-btn {
          background: none;
          border: none;
          color: #94753d;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.3px;
          cursor: pointer;
        }


        /* ================= DETAILS ================= */

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .detail-box {
          min-height: 85px;
          background: #f9f6f3;
          border-radius: 8px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .detail-icon {
          width: 35px;
          height: 35px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6d1024;
          flex-shrink: 0;
        }

        .detail-content {
          min-width: 0;
        }

        .detail-box label {
          display: block;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.3px;
          color: #877b76;
          margin-bottom: 4px;
        }

        .detail-box h3 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 14px;
          color: #302526;
          word-break: break-word;
        }

        .detail-box small {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-size: 7px;
          color: #94753d;
          letter-spacing: .7px;
        }


        /* ================= STATS ================= */

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 22px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 22px;
          min-height: 150px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-top span {
          font-size: 8px;
          letter-spacing: 1.5px;
          color: #867871;
          line-height: 1.4;
        }

        .stat-icon {
          width: 31px;
          height: 31px;
          border-radius: 50%;
          background: #f5e9e8;
          color: #6d1024;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .stat-card strong {
          display: block;
          font-family: Georgia, serif;
          color: #701127;
          font-size: 33px;
          font-weight: normal;
          margin: 10px 0 3px;
        }

        .stat-card p {
          font-family: Georgia, serif;
          color: #766b67;
          font-size: 10px;
          margin: 0 0 15px;
        }

        .stat-card button {
          border: none;
          background: none;
          color: #826631;
          font-size: 8px;
          letter-spacing: 1px;
          font-weight: bold;
          cursor: pointer;
          padding: 0;
        }


        /* ================= REFERRAL ================= */

        .referral-card {
          background: white;
          margin-top: 22px;
          padding: 35px;
          border-radius: 12px;
          text-align: center;
        }

        .referral-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fbf0d9;
          color: #9b7535;
        }

        .referral-label {
          margin: 12px 0 4px;
          color: #a08249;
          font-size: 8px;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .referral-card h2 {
          font-family: Georgia, serif;
          font-weight: normal;
          color: #671024;
          margin: 5px;
        }

        .referral-description {
          max-width: 600px;
          margin: 10px auto 20px;
          color: #766c68;
          font-size: 10px;
          line-height: 1.7;
        }

        .referral-code-area {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .referral-code {
          background: #f2eeea;
          padding: 12px 20px;
          border-radius: 25px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .referral-code span {
          font-size: 7px;
          letter-spacing: 1px;
          color: #766d68;
        }

        .referral-code strong {
          font-family: Georgia, serif;
          letter-spacing: 1.5px;
          color: #49272d;
        }

        .copy-btn {
          border: none;
          background: #650d20;
          color: white;
          padding: 13px 20px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          letter-spacing: 1px;
          cursor: pointer;
        }


        /* ================= FOOTER ================= */

        .profile-footer {
          background: #570719;
          color: #e8d4b7;
          padding: 50px 7% 25px;
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 1fr;
          gap: 45px;
        }

        .footer-column h2 {
          font-family: Georgia, serif;
          letter-spacing: 3px;
        }

        .footer-column h3 {
          font-size: 9px;
          letter-spacing: 1.8px;
        }

        .footer-column p {
          font-size: 9px;
          line-height: 1.7;
          color: #d7c0b3;
        }

        .footer-column small {
          font-size: 8px;
        }

        .footer-bottom {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(255,255,255,.2);
          padding-top: 20px;
          font-size: 8px;
          letter-spacing: 1px;
        }


        /* ================= RESPONSIVE ================= */

        @media (max-width: 1000px) {

          .profile-nav {
            gap: 15px;
            margin-left: 30px;
          }

          .profile-container {
            width: 92%;
            grid-template-columns: 190px 1fr;
          }

          .profile-stats {
            grid-template-columns: 1fr;
          }

        }


        @media (max-width: 750px) {

          .profile-header {
            padding: 0 20px;
          }

          .profile-nav {
            display: none;
          }

          .profile-container {
            width: 94%;
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .profile-intro {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .profile-footer {
            grid-template-columns: 1fr 1fr;
          }

          .referral-code-area {
            flex-direction: column;
          }

        }


        @media (max-width: 500px) {

          .profile-container {
            margin-top: 15px;
          }

          .profile-intro,
          .dossier-card {
            padding: 22px;
          }

          .section-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .referral-card {
            padding: 25px 15px;
          }

          .referral-code {
            width: 100%;
            justify-content: center;
            flex-direction: column;
          }

          .copy-btn {
            width: 100%;
            justify-content: center;
          }

          .profile-footer {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}

export default Profile;