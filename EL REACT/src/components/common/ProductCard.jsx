import React, { useState } from "react";
import { Heart, Star, ShoppingBag } from "lucide-react";
import formatPrice from "../../utils/formatPrice";

function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  badgeType = "BEST SELLER",
}) {
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    const nextState = !wishlistActive;
    setWishlistActive(nextState);
    if (onToggleWishlist) {
      onToggleWishlist(product, nextState);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const displayBadge = product.badge || badgeType;

  return (
    <article className="el-product-card" aria-label={product.name}>
      <div className="el-card-image-wrap">
        {/* Top Badges */}
        <div className="el-card-badges">
          {displayBadge && (
            <span
              className={`el-badge-pill ${
                displayBadge === "NEW" ? "el-badge-new" : "el-badge-bestseller"
              }`}
            >
              {displayBadge}
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
          src={product.image}
          alt={product.name}
          className={`el-card-img ${imageLoaded ? "loaded" : "loading"}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Quick Add Overlay on Hover */}
        <div className="el-card-overlay-action">
          <button
            className="el-quick-add-btn"
            onClick={handleAddToCartClick}
            type="button"
          >
            <ShoppingBag size={15} /> QUICK ADD
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="el-card-content">
        {/* Rating Row */}
        <div className="el-card-rating">
          <div className="el-stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill="#C49E60"
                stroke="#C49E60"
                strokeWidth={1}
              />
            ))}
          </div>
          <span className="el-rating-value">{product.rating || "5.0"}</span>
          {product.reviewsCount && (
            <span className="el-rating-count">({product.reviewsCount})</span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="el-card-title">{product.name}</h3>

        {/* Fabric / Subtitle */}
        {product.fabric && (
          <p className="el-card-fabric">{product.fabric}</p>
        )}

        {/* Price Row */}
        <div className="el-card-price-row">
          <span className="el-price-current">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="el-price-original">
              {formatPrice(product.originalPrice)}
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

        .el-badge-new {
          background-color: rgba(247, 242, 235, 0.95);
          color: var(--el-burgundy);
          border: 1px solid #DFCEBE;
        }

        .el-badge-bestseller {
          background: linear-gradient(135deg, #F5E8D0 0%, #E7C994 100%);
          color: #4A2E05;
          border: 1px solid rgba(196, 158, 96, 0.4);
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
          transition: background-color 0.25s ease;
        }

        .el-quick-add-btn:hover {
          background-color: var(--el-burgundy-deep);
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
