import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import UserLayout from "../../layouts/UserLayout";
import { getProductById } from "../../services/productService";

// Image URL resolver consistent with Collections & ProductDetails
const resolveImageUrl = (url) => {
  if (!url) return "/placeholder-image.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

// Safe currency formatter
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

// Safe helper to read session wishlist from localStorage
const getStoredWishlistIds = () => {
  try {
    const saved = localStorage.getItem("elarque_session_wishlist");
    if (!saved) return [];
    const list = JSON.parse(saved);
    return Array.isArray(list) ? Array.from(new Set(list.filter(Boolean))) : [];
  } catch {
    return [];
  }
};

function Wishlist() {
  const navigate = useNavigate();
  const [wishlistIds, setWishlistIds] = useState(getStoredWishlistIds);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load product data for saved IDs
  const loadWishlistProducts = useCallback(async (ids) => {
    if (!ids || ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        ids.map((id) => getProductById(id))
      );

      const loaded = [];
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value?.data?.success && res.value?.data?.product) {
          loaded.push(res.value.data.product);
        }
      });

      setProducts(loaded);
    } catch (err) {
      console.error("Failed to load wishlist products:", err);
      setError("Unable to load saved garments at this moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWishlistProducts(wishlistIds);
  }, [loadWishlistProducts, wishlistIds]);

  // Synchronize on external changes (e.g. other tabs or custom events)
  useEffect(() => {
    const handleSync = () => {
      const current = getStoredWishlistIds();
      setWishlistIds(current);
    };

    window.addEventListener("elarque_wishlist_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("elarque_wishlist_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Remove product from wishlist
  const handleRemove = (productId, e) => {
    if (e) e.stopPropagation();

    const nextIds = wishlistIds.filter(
      (id) => id !== productId && id !== String(productId)
    );
    setWishlistIds(nextIds);
    setProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId));

    try {
      localStorage.setItem("elarque_session_wishlist", JSON.stringify(nextIds));
    } catch (err) {
      console.error("Failed to update localStorage:", err);
    }

    // Notify Navbar and other listeners of updated wishlist
    window.dispatchEvent(
      new CustomEvent("elarque_wishlist_updated", { detail: nextIds })
    );
  };

  return (
    <UserLayout>
      <div className="el-wishlist-page">
        <div className="el-wishlist-container">
          {/* Breadcrumb & Navigation */}
          <div className="el-wishlist-nav-header">
            <button
              type="button"
              className="el-wishlist-back-btn"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="el-wishlist-breadcrumbs">
              <Link to="/">Home</Link>
              <span className="el-sep">/</span>
              <span className="el-current">Wishlist</span>
            </div>
          </div>

          {/* Page Title & Count Banner */}
          <div className="el-wishlist-title-bar">
            <div>
              <h1 className="el-wishlist-heading">Private Wishlist</h1>
              <p className="el-wishlist-sub">
                Your personally curated collection of bespoke haute couture silhouettes.
              </p>
            </div>
            {!loading && products.length > 0 && (
              <span className="el-wishlist-count-pill">
                {products.length} {products.length === 1 ? "Silhouette" : "Silhouettes"}
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="el-wishlist-state-box">
              <div className="el-wishlist-spinner" />
              <h3>Retrieving Archival Silhouettes</h3>
              <p>Fetching specifications and imagery for your saved selection...</p>
            </div>
          ) : error ? (
            <div className="el-wishlist-state-box">
              <h3>Notice</h3>
              <p>{error}</p>
              <button
                type="button"
                className="el-wishlist-cta-btn"
                onClick={() => loadWishlistProducts(wishlistIds)}
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="el-wishlist-empty-card">
              <div className="el-wishlist-empty-icon-wrap">
                <Heart size={36} strokeWidth={1.5} color="#5c061c" />
              </div>
              <h2 className="el-wishlist-empty-title">Your Wishlist is Empty</h2>
              <p className="el-wishlist-empty-sub">
                Explore our latest lookbook and save your favorite bespoke garments,
                tailored silhouettes, and archival pieces for future consultations.
              </p>
              <Link to="/collections" className="el-wishlist-cta-btn">
                <Sparkles size={16} />
                <span>Explore Collections</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Product Grid */
            <div className="el-wishlist-grid">
              {products.map((product) => {
                const prodId = product.id || product._id;
                const coverImg = resolveImageUrl(
                  product.coverImage || (product.images && product.images[0])
                );
                const price = product.salePrice || product.price;
                const categoryName = product.category?.name || product.category;

                return (
                  <article
                    key={prodId}
                    className="el-wishlist-card"
                    onClick={() => navigate(`/products/${prodId}`)}
                  >
                    {/* Image Wrap */}
                    <div className="el-card-media">
                      <img
                        src={coverImg}
                        alt={product.name}
                        className="el-card-img"
                        loading="lazy"
                      />

                      {/* Remove / Heart Active Button */}
                      <button
                        type="button"
                        className="el-card-heart-btn active"
                        onClick={(e) => handleRemove(prodId, e)}
                        aria-label="Remove from Wishlist"
                        title="Remove from Wishlist"
                      >
                        <Heart size={16} fill="#5c061c" stroke="#5c061c" />
                      </button>

                      {product.isBestSeller && (
                        <span className="el-card-badge">Best Seller</span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="el-card-body">
                      {categoryName && (
                        <span className="el-card-category">
                          {typeof categoryName === "string"
                            ? categoryName.toUpperCase()
                            : "HAUTE COUTURE"}
                        </span>
                      )}
                      <h3 className="el-card-title">{product.name}</h3>
                      <div className="el-card-footer">
                        <span className="el-card-price">{formatINR(price)}</span>
                        <button
                          type="button"
                          className="el-card-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${prodId}`);
                          }}
                        >
                          <ShoppingBag size={14} />
                          <span>View Garment</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          .el-wishlist-page {
            min-height: calc(100vh - 160px);
            background-color: var(--el-cream, #FAF6F0);
            padding: 32px 24px 64px;
            color: #1A1A1A;
          }

          .el-wishlist-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .el-wishlist-nav-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 13px;
          }

          .el-wishlist-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            color: #5c061c;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 0;
            transition: opacity 0.2s;
          }

          .el-wishlist-back-btn:hover {
            opacity: 0.75;
          }

          .el-wishlist-breadcrumbs {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8c827a;
          }

          .el-wishlist-breadcrumbs a {
            color: #8c827a;
            text-decoration: none;
            transition: color 0.2s;
          }

          .el-wishlist-breadcrumbs a:hover {
            color: #5c061c;
          }

          .el-wishlist-breadcrumbs .el-current {
            color: #5c061c;
            font-weight: 500;
          }

          .el-wishlist-title-bar {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(92, 6, 28, 0.15);
            margin-bottom: 36px;
            gap: 16px;
            flex-wrap: wrap;
          }

          .el-wishlist-heading {
            font-family: var(--font-serif, "Playfair Display", Georgia, serif);
            font-size: 32px;
            font-weight: 600;
            color: #5c061c;
            margin: 0 0 8px;
            letter-spacing: 0.5px;
          }

          .el-wishlist-sub {
            font-size: 14px;
            color: #6b635b;
            margin: 0;
          }

          .el-wishlist-count-pill {
            background-color: rgba(92, 6, 28, 0.08);
            color: #5c061c;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid rgba(92, 6, 28, 0.18);
          }

          /* State box (Loading / Error) */
          .el-wishlist-state-box {
            text-align: center;
            padding: 64px 24px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            margin: 40px auto;
            max-width: 500px;
          }

          .el-wishlist-state-box h3 {
            font-family: var(--font-serif, "Playfair Display", Georgia, serif);
            color: #5c061c;
            font-size: 20px;
            margin-bottom: 8px;
          }

          .el-wishlist-state-box p {
            color: #7d706b;
            font-size: 14px;
            margin: 0;
          }

          .el-wishlist-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid rgba(92, 6, 28, 0.15);
            border-top-color: #5c061c;
            border-radius: 50%;
            animation: elSpin 0.8s linear infinite;
            margin: 0 auto 16px;
          }

          @keyframes elSpin {
            to {
              transform: rotate(360deg);
            }
          }

          /* Empty State */
          .el-wishlist-empty-card {
            text-align: center;
            padding: 72px 24px;
            background: #ffffff;
            border: 1px solid rgba(92, 6, 28, 0.1);
            border-radius: 8px;
            max-width: 640px;
            margin: 32px auto;
            box-shadow: 0 4px 20px rgba(92, 6, 28, 0.04);
          }

          .el-wishlist-empty-icon-wrap {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background-color: rgba(92, 6, 28, 0.06);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }

          .el-wishlist-empty-title {
            font-family: var(--font-serif, "Playfair Display", Georgia, serif);
            font-size: 26px;
            font-weight: 600;
            color: #5c061c;
            margin: 0 0 12px;
          }

          .el-wishlist-empty-sub {
            color: #6b635b;
            font-size: 14px;
            line-height: 1.6;
            max-width: 460px;
            margin: 0 auto 28px;
          }

          .el-wishlist-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #5c061c;
            color: #ffffff;
            text-decoration: none;
            padding: 13px 28px;
            border-radius: 24px;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.5px;
            transition: all 0.25s ease;
            border: none;
            cursor: pointer;
          }

          .el-wishlist-cta-btn:hover {
            background: #400413;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(92, 6, 28, 0.25);
          }

          /* Products Grid */
          .el-wishlist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 28px;
          }

          /* Product Card */
          .el-wishlist-card {
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }

          .el-wishlist-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 24px rgba(92, 6, 28, 0.08);
          }

          .el-card-media {
            position: relative;
            width: 100%;
            padding-top: 130%;
            background-color: #f2ede7;
            overflow: hidden;
          }

          .el-card-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
          }

          .el-wishlist-card:hover .el-card-img {
            transform: scale(1.04);
          }

          .el-card-heart-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 2;
          }

          .el-card-heart-btn:hover {
            background: #ffffff;
            transform: scale(1.1);
          }

          .el-card-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #5c061c;
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.5px;
            padding: 4px 8px;
            border-radius: 3px;
            text-transform: uppercase;
          }

          .el-card-body {
            padding: 16px 18px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .el-card-category {
            font-size: 11px;
            letter-spacing: 1.5px;
            color: #8c827a;
            font-weight: 600;
            margin-bottom: 6px;
          }

          .el-card-title {
            font-family: var(--font-serif, "Playfair Display", Georgia, serif);
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 14px;
            line-height: 1.35;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 42px;
          }

          .el-card-footer {
            margin-top: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
          }

          .el-card-price {
            font-size: 15px;
            font-weight: 600;
            color: #5c061c;
          }

          .el-card-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: 1px solid rgba(92, 6, 28, 0.25);
            color: #5c061c;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.5px;
            padding: 6px 12px;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .el-card-action-btn:hover {
            background: #5c061c;
            color: #ffffff;
            border-color: #5c061c;
          }

          @media (max-width: 768px) {
            .el-wishlist-heading {
              font-size: 26px;
            }
            .el-wishlist-grid {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 16px;
            }
            .el-card-body {
              padding: 12px;
            }
            .el-card-title {
              font-size: 14px;
              min-height: 38px;
            }
          }
        `}</style>
      </div>
    </UserLayout>
  );
}

export default Wishlist;
