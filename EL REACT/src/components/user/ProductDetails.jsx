import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { addToCart } from "../../services/cartService";
import {
  getProductReviews,
  createProductReview,
  checkReviewEligibility,
} from "../../services/reviewService";
import { showCartToast, showWishlistToast, showAuthToast } from "../../utils/toast";
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

// Safely calculate unique product ID count from elarque_session_wishlist
const getSessionWishlistCount = () => {
  try {
    const saved = localStorage.getItem("elarque_session_wishlist");
    if (!saved) return 0;
    const list = JSON.parse(saved);
    if (!Array.isArray(list)) return 0;
    return new Set(list.filter(Boolean)).size;
  } catch {
    return 0;
  }
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
  const [addingToBag, setAddingToBag] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);

  // Local Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(getSessionWishlistCount);

  // Dynamic Real Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Purchase-based Review Eligibility State
  const [reviewEligibility, setReviewEligibility] = useState({
    loading: true,
    isAuthenticated: false,
    canReview: false,
    hasPurchased: false,
    alreadyReviewed: false,
    message: "",
    existingReview: null,
  });

  // Review Submission Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    rating: 5,
    selectedImpressions: ["Perfect Fit", "Premium Quality"],
    impressionText: "",
    submitting: false,
    error: "",
  });

  // Fetch reviews for current product from backend
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const res = await getProductReviews(id);
      if (res?.data?.success) {
        setReviews(res.data.reviews || []);
        setReviewStats(res.data.stats || { totalReviews: 0, averageRating: 0 });
      } else {
        setReviews([]);
        setReviewStats({ totalReviews: 0, averageRating: 0 });
      }
    } catch (err) {
      console.error("GET PRODUCT REVIEWS ERROR:", err);
      setReviews([]);
      setReviewStats({ totalReviews: 0, averageRating: 0 });
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  // Check customer's purchase and review eligibility
  const fetchEligibility = useCallback(async () => {
    if (!id) return;
    try {
      const res = await checkReviewEligibility(id);
      if (res?.data?.success) {
        setReviewEligibility({
          loading: false,
          isAuthenticated: Boolean(res.data.isAuthenticated),
          canReview: Boolean(res.data.canReview),
          hasPurchased: Boolean(res.data.hasPurchased),
          alreadyReviewed: Boolean(res.data.alreadyReviewed),
          message: res.data.message || "",
          existingReview: res.data.existingReview || null,
        });
      }
    } catch (err) {
      console.error("CHECK REVIEW ELIGIBILITY ERROR:", err);
      setReviewEligibility({
        loading: false,
        isAuthenticated: false,
        canReview: false,
        hasPurchased: false,
        alreadyReviewed: false,
        message: "",
        existingReview: null,
      });
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
    fetchEligibility();
  }, [fetchReviews, fetchEligibility]);

  // Handle Review Submission on Product Details Page
  const handleProductReviewSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      showAuthToast("Please log in to your atelier account to submit a review.");
      navigate("/login");
      return;
    }

    if (!reviewModal.impressionText || reviewModal.impressionText.trim().length < 3) {
      setReviewModal((prev) => ({
        ...prev,
        error: "Please write your atelier impression text (minimum 3 characters).",
      }));
      return;
    }

    try {
      setReviewModal((prev) => ({ ...prev, submitting: true, error: "" }));

      const payload = {
        rating: reviewModal.rating,
        title: reviewModal.selectedImpressions[0] || "Exceptional Sartorial Craft",
        comment: reviewModal.impressionText.trim(),
        impressions: reviewModal.selectedImpressions,
        size: selectedSize || "",
        fit: reviewModal.selectedImpressions.includes("Perfect Fit") ? "True to Size" : "Atelier Fit",
      };

      const res = await createProductReview(id, payload);
      if (res?.data?.success) {
        alert("Thank you! Your verified patron review has been recorded.");
        setReviewModal({
          isOpen: false,
          rating: 5,
          selectedImpressions: ["Perfect Fit", "Premium Quality"],
          impressionText: "",
          submitting: false,
          error: "",
        });
        await fetchReviews();
        await fetchEligibility();
      } else {
        setReviewModal((prev) => ({
          ...prev,
          submitting: false,
          error: res?.data?.message || "Failed to submit review.",
        }));
      }
    } catch (err) {
      console.error("CREATE REVIEW ERROR:", err);
      const msg = err.response?.data?.message || "Failed to submit review. Please try again.";
      setReviewModal((prev) => ({ ...prev, submitting: false, error: msg }));
    }
  };

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
              if (Array.isArray(list)) {
                setIsWishlisted(list.includes(prod.id || prod._id));
                setWishlistCount(new Set(list.filter(Boolean)).size);
              } else {
                setIsWishlisted(false);
                setWishlistCount(0);
              }
            } else {
              setIsWishlisted(false);
              setWishlistCount(0);
            }
          } catch (e) {
            console.error(e);
            setIsWishlisted(false);
            setWishlistCount(0);
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

  // Active pricing: dynamically reflects variant price if configured
  const activePriceData = useMemo(() => {
    if (!product) {
      return { currentPrice: 0, regularPrice: 0, hasSale: false, discountPercentage: null };
    }

    const regular =
      selectedVariant?.price !== undefined && selectedVariant?.price !== null
        ? Number(selectedVariant.price)
        : Number(product.price) || 0;

    const sale =
      selectedVariant?.salePrice !== undefined && selectedVariant?.salePrice !== null
        ? Number(selectedVariant.salePrice)
        : product.salePrice !== undefined && product.salePrice !== null
        ? Number(product.salePrice)
        : null;

    const hasSale = sale !== null && sale < regular;
    const currentPrice = hasSale ? sale : regular;
    const discount =
      hasSale && regular > 0
        ? Math.round(((regular - sale) / regular) * 100)
        : null;

    return {
      currentPrice,
      regularPrice: regular,
      hasSale,
      discountPercentage: discount,
    };
  }, [product, selectedVariant]);

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
        let list = [];
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) list = parsed;
        }
        if (next) {
          if (!list.includes(prodId)) list.push(prodId);
        } else {
          list = list.filter((item) => item !== prodId);
        }
        const uniqueList = Array.from(new Set(list.filter(Boolean)));
        localStorage.setItem("elarque_session_wishlist", JSON.stringify(uniqueList));
        window.dispatchEvent(new CustomEvent("elarque_wishlist_updated", { detail: uniqueList }));
        window.dispatchEvent(new Event("storage"));
        setWishlistCount(uniqueList.length);
      } catch (e) {
        console.error(e);
      }
      showWishlistToast(product, next);
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

  // Add to Bag action — wired to backend cart API
  const handleAddToBag = async () => {
    if (isOutOfStock || addingToBag) return;

    // Auth check
    const token = localStorage.getItem("token");
    if (!token) {
      showAuthToast();
      navigate("/login");
      return;
    }

    // Ensure a specific variant is selected
    if (!selectedVariant) {
      setCartNotice("Please select a size and color before adding to your bag.");
      setTimeout(() => setCartNotice(""), 4000);
      return;
    }

    setAddingToBag(true);
    setCartNotice("");

    try {
      const productId = product.id || product._id;
      const variantId = selectedVariant.id || selectedVariant._id;
      const response = await addToCart(productId, variantId, displayQuantity);

      if (response.data?.success && response.data?.cart) {
        // Notify Navbar and other listeners of updated cart
        window.dispatchEvent(
          new CustomEvent("elarque_cart_updated", { detail: response.data.cart })
        );
        // Synchronize wishlist: remove product from session wishlist upon adding to cart
        setIsWishlisted(false);
        try {
          const saved = localStorage.getItem("elarque_session_wishlist");
          if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list)) {
              const targetId = product?.id || product?._id || productId;
              const updated = Array.from(
                new Set(
                  list.filter(
                    (item) =>
                      Boolean(item) &&
                      item !== targetId &&
                      item !== product?._id &&
                      item !== product?.id
                  )
                )
              );
              localStorage.setItem("elarque_session_wishlist", JSON.stringify(updated));
              setWishlistCount(updated.length);
            }
          }
        } catch (storageErr) {
          console.error(storageErr);
        }
        const addedNotice = `${product.name} (${selectedSize}, ${selectedColor}) added to your shopping bag.`;
        setCartNotice(addedNotice);
        showCartToast(product, addedNotice);
      } else {
        setCartNotice(response.data?.message || "Could not add to bag. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong while adding to your bag. Please try again.";
      setCartNotice(msg);
    } finally {
      setAddingToBag(false);
      setTimeout(() => setCartNotice(""), 5000);
    }
  };

  // Buy Now — adds to cart then navigates to cart page
  const handleBuyNow = async () => {
    if (isOutOfStock || addingToBag) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      setCartNotice("Please select a size and color before proceeding.");
      setTimeout(() => setCartNotice(""), 4000);
      return;
    }

    setAddingToBag(true);
    setCartNotice("");

    try {
      const productId = product.id || product._id;
      const variantId = selectedVariant.id || selectedVariant._id;
      const response = await addToCart(productId, variantId, displayQuantity);

      if (response.data?.success && response.data?.cart) {
        window.dispatchEvent(
          new CustomEvent("elarque_cart_updated", { detail: response.data.cart })
        );
        // Synchronize wishlist: remove product from session wishlist upon adding to cart
        setIsWishlisted(false);
        try {
          const saved = localStorage.getItem("elarque_session_wishlist");
          if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list)) {
              const targetId = product?.id || product?._id || productId;
              const updated = Array.from(
                new Set(
                  list.filter(
                    (item) =>
                      Boolean(item) &&
                      item !== targetId &&
                      item !== product?._id &&
                      item !== product?.id
                  )
                )
              );
              localStorage.setItem("elarque_session_wishlist", JSON.stringify(updated));
              setWishlistCount(updated.length);
            }
          }
        } catch (storageErr) {
          console.error(storageErr);
        }
        navigate("/cart");
      } else {
        setCartNotice(response.data?.message || "Could not add to bag. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setCartNotice(msg);
    } finally {
      setAddingToBag(false);
      setTimeout(() => setCartNotice(""), 5000);
    }
  };

  return (
    <div className="el-product-details-page">
      {/* GLOBAL NAVBAR */}
      <Navbar wishlistCount={wishlistCount} />

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
                      {formatINR(activePriceData.currentPrice)}
                    </span>
                    {activePriceData.hasSale && (
                      <span className="el-original-strike">
                        {formatINR(activePriceData.regularPrice)}
                      </span>
                    )}
                    {activePriceData.discountPercentage ? (
                      <span className="el-badge-privilege-discount">
                        {activePriceData.discountPercentage}% OFF ATELIER PRIVILEGE
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

            {/* 3. CLIENTS REVIEWS SECTION (FULL-WIDTH REAL BACKEND DATA) */}
            <section className="el-clients-reviews-section">
              <div className="el-reviews-section-header">
                <div className="el-reviews-header-left">
                  <span className="el-section-kicker">VERIFIED ATELIER CLIENTELE</span>
                  <h2 className="el-reviews-main-title">Clients Reviews</h2>
                  <p className="el-reviews-subtitle">
                    Refined feedback from private salon appointments, runway patrons, and bespoke commissions worldwide.
                  </p>
                </div>
                <div className="el-reviews-header-actions">
                  <div className="el-reviews-summary-card">
                    <div className="el-reviews-summary-score">
                      <span className="el-score-num">
                        {reviewStats.totalReviews > 0
                          ? Number(reviewStats.averageRating).toFixed(1)
                          : "—"}
                      </span>
                      <div className="el-score-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={15}
                            fill={
                              reviewStats.totalReviews > 0 &&
                              i < Math.round(Number(reviewStats.averageRating))
                                ? "#dfc28d"
                                : "none"
                            }
                            color="#dfc28d"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="el-summary-label">
                      {reviewStats.totalReviews > 0
                        ? `${reviewStats.totalReviews} VERIFIED ${
                            reviewStats.totalReviews === 1 ? "REVIEW" : "REVIEWS"
                          }`
                        : "NO REVIEWS YET"}
                    </span>
                  </div>

                  {/* ELIGIBILITY ACTIONS */}
                  {!reviewEligibility.isAuthenticated ? (
                    <button
                      type="button"
                      className="el-btn-open-review-modal el-btn-review-login"
                      onClick={() => {
                        showAuthToast("Please log in to your atelier account to write a review.");
                        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                      }}
                      title="Log in to share a review"
                    >
                      <Star size={13} fill="#dfc28d" color="#dfc28d" /> LOG IN TO REVIEW
                    </button>
                  ) : reviewEligibility.canReview ? (
                    <button
                      type="button"
                      className="el-btn-open-review-modal"
                      onClick={() => setReviewModal((prev) => ({ ...prev, isOpen: true, error: "" }))}
                    >
                      <Star size={13} fill="#dfc28d" color="#dfc28d" /> WRITE A REVIEW
                    </button>
                  ) : reviewEligibility.alreadyReviewed ? (
                    <div className="el-review-eligibility-badge el-badge-reviewed">
                      <Check size={13} />
                      <span>Review Submitted</span>
                    </div>
                  ) : (
                    <div
                      className="el-review-eligibility-badge el-badge-locked"
                      title="Purchase this product to share your review."
                    >
                      <AlertCircle size={13} />
                      <span>Purchase Required</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative notice if logged in patron has not purchased or already reviewed */}
              {reviewEligibility.isAuthenticated && !reviewEligibility.hasPurchased && (
                <div className="el-review-notice-banner el-notice-purchase-req">
                  <AlertCircle size={15} />
                  <span>Purchase this product to share your review. Only verified patrons who have purchased this silhouette can write a review.</span>
                </div>
              )}

              {reviewEligibility.isAuthenticated && reviewEligibility.alreadyReviewed && (
                <div className="el-review-notice-banner el-notice-already-reviewed">
                  <Check size={15} />
                  <span>You have already reviewed this silhouette. Thank you for your feedback.</span>
                </div>
              )}

              {loadingReviews ? (
                <div className="el-reviews-loading">
                  <span>Loading verified salon reviews...</span>
                </div>
              ) : reviews.length === 0 ? (
                /* Empty state matching requirement 2 & 4 */
                <div className="el-reviews-empty-state">
                  <Sparkles size={28} className="el-empty-sparkle" />
                  <h4 className="el-empty-title">No reviews yet.</h4>
                  
                  {!reviewEligibility.isAuthenticated ? (
                    <>
                      <p className="el-empty-desc">Be the first to share your experience.</p>
                      <button
                        type="button"
                        className="el-btn-write-first-review"
                        onClick={() => {
                          showAuthToast("Please log in to your atelier account to write a review.");
                          navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        }}
                      >
                        LOG IN TO REVIEW ➔
                      </button>
                    </>
                  ) : reviewEligibility.canReview ? (
                    <>
                      <p className="el-empty-desc">Be the first to share your experience.</p>
                      <button
                        type="button"
                        className="el-btn-write-first-review"
                        onClick={() => setReviewModal((prev) => ({ ...prev, isOpen: true, error: "" }))}
                      >
                        WRITE A REVIEW ➔
                      </button>
                    </>
                  ) : reviewEligibility.alreadyReviewed ? (
                    <p className="el-empty-desc">Thank you for sharing your review for this silhouette.</p>
                  ) : (
                    <>
                      <p className="el-empty-desc">Be the first to share your experience.</p>
                      <div className="el-empty-purchased-notice">
                        <AlertCircle size={14} />
                        <span>Purchase this product to share your review.</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Real Customer Reviews Grid matching requirement 4 & 6 */
                <div className="el-reviews-cards-grid">
                  {reviews.map((rev) => (
                    <div key={rev._id || rev.id} className="el-full-review-card">
                      <div className="el-review-card-top">
                        <div className="el-review-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < (rev.rating || 5) ? "#dfc28d" : "none"}
                              color="#dfc28d"
                            />
                          ))}
                        </div>
                        {rev.isVerifiedPurchase && (
                          <span className="el-review-verified-badge">
                            <ShieldCheck size={13} className="el-verified-icon" />
                            VERIFIED SALON CLIENT
                          </span>
                        )}
                      </div>

                      <h3 className="el-review-title">
                        "{rev.title || rev.headline || "Exceptional Sartorial Craft"}"
                      </h3>

                      <p className="el-review-body">{rev.comment}</p>

                      <div className="el-review-footer">
                        <div className="el-client-meta">
                          <strong className="el-client-name">
                            {rev.userName ||
                              (typeof rev.user === "object"
                                ? rev.user?.fullName
                                : "Salon Patron")}
                          </strong>
                          {rev.userLocation && (
                            <span className="el-client-location"> — {rev.userLocation}</span>
                          )}
                          <span className="el-review-date">
                            · {new Date(rev.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {(rev.size || rev.fit) && (
                          <div className="el-client-tags">
                            {rev.size && (
                              <span className="el-pill-tag">
                                Size: <strong>{rev.size}</strong>
                              </span>
                            )}
                            {rev.fit && (
                              <span className="el-pill-tag el-pill-fit">
                                Fit: <strong>{rev.fit}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>


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

      {/* RATE SILHOUETTE / WRITE REVIEW MODAL */}
      {reviewModal.isOpen && (
        <div
          className="el-modal-backdrop"
          onClick={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div className="el-modal-review" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="el-modal-close-x"
              onClick={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
            >
              <X size={18} />
            </button>

            <span className="el-rev-eyebrow">★ PRODUCT REVIEW • ATELIER VOICES</span>
            <h2 className="el-rev-title">Rate Your Experience</h2>
            <p className="el-rev-subtitle">
              Share your experiential monograph on{" "}
              <strong>{product?.name || "this silhouette"}</strong> to assist fellow patrons.
            </p>

            {reviewModal.error && (
              <div className="el-rev-error-msg">
                <AlertCircle size={15} />
                <span>{reviewModal.error}</span>
              </div>
            )}

            {/* Star Rating */}
            <div className="el-rev-stars-box">
              <span className="el-rev-stars-label">
                1. OVERALL EXPERIENCE: {reviewModal.rating} OF 5 STARS
              </span>
              <div className="el-rev-stars-list">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={26}
                    fill={star <= reviewModal.rating ? "#dfc28d" : "none"}
                    stroke="#dfc28d"
                    strokeWidth={1.5}
                    onClick={() => setReviewModal((prev) => ({ ...prev, rating: star }))}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>

            {/* Impression Tags */}
            <div className="el-rev-tags-box">
              <span className="el-rev-tags-label">2. WHAT IMPRESSED YOU MOST?</span>
              <div className="el-rev-tags-flex">
                {[
                  "Perfect Fit",
                  "Premium Quality",
                  "Comfortable",
                  "Worth the Price",
                  "Elegant Design",
                  "Exquisite Tailoring",
                  "White-Glove Packaging",
                ].map((tag) => {
                  const isSelected = reviewModal.selectedImpressions.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`el-rev-tag-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const newTags = isSelected
                          ? reviewModal.selectedImpressions.filter((t) => t !== tag)
                          : [...reviewModal.selectedImpressions, tag];
                        setReviewModal((prev) => ({
                          ...prev,
                          selectedImpressions: newTags,
                        }));
                      }}
                    >
                      {isSelected ? "✓ " : ""}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impression Textarea */}
            <div className="el-rev-textarea-box">
              <span className="el-rev-tags-label">3. YOUR ATELIER IMPRESSION</span>
              <textarea
                rows={4}
                value={reviewModal.impressionText}
                onChange={(e) =>
                  setReviewModal((prev) => ({
                    ...prev,
                    impressionText: e.target.value,
                  }))
                }
                placeholder="Describe the fabric drape, lapel posture, tailoring comfort, and overall impression..."
                className="el-rev-textarea"
              />
            </div>

            <div className="el-rev-actions">
              <button
                type="button"
                className="el-btn-submit-review"
                onClick={handleProductReviewSubmit}
                disabled={reviewModal.submitting}
              >
                {reviewModal.submitting ? "RECORDING..." : "SUBMIT REVIEW ➔"}
              </button>
              <button
                type="button"
                className="el-btn-cancel-rev"
                onClick={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={reviewModal.submitting}
              >
                CANCEL
              </button>
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
