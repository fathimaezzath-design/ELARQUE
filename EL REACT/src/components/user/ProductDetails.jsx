import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Gift,
  ZoomIn,
  Maximize2,
  X,
  AlertCircle,
  RefreshCw,
  Star,
  Check,
  ArrowLeft,
  Ruler,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { getProductById } from "../../services/productService";
import "./ProductDetails.css";

const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL"];

// French / European Atelier sizing labels
const SIZING_SUBTEXT = {
  XS: "FR 34",
  S: "FR 36",
  M: "FR 38",
  L: "FR 40",
  XL: "FR 42",
};

// Luxury Atelier Color Palette Mapping
const getColorHex = (color) => {
  if (!color) return "#5a1e2a";
  const c = color.toLowerCase().trim();
  const colorMap = {
    black: "#111827",
    onyx: "#111827",
    "obsidian black": "#141414",
    white: "#f8fafc",
    burgundy: "#7a1526",
    "vintage burgundy": "#6b1f2a",
    maroon: "#800000",
    cream: "#dfc28d",
    champagne: "#f5e6ca",
    gold: "#dfc28d",
    navy: "#1e3a8a",
    midnight: "#0f172a",
    blue: "#3b82f6",
    charcoal: "#374151",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#78350f",
    taupe: "#8b7e74",
    green: "#15803d",
    emerald: "#059669",
    olive: "#556b2f",
    red: "#dc2626",
    pink: "#ec4899",
    beige: "#f5f5dc",
  };
  return colorMap[c] || "#5a1e2a";
};

// Image resolver
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

