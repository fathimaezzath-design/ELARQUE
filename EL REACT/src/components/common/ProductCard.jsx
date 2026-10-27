import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingBag, Loader2 } from "lucide-react";
import formatPrice from "../../utils/formatPrice";
import { addToCart } from "../../services/cartService";
import { showCartToast, showWishlistToast, showAuthToast } from "../../utils/toast";

// Helper to safely resolve image paths (uploads vs external URLs)
const resolveImageUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=85";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  badgeType,
  onClick,
}) {
  const navigate = useNavigate();
  const prodId = product?.id || product?._id;

  // Initialize wishlist from props or local session storage
  const [wishlistActive, setWishlistActive] = useState(() => {
    if (isWishlisted) return true;
    try {
      const saved = localStorage.getItem("elarque_session_wishlist");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && prodId) {
          return list.includes(prodId);
        }
      }
    } catch {}
    return false;
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imgSrc, setImgSrc] = useState(() =>
    resolveImageUrl(product?.image || product?.coverImage || (product?.images && product?.images[0]))
  );

  useEffect(() => {
    setImgSrc(
      resolveImageUrl(
        product?.image ||
          product?.coverImage ||
          (product?.images && product?.images[0])
      )
    );
  }, [product]);

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (prodId) {
      navigate(`/products/${prodId}`);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    const nextState = !wishlistActive;
    setWishlistActive(nextState);

    // Sync with elarque_session_wishlist in localStorage
    try {
      const saved = localStorage.getItem("elarque_session_wishlist");
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      if (nextState) {
        if (prodId && !list.includes(prodId)) list.push(prodId);
      } else {
        list = list.filter((id) => id !== prodId);
      }
      localStorage.setItem("elarque_session_wishlist", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("elarque_wishlist_updated", { detail: list }));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // Trigger luxury pop-up notification
    showWishlistToast(product, nextState);

    if (onToggleWishlist) {
      onToggleWishlist(product, nextState);
    }
  };

  const handleAddToCartClick = async (e) => {
    e.stopPropagation();
    if (addingToCart) return;

    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showAuthToast();
      return;
    }

    setAddingToCart(true);
    try {
      const targetId = prodId;
      const variants = product?.variants || [];
      const firstInStockVariant =
        variants.find((v) => Number(v.stock) > 0) || variants[0];
      const variantId = firstInStockVariant?._id || firstInStockVariant?.id;

      const res = await addToCart(targetId, variantId, 1);
      if (res?.data?.success && res?.data?.cart) {
        window.dispatchEvent(
          new CustomEvent("elarque_cart_updated", { detail: res.data.cart })
        );
      }
      showCartToast(product);
    } catch (err) {
      console.warn("Could not quick add to bag, navigating to garment details:", err);
      if (prodId) {
        navigate(`/products/${prodId}`);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Determine badge:
  // 1. Explicit product.badge
  // 2. Section-specific badgeType (e.g. "NEW" for New Arrivals, "BEST SELLER" for Best Sellers)
  // 3. Fallback to product flags: isBestSeller -> "BEST SELLER", isFeatured -> "FEATURED"
  const displayBadge =
    product?.badge ||
    badgeType ||
    (product?.isBestSeller
      ? "BEST SELLER"
      : product?.isFeatured
      ? "FEATURED"
      : null);

  // Price calculations
  const hasSale =
    product?.salePrice !== undefined &&
    product?.salePrice !== null &&
    Number(product?.salePrice) < Number(product?.price);

  const currentPrice = hasSale ? product.salePrice : product?.price;
  const originalPrice = hasSale
    ? product.price
    : product?.originalPrice && Number(product.originalPrice) > Number(product?.price)
    ? product.originalPrice
    : null;

  const discountPercentage =
    product?.discountPercentage ||
    (hasSale && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null);

  // Subtitle / fabric
  const subtitle =
    product?.fabric ||
    product?.category?.name ||
    product?.brand ||
    product?.description?.slice(0, 40) ||
    "";

  // In-stock state
  const isOutOfStock =
    product?.inStock === false ||
    (product?.stock !== undefined && Number(product?.stock) <= 0);

  return (
    <article
      className="el-product-card"
      aria-label={product?.name}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="el-card-image-wrap">
        {/* Top Badges */}
        <div className="el-card-badges">
          {isOutOfStock ? (
            <span className="el-badge-pill el-badge-outofstock">OUT OF STOCK</span>
          ) : displayBadge ? (
            <span
              className={`el-badge-pill ${
                displayBadge === "NEW" ? "el-badge-new" : "el-badge-bestseller"
              }`}
            >
              {displayBadge}
            </span>
          ) : null}

          {discountPercentage && (
            <span className="el-badge-pill el-badge-discount">
              {discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          className={`el-wishlist-toggle ${wishlistActive ? "active" : ""}`}
          onClick={handleWishlistClick}
          aria-label={wishlistActive ? "Remove from Wishlist" : "Add to Wishlist"}
          type="button"
        >
          <Heart
            size={17}
            fill={wishlistActive ? "var(--el-burgundy)" : "none"}
            stroke={wishlistActive ? "var(--el-burgundy)" : "#4A423D"}
            strokeWidth={2}
          />
        </button>

        {/* Image with Skeleton/Fallback */}
        <img
          src={imgSrc}
          alt={product?.name || "Product silhouette"}
          className={`el-card-img ${imageLoaded ? "loaded" : "loading"}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImgSrc(
              "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=85"
            );
            setImageLoaded(true);
          }}
        />

        {/* Quick Add Overlay on Hover */}
        {!isOutOfStock && (
          <div className="el-card-overlay-action">
            <button
              className="el-quick-add-btn"
              onClick={handleAddToCartClick}
              type="button"
              disabled={addingToCart}
            >
              {addingToCart ? (
                <>
                  <Loader2 size={15} className="spin-icon" /> ADDING...
                </>
              ) : (
                <>
                  <ShoppingBag size={15} /> QUICK ADD
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="el-card-content">
        {/* Rating Row — only rendered when genuine review data exists */}
        {product?.rating && product?.reviewsCount > 0 ? (
          <div className="el-card-rating">
            <div className="el-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < Math.round(Number(product.rating)) ? "#C49E60" : "none"}
                  stroke="#C49E60"
                  strokeWidth={1}
                />
              ))}
            </div>
            <span className="el-rating-value">{Number(product.rating).toFixed(1)}</span>
            <span className="el-rating-count">({product.reviewsCount})</span>
          </div>
        ) : null}

        {/* Product Name */}
        <h3 className="el-card-title">{product?.name}</h3>

        {/* Fabric / Subtitle */}
        {subtitle && <p className="el-card-fabric">{subtitle}</p>}

        {/* Price Row */}
        <div className="el-card-price-row">
          <span className="el-price-current">
            {formatPrice(currentPrice)}
          </span>
          {originalPrice && (
            <span className="el-price-original">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .el-product-card {
          background-color: #FFFFFF;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--el-border);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .el-product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 30px rgba(82, 8, 20, 0.08);
          border-color: #D6C7B7;
        }

        .el-card-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background-color: #F3EFE9;
        }

        .el-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }

        .el-card-img.loading {
          opacity: 0.6;
        }

        .el-card-img.loaded {
          opacity: 1;
        }

        .el-product-card:hover .el-card-img {
          transform: scale(1.04);
        }

        .el-card-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .el-badge-pill {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          backdrop-filter: blur(4px);
        }

        .el-badge-new,
        .el-badge-bestseller {
          background: linear-gradient(135deg, #F5E8D0 0%, #E7C994 100%);
          color: #4A2E05;
          border: 1px solid rgba(196, 158, 96, 0.4);
        }

        .el-badge-discount {
          background-color: rgba(82, 8, 20, 0.92);
          color: #FAF6F0;
        }

        .el-badge-outofstock {
          background-color: rgba(30, 26, 24, 0.88);
          color: #FAF6F0;
        }

        .el-wishlist-toggle {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 3;
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.25s ease;
          border: none;
          cursor: pointer;
        }

        .el-wishlist-toggle:hover {
          transform: scale(1.1);
          background-color: #FFFFFF;
        }

        .el-wishlist-toggle.active {
          background-color: #FFFFFF;
        }

        .el-card-overlay-action {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 3;
        }

        .el-product-card:hover .el-card-overlay-action {
          opacity: 1;
          transform: translateY(0);
        }

        .el-quick-add-btn {
          width: 100%;
          padding: 10px 16px;
          background-color: rgba(82, 8, 20, 0.95);
          color: #FAF6F0;
          border-radius: var(--radius-full);
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.25s ease;
        }

        .el-quick-add-btn:hover:not(:disabled) {
          background-color: var(--el-burgundy-deep);
        }

        .el-quick-add-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .el-card-content {
          padding: 16px 18px 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .el-card-rating {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
        }

        .el-stars {
          display: flex;
          gap: 2px;
        }

        .el-rating-value {
          font-size: 11.5px;
          font-weight: 600;
          color: #2D2825;
        }

        .el-rating-count {
          font-size: 11px;
          color: var(--el-text-muted);
        }

        .el-card-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-heading);
          margin: 0 0 4px;
          line-height: 1.25;
        }

        .el-card-fabric {
          font-family: var(--font-sans);
          font-size: 11.5px;
          color: var(--el-text-muted);
          margin: 0 0 10px;
          line-height: 1.35;
        }

        .el-card-price-row {
          margin-top: auto;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .el-price-current {
          font-family: var(--font-sans);
          font-size: 16px;
          font-weight: 600;
          color: var(--el-burgundy);
        }

        .el-price-original {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--el-text-light);
          text-decoration: line-through;
        }
      `}</style>
    </article>
  );
}

export default ProductCard;
