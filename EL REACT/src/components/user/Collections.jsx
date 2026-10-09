import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Eye,
  LayoutGrid,
  Grid2X2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { getProducts, getProductFacets } from "../../services/productService";
import "./Collections.css";

const SIZES_CANONICAL = ["XS", "S", "M", "L", "XL"];

// Helper to safely resolve image paths
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `http://localhost:5000${url}`;
  return `http://localhost:5000/${url}`;
};

// Format currency
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const Collections = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialSize = searchParams.get("size") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(isNaN(initialPage) ? 1 : initialPage);

  // UI state
  const [gridColumns, setGridColumns] = useState(3); // 3-col vs 2-col / 4-col
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [sessionWishlist, setSessionWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("elarque_session_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Data fetching state
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 380);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync state back to URL query parameters
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;
    if (selectedSize) params.size = selectedSize;
    if (selectedBrand) params.brand = selectedBrand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy && sortBy !== "newest") params.sort = sortBy;
    if (currentPage > 1) params.page = String(currentPage);

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedCategory,
    selectedSize,
    selectedBrand,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // 1. Load Facets (Categories with live counts, price bounds, sizes, brands)
  useEffect(() => {
    let isMounted = true;
    const fetchFacets = async () => {
      try {
        const response = await getProductFacets();
        if (!isMounted) return;
        if (response.data?.success && response.data?.facets) {
          setFacets(response.data.facets);
        }
      } catch (err) {
        console.error("Facets load error:", err);
      }
    };

    fetchFacets();
    return () => {
      isMounted = false;
    };
  }, [retryTrigger]);

  // 2. Fetch Products whenever filters, search, sort, or page changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchFilteredProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page: currentPage,
          limit: 12,
          sort: sortBy,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;
        if (selectedSize) params.size = selectedSize;
        if (selectedBrand) params.brand = selectedBrand;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const response = await getProducts(params);
        if (!isMounted) return;

        if (response.data?.success) {
          setProducts(response.data.products || []);
          setPagination(
            response.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalProducts: 0,
              limit: 12,
            }
          );
        } else {
          setError("Unable to retrieve catalog garments from the atelier vault.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Products query error:", err);
        setError(
          err.response?.data?.message ||
            "Unable to connect to atelier catalog. Please check your network and retry."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFilteredProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    debouncedSearch,
    selectedCategory,
    selectedSize,
    selectedBrand,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    retryTrigger,
  ]);

  // Reset page to 1 when filters change
  const handleCategorySelect = (catKey) => {
    setSelectedCategory(catKey);
    setCurrentPage(1);
  };

  const handleSizeToggle = (size) => {
    setSelectedSize((prev) => (prev === size ? "" : size));
    setCurrentPage(1);
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrand((prev) => (prev === brand ? "" : brand));
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedSize("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Toggle local session wishlist
  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    const prodId = product.id || product._id;
    setSessionWishlist((prev) => {
      let updated;
      if (prev.includes(prodId)) {
        updated = prev.filter((id) => id !== prodId);
      } else {
        updated = [...prev, prodId];
      }
      try {
        localStorage.setItem("elarque_session_wishlist", JSON.stringify(updated));
      } catch (storageErr) {
        console.error(storageErr);
      }
      return updated;
    });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== "" ||
      (selectedCategory && selectedCategory !== "all") ||
      selectedSize !== "" ||
      selectedBrand !== "" ||
      minPrice !== "" ||
      maxPrice !== "" ||
      sortBy !== "newest"
    );
  }, [debouncedSearch, selectedCategory, selectedSize, selectedBrand, minPrice, maxPrice, sortBy]);

  // Total products count to show in categories
  const totalFacetCount = facets?.totalProducts || pagination.totalProducts;

  return (
    <div className="el-collections-page">
      {/* GLOBAL NAVBAR */}
      <Navbar wishlistCount={sessionWishlist.length} />

      <main className="el-collections-main">
        {/* 1. EDITORIAL HERO BANNER (MATCHING REFERENCE) */}
        <section className="el-hero-editorial-card">
          <div className="el-hero-editorial-content">
            <div className="el-hero-kicker">
              <span className="el-kicker-star">★</span>
              <span>BEST SELLER · ATELIER ICON</span>
            </div>

            <h1 className="el-hero-editorial-heading">
              Discover Signature Elegance
            </h1>

            <p className="el-hero-editorial-desc">
              Curated western luxury tailored for discerning women who command
              authority through artisanal poise and subtle European drape.
            </p>

            <div className="el-hero-editorial-ctas">
              <a href="#catalog" className="el-btn-hero-primary">
                <span>SHOP NOW</span>
                <ArrowRight size={15} />
              </a>
              <button
                type="button"
                className="el-btn-hero-secondary"
                onClick={() => {
                  const firstProd = products[0];
                  if (firstProd) {
                    navigate(`/products/${firstProd.id || firstProd._id}`);
                  } else {
                    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                VIEW DETAILS
              </button>
            </div>
          </div>

          <div className="el-hero-editorial-visual">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85"
              alt="Haute Western Signature Collection Silhouette"
              className="el-hero-editorial-img"
            />
          </div>
        </section>

        {/* 2. CATALOG SECTION ANCHOR */}
        <div id="catalog" className="el-catalog-section-wrapper">
          {/* CATALOG TOOLBAR: TITLE, SEARCH, GRID SWITCHER & SORT */}
          <div className="el-catalog-header-bar">
            <div className="el-catalog-title-group">
              <h2 className="el-catalog-title">Archival Catalog</h2>
              <span className="el-catalog-count-pill">
                ({pagination.totalProducts.toLocaleString("en-IN")} Results Found)
              </span>
            </div>

            <div className="el-catalog-controls-group">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                className="el-btn-mobile-filters"
                onClick={() => setMobileFilterOpen((prev) => !prev)}
              >
                <SlidersHorizontal size={14} />
                <span>Filters {hasActiveFilters ? "(Active)" : ""}</span>
              </button>

              {/* Search Pill Input */}
              <div className="el-catalog-search-pill">
                <Search size={14} className="el-search-icon-muted" />
                <input
                  type="text"
                  placeholder="SEARCH ITEMS..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="el-search-text-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setDebouncedSearch("");
                    }}
                    className="el-search-clear-btn"
                    title="Clear Search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Grid Density Switcher */}
              <div className="el-grid-switcher" title="Adjust Catalog Layout">
                <button
                  type="button"
                  className={`el-grid-btn ${gridColumns === 3 ? "active" : ""}`}
                  onClick={() => setGridColumns(3)}
                  aria-label="3 Columns"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  className={`el-grid-btn ${gridColumns === 2 ? "active" : ""}`}
                  onClick={() => setGridColumns(2)}
                  aria-label="2 Columns"
                >
                  <Grid2X2 size={15} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="el-sort-select-wrapper">
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="el-sort-dropdown"
                  aria-label="Sort Silhouettes"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS ROW */}
          {hasActiveFilters && (
            <div className="el-active-chips-strip">
              <span className="el-chips-label">Active Atelier Refinements:</span>
              <div className="el-chips-list">
                {debouncedSearch && (
                  <span className="el-filter-chip">
                    Search: "{debouncedSearch}"
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setDebouncedSearch("");
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {selectedCategory !== "all" && (
                  <span className="el-filter-chip">
                    Category:{" "}
                    {facets?.categories?.find(
                      (c) => c.id === selectedCategory || c._id === selectedCategory || c.name === selectedCategory
                    )?.name || selectedCategory}
                    <button type="button" onClick={() => handleCategorySelect("all")}>
                      <X size={11} />
                    </button>
                  </span>
                )}

                {selectedSize && (
                  <span className="el-filter-chip">
                    Size: {selectedSize}
                    <button type="button" onClick={() => handleSizeToggle(selectedSize)}>
                      <X size={11} />
                    </button>
                  </span>
                )}

                {selectedBrand && (
                  <span className="el-filter-chip">
                    Brand: {selectedBrand}
                    <button type="button" onClick={() => handleBrandToggle(selectedBrand)}>
                      <X size={11} />
                    </button>
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span className="el-filter-chip">
                    Price: {minPrice ? `₹${minPrice}` : "₹0"} — {maxPrice ? `₹${maxPrice}` : "Any"}
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  className="el-btn-clear-all-chips"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={11} />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          )}

          {/* TWO-COLUMN LAYOUT: SIDEBAR FILTERS & CATALOG GRID */}
          <div className="el-catalog-layout-grid">
            {/* LEFT FILTER SIDEBAR */}
            <aside className={`el-filter-sidebar ${mobileFilterOpen ? "mobile-open" : ""}`}>
              <div className="el-sidebar-header">
                <div className="el-sidebar-title-group">
                  <SlidersHorizontal size={14} className="el-gold-icon" />
                  <span className="el-sidebar-heading">Atelier Filters</span>
                </div>
                <button
                  type="button"
                  className="el-btn-reset-sidebar"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  RESET
                </button>
              </div>

              {/* 1. CURATED CATEGORIES */}
              <div className="el-filter-group">
                <h3 className="el-filter-group-title">CURATED CATEGORIES</h3>
                <div className="el-category-list">
                  <button
                    type="button"
                    className={`el-category-pill-row ${
                      selectedCategory === "all" ? "active" : ""
                    }`}
                    onClick={() => handleCategorySelect("all")}
                  >
                    <span className="el-cat-name">All Collection</span>
                    <span className="el-cat-count">
                      {totalFacetCount.toLocaleString("en-IN")}
                    </span>
                  </button>

                  {facets?.categories?.map((cat) => {
                    const isSelected =
                      selectedCategory === cat.id ||
                      selectedCategory === cat._id ||
                      selectedCategory.toLowerCase() === cat.name.toLowerCase();

                    return (
                      <button
                        key={cat.id || cat._id}
                        type="button"
                        className={`el-category-pill-row ${isSelected ? "active" : ""}`}
                        onClick={() => handleCategorySelect(cat.id || cat._id)}
                      >
                        <span className="el-cat-name">{cat.name}</span>
                        <span className="el-cat-count">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PRICE RANGE */}
              <div className="el-filter-group">
                <h3 className="el-filter-group-title">PRICE RANGE INR (₹)</h3>
                <div className="el-price-filter-box">
                  <div className="el-price-inputs-row">
                    <div className="el-price-field">
                      <span className="el-currency-affix">₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        value={minPrice}
                        onChange={(e) => {
                          setMinPrice(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="el-price-input"
                      />
                    </div>
                    <span className="el-price-separator">—</span>
                    <div className="el-price-field">
                      <span className="el-currency-affix">₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => {
                          setMaxPrice(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="el-price-input"
                      />
                    </div>
                  </div>

                  <div className="el-price-range-badge">
                    RANGE {minPrice ? `₹${Number(minPrice).toLocaleString("en-IN")}` : "₹999"} —{" "}
                    {maxPrice ? `₹${Number(maxPrice).toLocaleString("en-IN")}` : "₹10,000+"}
                  </div>
                </div>
              </div>

              {/* 3. SIZE SELECTION */}
              <div className="el-filter-group">
                <div className="el-filter-group-header">
                  <h3 className="el-filter-group-title">SIZE SELECTION</h3>
                  <span className="el-size-guide-link">Sizing Guide</span>
                </div>
                <div className="el-size-pills-grid">
                  {SIZES_CANONICAL.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`el-size-circle-btn ${isSelected ? "active" : ""}`}
                        onClick={() => handleSizeToggle(size)}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. BRANDS FILTER (IF PRESENT IN FACETS) */}
              {facets?.brands && facets.brands.length > 0 && (
                <div className="el-filter-group">
                  <h3 className="el-filter-group-title">ATELIER HOUSES</h3>
                  <div className="el-brand-list">
                    {facets.brands.map((b) => {
                      const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
                      return (
                        <button
                          key={b.name}
                          type="button"
                          className={`el-brand-row-btn ${isSelected ? "active" : ""}`}
                          onClick={() => handleBrandToggle(b.name)}
                        >
                          <span className="el-brand-name">{b.name}</span>
                          <span className="el-brand-count">({b.count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* RIGHT PRODUCT GRID CONTAINER */}
            <section className="el-catalog-grid-section">
              {/* LOADING SKELETON */}
              {loading ? (
                <div className={`el-products-grid cols-${gridColumns}`}>
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="el-product-card-skeleton">
                      <div className="el-skeleton-img" />
                      <div className="el-skeleton-line short" />
                      <div className="el-skeleton-line title" />
                      <div className="el-skeleton-line price" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* ERROR STATE */
                <div className="el-catalog-empty-card">
                  <AlertCircle size={38} color="#b91c1c" />
                  <h3 className="el-empty-heading">Catalog Retrieval Interrupted</h3>
                  <p className="el-empty-sub">{error}</p>
                  <button
                    type="button"
                    className="el-btn-empty-action"
                    onClick={() => setRetryTrigger((prev) => prev + 1)}
                  >
                    <RefreshCw size={14} />
                    <span>Retry Request</span>
                  </button>
                </div>
              ) : products.length === 0 ? (
                /* EMPTY RESULTS STATE */
                <div className="el-catalog-empty-card">
                  <Sparkles size={38} color="#c5a265" />
                  <h3 className="el-empty-heading">No Silhouettes Found</h3>
                  <p className="el-empty-sub">
                    No atelier garments match your current selection refinements. Try relaxing your
                    search term or price boundaries.
                  </p>
                  <button
                    type="button"
                    className="el-btn-empty-action"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw size={14} />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                /* PRODUCT GRID */
                <>
                  <div className={`el-products-grid cols-${gridColumns}`}>
                    {products.map((product) => {
                      const prodId = product.id || product._id;
                      const isWishlisted = sessionWishlist.includes(prodId);
                      const coverImg = resolveImageUrl(
                        product.coverImage || (product.images && product.images[0])
                      );
                      const effectivePrice = product.salePrice || product.price;
                      const hasSale =
                        product.salePrice !== undefined &&
                        product.salePrice !== null &&
                        Number(product.salePrice) < Number(product.price);

                      return (
                        <article
                          key={prodId}
                          className="el-atelier-card"
                          onClick={() => navigate(`/products/${prodId}`)}
                        >
                          {/* CARD IMAGE CONTAINER */}
                          <div className="el-card-media-wrap">
                            {/* BADGES: CATEGORY & DISCOUNT */}
                            <div className="el-card-badges-group">
                              {product.category?.name && (
                                <span className="el-badge-category">
                                  {product.category.name.toUpperCase()}
                                </span>
                              )}
                              {product.isBestSeller && (
                                <span className="el-badge-bestseller">Best Seller</span>
                              )}
                              {hasSale && product.discountPercentage ? (
                                <span className="el-badge-discount">
                                  {product.discountPercentage}% OFF
                                </span>
                              ) : null}
                            </div>

                            {/* WISHLIST TOGGLE BUTTON */}
                            <button
                              type="button"
                              className={`el-card-heart-btn ${isWishlisted ? "active" : ""}`}
                              onClick={(e) => handleWishlistToggle(e, product)}
                              aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                            >
                              <Heart
                                size={15}
                                fill={isWishlisted ? "#5c061c" : "none"}
                                stroke={isWishlisted ? "#5c061c" : "#1a1a1a"}
                              />
                            </button>

                            {/* PRODUCT IMAGE */}
                            {coverImg ? (
                              <img
                                src={coverImg}
                                alt={product.name}
                                className="el-card-product-img"
                                loading="lazy"
                              />
                            ) : (
                              <div className="el-card-img-placeholder">
                                <span>ELARQUE ATELIER</span>
                              </div>
                            )}
                          </div>

                          {/* CARD CONTENT */}
                          <div className="el-card-meta-wrap">
                            <span className="el-card-brand">
                              {product.brand ? product.brand.toUpperCase() : "ELARQUE ATELIER"}
                            </span>

                            <h3 className="el-card-title">{product.name}</h3>

                            <p className="el-card-fabric-subtitle">
                              {product.description
                                ? product.description.slice(0, 48) +
                                  (product.description.length > 48 ? "..." : "")
                                : "Premium Tailored Couture Collection"}
                            </p>

                            <div className="el-card-footer-row">
                              <div className="el-card-price-group">
                                <span className="el-card-effective-price">
                                  {formatINR(effectivePrice)}
                                </span>
                                {hasSale && (
                                  <span className="el-card-strike-price">
                                    {formatINR(product.price)}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                className="el-btn-quick-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewProduct(product);
                                }}
                              >
                                QUICK VIEW
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* 3. PAGINATION CONTROLS (MATCHING REFERENCE) */}
                  {pagination.totalPages > 1 && (
                    <footer className="el-catalog-pagination-row">
                      <button
                        type="button"
                        className="el-page-nav-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </button>

                      <div className="el-page-numbers-group">
                        {[...Array(pagination.totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          const isActive = pageNum === currentPage;

                          // Only display around active page if many pages exist
                          if (
                            pagination.totalPages > 7 &&
                            Math.abs(pageNum - currentPage) > 2 &&
                            pageNum !== 1 &&
                            pageNum !== pagination.totalPages
                          ) {
                            if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                              return (
                                <span key={pageNum} className="el-page-ellipsis">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              key={pageNum}
                              type="button"
                              className={`el-page-num-circle ${isActive ? "active" : ""}`}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="el-page-nav-btn"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={currentPage >= pagination.totalPages}
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </footer>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div
          className="el-modal-backdrop"
          onClick={() => setQuickViewProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="el-quick-view-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="el-modal-close-btn"
              onClick={() => setQuickViewProduct(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="el-modal-left-img">
              <img
                src={resolveImageUrl(
                  quickViewProduct.coverImage ||
                    (quickViewProduct.images && quickViewProduct.images[0])
                )}
                alt={quickViewProduct.name}
              />
            </div>

            <div className="el-modal-right-body">
              <span className="el-modal-brand">
                {quickViewProduct.brand || "ELARQUE ATELIER"}
              </span>

              <h2 className="el-modal-title">{quickViewProduct.name}</h2>

              <div className="el-modal-price-row">
                <span className="el-modal-active-price">
                  {formatINR(quickViewProduct.salePrice || quickViewProduct.price)}
                </span>
                {quickViewProduct.salePrice && (
                  <span className="el-modal-strike-price">
                    {formatINR(quickViewProduct.price)}
                  </span>
                )}
                {quickViewProduct.discountPercentage && (
                  <span className="el-modal-discount-tag">
                    {quickViewProduct.discountPercentage}% OFF
                  </span>
                )}
              </div>

              <p className="el-modal-desc">
                {quickViewProduct.description ||
                  "Handcrafted silhouette sculpted from exceptional fabrics with bespoke atelier finishing."}
              </p>

              {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                <div className="el-modal-sizes-section">
                  <span className="el-modal-section-label">Available Sizes:</span>
                  <div className="el-modal-size-pills">
                    {quickViewProduct.sizes.map((s) => (
                      <span key={s} className="el-modal-size-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="el-modal-actions-row">
                <button
                  type="button"
                  className="el-btn-view-details"
                  onClick={() => {
                    navigate(`/products/${quickViewProduct.id || quickViewProduct._id}`);
                  }}
                >
                  <Eye size={15} />
                  <span>View Atelier Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
};

export default Collections;