// Currency formatter
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Product & Related State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Variant Selection State
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Gallery & Zoom State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const imageContainerRef = useRef(null);

  // Modals & User Feedback
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [shareNotice, setShareNotice] = useState(false);

  // Local Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 1. Fetch Product Details
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchProduct = async () => {
      if (!id) {
        setError("Product identifier is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getProductById(id);
        if (!isMounted) return;

        if (response.data?.success && response.data?.product) {
          const prod = response.data.product;
          setProduct(prod);
          setRelatedProducts(response.data.relatedProducts || []);

          // Initialize variant selections
          if (Array.isArray(prod.variants) && prod.variants.length > 0) {
            // Find first in-stock variant or fallback to first
            const defaultVariant =
              prod.variants.find((v) => Number(v.stock) > 0) || prod.variants[0];

            setSelectedColor(defaultVariant.color || "");
            setSelectedSize(defaultVariant.size || "");
          } else {
            setSelectedColor("");
            setSelectedSize("");
          }

          setActiveImageIndex(0);
          setQuantity(1);

          // Check session wishlist
          try {
            const saved = localStorage.getItem("elarque_session_wishlist");
            if (saved) {
              const list = JSON.parse(saved);
              setIsWishlisted(list.includes(prod.id || prod._id));
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setError("Product not found or currently unavailable in the atelier catalog.");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setError("This luxury garment is currently unavailable or has been archived from the salon collection.");
        } else if (err.response?.status === 400) {
          setError("Invalid garment reference identifier.");
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to retrieve garment details. Please check connection and retry."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id, retryTrigger]);

  // Derived variants by color
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => (v.color || "").trim()).filter(Boolean))];
  }, [product]);

  // Derived sizes for currently selected color (or all variants if color not selected)
  const sizesForSelectedColor = useMemo(() => {
    if (!product?.variants) return [];
    if (!selectedColor) return product.variants;
    return product.variants.filter(
      (v) => (v.color || "").trim().toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product, selectedColor]);

  // Currently matched specific variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find(
        (v) =>
          (!selectedColor || (v.color || "").trim().toLowerCase() === selectedColor.toLowerCase()) &&
          (!selectedSize || (v.size || "").trim().toUpperCase() === selectedSize.toUpperCase())
      ) || null
    );
  }, [product, selectedColor, selectedSize]);

  // Gallery images: prefer variant images if present, fallback to product images
  const galleryImages = useMemo(() => {
    if (selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product?.coverImage) {
      return [product.coverImage];
    }
    return [];
  }, [product, selectedVariant]);

  // Derive safe active image index
  const safeImageIndex =
    activeImageIndex >= galleryImages.length ? 0 : activeImageIndex;
  const activeMainImage =
    galleryImages[safeImageIndex] || product?.coverImage || null;

  // Selected variant stock and status
  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const isVariantSelected = !hasVariants || Boolean(selectedVariant && (!availableColors.length || selectedColor) && (!sizesForSelectedColor.length || selectedSize));
  const currentStock = selectedVariant
    ? Number(selectedVariant.stock) || 0
    : hasVariants
    ? 0
    : Number(product?.stock) || 0;
  const isOutOfStock = !isVariantSelected || currentStock <= 0;
  const isLowStock = isVariantSelected && currentStock > 0 && currentStock <= 5;

  // Derive clamped quantity
  const displayQuantity =
    currentStock > 0 ? Math.min(Math.max(1, quantity), currentStock) : 1;

  // Handle color change (updates available sizes and auto-selects first available size)
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const matchingSizes = (product?.variants || []).filter(
      (v) => (v.color || "").trim().toLowerCase() === color.toLowerCase()
    );
    if (matchingSizes.length > 0) {
      const inStockMatch = matchingSizes.find((v) => Number(v.stock) > 0);
      setSelectedSize((inStockMatch || matchingSizes[0]).size);
    }
    setActiveImageIndex(0);
  };

  // Image zoom handler on mouse move
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomCoords({ x, y });
  };

  // Wishlist toggle
  const handleWishlistToggle = () => {
    if (!product) return;
    const prodId = product.id || product._id;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = localStorage.getItem("elarque_session_wishlist");
        let list = saved ? JSON.parse(saved) : [];
        if (next) {
          if (!list.includes(prodId)) list.push(prodId);
        } else {
          list = list.filter((item) => item !== prodId);
        }
        localStorage.setItem("elarque_session_wishlist", JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Share action
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Explore ${product.name} from ELARQUE Haute Couture.`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareNotice(true);
        setTimeout(() => setShareNotice(false), 3000);
      }
    } catch {
      // User cancelled share
    }
  };

  // Add to Bag / Buy Now action (Transparent notice per step instructions)
  const handleAddToBag = () => {
    if (isOutOfStock) return;
    setCartNotice(
      `Selected: ${product.name} (Size: ${selectedSize}, Color: ${selectedColor}, Qty: ${displayQuantity}). Shopping Bag and Checkout backend integration is in progress.`
    );
    setTimeout(() => {
      setCartNotice("");
    }, 6000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    setCartNotice(
      `Selected: ${product.name} (Size: ${selectedSize}, Color: ${selectedColor}). Atelier Express checkout integration is in progress.`
    );
    setTimeout(() => {
      setCartNotice("");
    }, 6000);
  };

  return (
    <div className="el-product-details-page">
      {/* GLOBAL NAVBAR */}
      <Navbar wishlistCount={isWishlisted ? 1 : 0} />

      <main className="el-details-main">
        {/* LOADING STATE */}
        {loading ? (
          <div className="el-details-state-box">
            <div className="el-details-spinner" />
            <h3 className="el-state-title">Retrieving Atelier Garment</h3>
            <p className="el-state-sub">
              Fetching archival specifications, lookbook imagery, and variant inventory...
            </p>
          </div>
        ) : error || !product ? (
          /* ERROR / UNAVAILABLE STATE */
          <div className="el-details-state-box">
            <AlertCircle size={44} color="#991b1b" />
            <h2 className="el-state-title">Garment Unavailable</h2>
            <p className="el-state-sub">{error || "This product is currently not available."}</p>
            <div className="el-state-actions-row">
              <button
                type="button"
                className="el-btn-state-secondary"
                onClick={() => setRetryTrigger((prev) => prev + 1)}
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
              <button
                type="button"
                className="el-btn-state-primary"
                onClick={() => navigate("/collections")}
              >
                <ArrowLeft size={14} />
                <span>Return to Collections</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. BREADCRUMBS ROW (MATCHING REFERENCE) */}
            <nav className="el-breadcrumbs-nav" aria-label="Breadcrumb">
              <Link to="/" className="el-crumb-link">
                HOME
              </Link>
              <span className="el-crumb-divider">/</span>
              <Link to="/collections" className="el-crumb-link">
                COLLECTIONS
              </Link>
              {product.category?.name && (
                <>
                  <span className="el-crumb-divider">/</span>
                  <Link
                    to={`/collections?category=${encodeURIComponent(product.category.name)}`}
                    className="el-crumb-link"
                  >
                    {product.category.name.toUpperCase()}
                  </Link>
                </>
              )}
              <span className="el-crumb-divider">/</span>
              <span className="el-crumb-current">{product.name.toUpperCase()}</span>
            </nav>

            {/* CART & SHARE NOTICES */}
            {cartNotice && (
              <div className="el-notice-banner el-notice-cart" role="alert">
                <ShoppingBag size={16} />
                <span>{cartNotice}</span>
                <button
                  type="button"
                  className="el-notice-close"
                  onClick={() => setCartNotice("")}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {shareNotice && (
              <div className="el-notice-banner el-notice-share" role="alert">
                <Check size={16} />
                <span>Atelier product link copied to clipboard.</span>
              </div>
            )}

            {/* 2. MAIN SHOWCASE: 2-COLUMN LAYOUT (GALLERY + DETAILS) */}
            <section className="el-showcase-grid">
              {/* LEFT COLUMN: MULTI-ANGLE GALLERY */}
              <div className="el-gallery-col">
                <div className="el-gallery-container">
                  {/* Vertical Thumbnail Strip */}
                  {galleryImages.length > 1 && (
                    <div className="el-thumbnail-strip" role="tablist">
                      {galleryImages.map((imgUrl, idx) => {
                        const fullUrl = resolveImageUrl(imgUrl);
                        const isActive = idx === safeImageIndex;

                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`el-thumb-btn ${isActive ? "active" : ""}`}
                            onClick={() => setActiveImageIndex(idx)}
                            aria-label={`Thumbnail ${idx + 1}`}
                          >
                            <img src={fullUrl} alt={`Thumbnail ${idx + 1}`} />
                            <span className="el-thumb-index">#{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Large Main Hero Image Card */}
                  <div className="el-main-image-card">
                    {/* Top Overlay Badge */}
                    <div className="el-hero-tag-permanent">
                      <span className="el-tag-dot">•</span>
                      <span>PERMANENT SALON COLLECTION</span>
                    </div>

                    {/* Top Right Tool Icons */}
                    <div className="el-hero-tools-group">
                      <button
                        type="button"
                        className="el-tool-icon-btn"
                        onClick={() => setIsZoomed((prev) => !prev)}
                        title={isZoomed ? "Reset Zoom" : "Inspect Weave Zoom"}
                      >
                        <ZoomIn size={15} />
                      </button>
                      <button
                        type="button"
                        className="el-tool-icon-btn"
                        onClick={() => setFullscreenImage(resolveImageUrl(activeMainImage))}
                        title="Fullscreen Lightbox"
                      >
                        <Maximize2 size={15} />
                      </button>
                    </div>

                    {/* Zoomable Image Container */}
                    <div
                      ref={imageContainerRef}
                      className={`el-hero-img-wrap ${isZoomed ? "zoomed" : ""}`}
                      onMouseMove={handleMouseMove}
                      onMouseEnter={() => setIsZoomed(true)}
                      onMouseLeave={() => setIsZoomed(false)}
                      onClick={() => setFullscreenImage(resolveImageUrl(activeMainImage))}
                    >
                      {activeMainImage ? (
                        <img
                          src={resolveImageUrl(activeMainImage)}
                          alt={product.name}
                          className="el-hero-display-img"
                          style={
                            isZoomed
                              ? {
                                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                                  transform: "scale(2)",
                                }
                              : undefined
                          }
                        />
                      ) : (
                        <div className="el-hero-placeholder">
                          <span>ELARQUE HAUTE COUTURE</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Image Overlay Badges */}
                    <div className="el-hero-bottom-overlay">
                      <button
                        type="button"
                        className="el-btn-spin-pill"
                        onClick={() => setIsZoomed((prev) => !prev)}
                      >
                        <span>360° ATELIER SPIN</span>
                      </button>
                      <div className="el-hover-inspect-pill">
                        <span>HOVER TO INSPECT WEAVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Gallery Certification Stamp */}
                <div className="el-gallery-stamp-footer">
                  <div className="el-stamp-left">
                    <ShieldCheck size={14} className="el-stamp-icon" />
                    <span>ATELIER CERTIFIED · HAND-CUT IN PARIS &amp; ASSEMBLED IN DALLAS</span>
                  </div>
                  <div className="el-stamp-right">
                    <span>Archival Piece #{product.id ? product.id.slice(-5).toUpperCase() : "26-08"}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & ACTIONS */}
              <div className="el-details-col">
                {/* 1. Header Badges & Rating */}
                <div className="el-details-header-meta">
                  {product.isBestSeller ? (
                    <div className="el-kicker-badge-gold">
                      <Star size={11} fill="#dfc28d" color="#dfc28d" />
                      <span>BEST SELLER · ATELIER SIGNATURE</span>
                    </div>
                  ) : (
                    <div className="el-kicker-badge-gold">
                      <Sparkles size={11} color="#dfc28d" />
                      <span>ATELIER SIGNATURE SILHOUETTE</span>
                    </div>
                  )}

                  {product.brand && (
                    <div className="el-brand-pill">
                      <span>{product.brand.toUpperCase()}</span>
                    </div>
                  )}

                  {/* Rating displayed ONLY if real rating data exists */}
                  {product.rating ? (
                    <div className="el-rating-stars-group">
                      <div className="el-stars-list">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.round(product.rating) ? "#dfc28d" : "none"}
                            color="#dfc28d"
                          />
                        ))}
                      </div>
                      <span className="el-rating-num">
                        {product.rating} ({(product.reviews && product.reviews.length) || product.reviewCount || 0} Reviews)
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 2. Product Title */}
                <h1 className="el-product-hero-title">{product.name}</h1>

                {/* 3. Pricing Row */}
                <div className="el-product-price-section">
                  <div className="el-price-digits-row">
                    <span className="el-current-price">
                      {formatINR(product.salePrice || product.price)}
                    </span>
                    {product.salePrice && (
                      <span className="el-original-strike">
                        {formatINR(product.price)}
                      </span>
                    )}
                    {product.discountPercentage ? (
                      <span className="el-badge-privilege-discount">
                        {product.discountPercentage}% OFF ATELIER PRIVILEGE
                      </span>
                    ) : null}
                  </div>
                  <p className="el-price-tax-notice">
                    Complimentary white-glove courier dispatch. Inclusive of all luxury taxes, keepsake
                    garment bag, and archival cedar hanger.
                  </p>
                </div>

                {/* 4. Description Paragraph */}
                <div className="el-product-desc-box">
                  <p>
                    {product.description ||
                      "A timeless tailored blazer silhouette crafted from premium satin-blend virgin wool crepe, designed for confident women who appreciate elegant western authority paired with European silhouette drape."}
                  </p>
                </div>

                {/* 5. Four Feature Cards Grid */}
                <div className="el-feature-specs-grid">
                  <div className="el-spec-card">
                    <Sparkles size={14} className="el-spec-icon" />
                    <div className="el-spec-text">
                      <span className="el-spec-title">PREMIUM FABRIC</span>
                      <span className="el-spec-desc">Loom-woven satin virgin wool blend</span>
                    </div>
                  </div>
                  <div className="el-spec-card">
                    <ShieldCheck size={14} className="el-spec-icon" />
                    <div className="el-spec-text">
                      <span className="el-spec-title">BREATHABLE LINING</span>
                      <span className="el-spec-desc">100% Habotai pure silk interior</span>
                    </div>
                  </div>
                  <div className="el-spec-card">
                    <RotateCcw size={14} className="el-spec-icon" />
                    <div className="el-spec-text">
                      <span className="el-spec-title">WRINKLE RESISTANT</span>
                      <span className="el-spec-desc">High-twist memory crepe weave</span>
                    </div>
                  </div>
                  <div className="el-spec-card">
                    <Check size={14} className="el-spec-icon" />
                    <div className="el-spec-text">
                      <span className="el-spec-title">ATELIER CARE</span>
                      <span className="el-spec-desc">Complimentary lifetime tailoring</span>
                    </div>
                  </div>
                </div>

                {/* 6. Color Selection */}
                {availableColors.length > 0 && (
                  <div className="el-variant-section">
                    <div className="el-variant-section-header">
                      <span className="el-variant-heading">
                        TONE / COLOR:{" "}
                        <strong className="el-selected-color-name">
                          {selectedColor.toUpperCase()}
                        </strong>
                      </span>
                      <span className="el-dye-code-ref">BESPOKE DYE #6B1F2A</span>
                    </div>
                    <div className="el-color-swatches-row">
                      {availableColors.map((col) => {
                        const isSelected =
                          selectedColor.toLowerCase() === col.toLowerCase();
                        const hex = getColorHex(col);

                        return (
                          <button
                            key={col}
                            type="button"
                            className={`el-color-swatch-btn ${isSelected ? "active" : ""}`}
                            onClick={() => handleColorSelect(col)}
                            title={`Select Color ${col}`}
                          >
                            <span
                              className="el-color-swatch-circle"
                              style={{ backgroundColor: hex }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Size Selection & Stock Status */}
                <div className="el-variant-section">
                  <div className="el-variant-section-header">
                    <span className="el-variant-heading">SELECT FITTING / SIZE</span>
                    {isLowStock ? (
                      <span className="el-stock-urgent-pill">
                        ONLY {currentStock} PIECE{currentStock === 1 ? "" : "S"} LEFT IN {selectedSize}
                      </span>
                    ) : isOutOfStock ? (
                      <span className="el-stock-out-pill">OUT OF STOCK</span>
                    ) : (
                      <span className="el-stock-available-pill">
                        {currentStock} AVAILABLE IN {selectedSize}
                      </span>
                    )}
                    <button
                      type="button"
                      className="el-btn-size-guide"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      <Ruler size={13} />
                      <span>SIZE GUIDE &amp; ATELIER FIT</span>
                    </button>
                  </div>

                  <div className="el-size-pills-row">
                    {ALLOWED_SIZES.map((sizeOption) => {
                      const matchedVariant = sizesForSelectedColor.find(
                        (v) => (v.size || "").toUpperCase() === sizeOption
                      );
                      const isAvailable = matchedVariant && Number(matchedVariant.stock) > 0;
                      const isSelected = selectedSize.toUpperCase() === sizeOption;

                      return (
                        <button
                          key={sizeOption}
                          type="button"
                          className={`el-size-pill-box ${isSelected ? "selected" : ""} ${
                            !isAvailable ? "disabled" : ""
                          }`}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedSize(sizeOption);
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          <span className="el-size-main-label">{sizeOption}</span>
                          <span className="el-size-sub-label">
                            {SIZING_SUBTEXT[sizeOption] || "FR 38"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. Quantity & Add to Bag / Buy Now Actions */}
                <div className="el-purchase-actions-box">
                  <div className="el-quantity-and-add-row">
                    {/* Quantity Stepper */}
                    <div className="el-quantity-stepper">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={displayQuantity <= 1 || isOutOfStock}
                        aria-label="Decrease Quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="el-qty-value">{displayQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                        disabled={displayQuantity >= currentStock || isOutOfStock}
                        aria-label="Increase Quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Add to Bag Primary Button */}
                    <button
                      type="button"
                      className="el-btn-add-bag"
                      onClick={handleAddToBag}
                      disabled={isOutOfStock}
                    >
                      <ShoppingBag size={16} />
                      <span>
                        {isOutOfStock ? "SOLD OUT IN THIS SIZE" : "ADD TO SHOPPING BAG"}
                      </span>
                    </button>
                  </div>

                  {/* Secondary Action Row: Buy Now + Wishlist + Share */}
                  <div className="el-secondary-actions-row">
                    <button
                      type="button"
                      className="el-btn-buy-express"
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                    >
                      BUY NOW WITH ATELIER EXPRESS
                    </button>

                    <button
                      type="button"
                      className={`el-btn-round-action ${isWishlisted ? "active" : ""}`}
                      onClick={handleWishlistToggle}
                      title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                    >
                      <Heart
                        size={16}
                        fill={isWishlisted ? "#5c061c" : "none"}
                        stroke={isWishlisted ? "#5c061c" : "#1a1a1a"}
                      />
                    </button>

                    <button
                      type="button"
                      className="el-btn-round-action"
                      onClick={handleShare}
                      title="Share Silhouette"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 9. Courier & Packaging Guarantees */}
                <div className="el-atelier-guarantees-list">
                  <div className="el-guarantee-item">
                    <Truck size={17} className="el-guarantee-icon" />
                    <div className="el-guarantee-text">
                      <strong>FREE BESPOKE WHITE-GLOVE DISPATCH</strong>
                      <span>Complimentary tracked courier shipping. Dispatched within 24–48 hours.</span>
                    </div>
                  </div>
                  <div className="el-guarantee-item">
                    <RotateCcw size={17} className="el-guarantee-icon" />
                    <div className="el-guarantee-text">
                      <strong>14-DAY FITTING WINDOW &amp; SALON EXCHANGES</strong>
                      <span>Complimentary courier returns directly from your residence or private salon.</span>
                    </div>
                  </div>
                  <div className="el-guarantee-item">
                    <Gift size={17} className="el-guarantee-icon" />
                    <div className="el-guarantee-text">
                      <strong>SIGNATURE PARISIAN GIFT PRESENTATION</strong>
                      <span>Presented in our wax-sealed keepsake box, scented with natural cedar and iris essence.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. MIDDLE SECTION: HAUTE SPECIFICATION (FABRIC ANATOMY) */}
            <section className="el-haute-specification-section">
              <div className="el-spec-section-header">
                <span className="el-section-kicker">HAUTE SPECIFICATION</span>
                <h2 className="el-section-main-title">Anatomy of European-Western Crepe</h2>
                <p className="el-section-desc">
                  Sculpted from tightly-spun virgin wool crepe selected from historic mills in Biella,
                  Italy. The silhouette incorporates a high-tension interior canvas that holds crisp
                  lapel posture while maintaining effortless fluid motion.
                </p>
              </div>

              <div className="el-spec-composition-layout">
                {/* Left 4 Spec Panels */}
                <div className="el-spec-tiles-grid">
                  <div className="el-composition-tile">
                    <span className="el-tile-label">COMPOSITION</span>
                    <strong className="el-tile-val">70% Virgin Wool, 30% Mulberry Silk</strong>
                  </div>
                  <div className="el-composition-tile">
                    <span className="el-tile-label">INTERIOR LINING</span>
                    <strong className="el-tile-val">100% Breathable Habotai Silk</strong>
                  </div>
                  <div className="el-composition-tile">
                    <span className="el-tile-label">HARDWARE</span>
                    <strong className="el-tile-val">Burnished Horn &amp; Aged Brass Yoke Rivets</strong>
                  </div>
                  <div className="el-composition-tile">
                    <span className="el-tile-label">CARE PROTOCOL</span>
                    <strong className="el-tile-val">Specialist Dry Clean Only / Steam Refresh</strong>
                  </div>

                  {/* Atelier Quote Callout */}
                  <div className="el-atelier-quote-card">
                    <p className="el-quote-text">
                      "Our blazer dresses are designed to stand alone as an empowering statement of
                      authority, yet remain comfortable through midnight salon galas."
                    </p>
                    <span className="el-quote-author">
                      — ÉMILIE ARNAULT, MASTER PATTERNMAKER PARIS ATELIER
                    </span>
                  </div>
                </div>

                {/* Right Macro Fabric Imagery */}
                <div className="el-spec-macro-images">
                  <div className="el-macro-card">
                    <img
                      src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
                      alt="Virgin Wool Crepe Weave"
                    />
                    <span className="el-macro-label">VIRGIN WOOL CREPE</span>
                  </div>
                  <div className="el-macro-card">
                    <img
                      src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
                      alt="Hand-Finished Horn Buttons"
                    />
                    <span className="el-macro-label">HAND-FINISHED BUTTONS</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. CLIENT REVIEWS SECTION - Rendered ONLY if real review data exists */}
            {Array.isArray(product.reviews) && product.reviews.length > 0 && (
              <section className="el-client-reviews-section">
                <div className="el-reviews-top-bar">
                  <h2 className="el-reviews-heading">Clients Reviews</h2>
                  <div className="el-reviews-summary-tag">
                    <Star size={13} fill="#dfc28d" color="#dfc28d" />
                    <strong>{product.rating || "5.0"}</strong>
                    <span>{product.reviews.length} VERIFIED REVIEWS</span>
                  </div>
                </div>

                <div className="el-reviews-cards-row">
                  {product.reviews.map((rev, revIdx) => (
                    <div key={rev.id || rev._id || revIdx} className="el-review-card">
                      <div className="el-review-card-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            fill={i < (rev.rating || 5) ? "#dfc28d" : "none"}
                            color="#dfc28d"
                          />
                        ))}
                        <span className="el-review-verified">VERIFIED SALON CLIENT</span>
                      </div>
                      {rev.title && <h4 className="el-review-card-title">"{rev.title}"</h4>}
                      <p className="el-review-card-text">{rev.comment || rev.text}</p>
                      <div className="el-review-card-footer">
                        <strong>{(rev.author || rev.userName || "SALON CLIENT").toUpperCase()}</strong>
                        {rev.fit && <span>Fit: {rev.fit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. RELATED ATELIER SILHOUETTES */}
            {relatedProducts.length > 0 && (
              <section className="el-related-products-section">
                <div className="el-related-header">
                  <span className="el-related-kicker">RELATED ITEMS</span>
                  <h3 className="el-related-title">Commissions from the Same Atelier</h3>
                </div>

                <div className="el-related-cards-grid">
                  {relatedProducts.map((rel) => {
                    const relId = rel.id || rel._id;
                    const relImg = resolveImageUrl(
                      rel.coverImage || (rel.images && rel.images[0])
                    );

                    return (
                      <article
                        key={relId}
                        className="el-related-card"
                        onClick={() => navigate(`/products/${relId}`)}
                      >
                        <div className="el-related-img-wrap">
                          {relImg ? (
                            <img src={relImg} alt={rel.name} loading="lazy" />
                          ) : (
                            <div className="el-related-placeholder">
                              <span>ELARQUE</span>
                            </div>
                          )}
                        </div>
                        <div className="el-related-info">
                          <span className="el-related-category">
                            {rel.category?.name || "EVENING ATELIER"}
                          </span>
                          <h4 className="el-related-name">{rel.name}</h4>
                          <span className="el-related-price">
                            {formatINR(rel.salePrice || rel.price)}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {fullscreenImage && (
        <div
          className="el-lightbox-backdrop"
          onClick={() => setFullscreenImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="el-lightbox-close"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={22} />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen lookbook inspection"
            className="el-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div
          className="el-size-guide-backdrop"
          onClick={() => setShowSizeGuide(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="el-size-guide-card" onClick={(e) => e.stopPropagation()}>
            <div className="el-size-guide-header">
              <h3 className="el-size-guide-title">Atelier Size Guide &amp; Tailoring Standards</h3>
              <button
                type="button"
                className="el-size-guide-close"
                onClick={() => setShowSizeGuide(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="el-size-guide-desc">
              All ELARQUE couture silhouettes are precision cut following classic Parisian haute couture
              patterns with room for gentle movement.
            </p>

            <table className="el-size-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>FRANCE</th>
                  <th>UK</th>
                  <th>US</th>
                  <th>BUST (IN)</th>
                  <th>WAIST (IN)</th>
                  <th>HIPS (IN)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>XS</strong></td>
                  <td>FR 34</td>
                  <td>UK 6</td>
                  <td>US 2</td>
                  <td>32 – 33"</td>
                  <td>24 – 25"</td>
                  <td>34 – 35"</td>
                </tr>
                <tr>
                  <td><strong>S</strong></td>
                  <td>FR 36</td>
                  <td>UK 8</td>
                  <td>US 4</td>
                  <td>34 – 35"</td>
                  <td>26 – 27"</td>
                  <td>36 – 37"</td>
                </tr>
                <tr>
                  <td><strong>M</strong></td>
                  <td>FR 38</td>
                  <td>UK 10</td>
                  <td>US 6</td>
                  <td>36 – 37"</td>
                  <td>28 – 29"</td>
                  <td>38 – 39"</td>
                </tr>
                <tr>
                  <td><strong>L</strong></td>
                  <td>FR 40</td>
                  <td>UK 12</td>
                  <td>US 8</td>
                  <td>38 – 39"</td>
                  <td>30 – 31"</td>
                  <td>40 – 41"</td>
                </tr>
                <tr>
                  <td><strong>XL</strong></td>
                  <td>FR 42</td>
                  <td>UK 14</td>
                  <td>US 10</td>
                  <td>40 – 42"</td>
                  <td>32 – 34"</td>
                  <td>42 – 44"</td>
                </tr>
              </tbody>
            </table>

            <div className="el-size-guide-footer">
              <span>Need bespoke sizing? Complimentary salon consultation available upon request.</span>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
};

export default ProductDetails;
