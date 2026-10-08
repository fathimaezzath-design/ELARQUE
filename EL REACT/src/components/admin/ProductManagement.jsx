import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Search,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  Pencil,
  Eye,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Shirt,
  Boxes,
  LogOut,
  FolderTree,
  Users as UsersIcon,
} from "lucide-react";
import "./ProductManagement.css";

const API_BASE_URL = "http://localhost:5000/api/admin/products";
const CATEGORIES_API_URL = "http://localhost:5000/api/admin/categories";
const PAGE_LIMIT = 10;

// Luxury Atelier Color Mapping
const getColorHex = (color) => {
  if (!color) return "#94a3b8";
  const c = color.toLowerCase().trim();
  const colorMap = {
    black: "#111827",
    onyx: "#111827",
    white: "#f8fafc",
    burgundy: "#7a1526",
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
  return colorMap[c] || "#dfc28d";
};

// Retrieve first image from first variant that contains an image
const getProductThumbnail = (product) => {
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (Array.isArray(v.images) && v.images.length > 0) {
        const img = v.images[0];
        return img.startsWith("http") ? img : `http://localhost:5000${img}`;
      }
    }
  }
  return null;
};

// Compute placeholder initials from product name
const getInitials = (name) => {
  if (!name) return "EL";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Format ISO date string into readable Indian / Atelier format
const formatUpdated = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const ProductManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Products & Backend Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updated-desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Selection & Accordion Expansion State
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);

  // Placeholder Notice Banner
  const [noticeMessage, setNoticeMessage] = useState(
    () => location.state?.successMessage || ""
  );

  // Clear history state once consumed
  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const showPlaceholderNotice = (actionName) => {
    setNoticeMessage(
      `Action "${actionName}" is a placeholder in Step 12F. Backend integration will be connected in subsequent steps.`
    );
    setTimeout(() => {
      setNoticeMessage("");
    }, 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // 1. Load Categories on mount to populate the category filter dropdown
  useEffect(() => {
    let isMounted = true;
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) return;

    axios
      .get(`${CATEGORIES_API_URL}?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      .then((res) => {
        if (isMounted && res.data?.success) {
          setCategories(res.data.categories || []);
        }
      })
      .catch(() => {
        // Non-blocking for product listing
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounce search input (350ms) & reset pagination to page 1
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. Fetch Products from Backend with AbortController
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        navigate("/admin/login");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const params = {
          page: currentPage,
          limit: PAGE_LIMIT,
          sort: sortBy,
        };

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        if (selectedCategory && selectedCategory !== "all") {
          params.category = selectedCategory;
        }

        const response = await axios.get(API_BASE_URL, {
          params,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (response.data && response.data.success) {
          const fetchedProducts = response.data.products || [];
          const paginationData = response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            limit: PAGE_LIMIT,
          };

          // Edge case: if current page is beyond totalPages and totalPages > 0
          if (paginationData.totalPages > 0 && currentPage > paginationData.totalPages) {
            setCurrentPage(paginationData.totalPages);
            return;
          }

          setProducts(fetchedProducts);
          setTotalPages(paginationData.totalPages || 0);
          setTotalProducts(paginationData.totalProducts || 0);
        } else {
          setErrorMessage("Unable to retrieve products from atelier vault.");
        }
      } catch (error) {
        if (
          axios.isCancel(error) ||
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (!isMounted) return;

        // 401 Unauthorized -> Clear ONLY admin credentials and redirect to /admin/login
        if (error.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }

        setErrorMessage("Unable to load products. Please check connection and try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentPage, debouncedSearch, selectedCategory, sortBy, retryTrigger, navigate]);

  // Clear search input & reload page 1
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Reset all filters & search
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("updated-desc");
    setCurrentPage(1);
    setRetryTrigger((prev) => prev + 1);
  };

  // Toggle selection for a single product
  const toggleSelectProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All on current page
  const handleSelectAll = () => {
    if (products.length > 0 && selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  // Toggle variant matrix accordion expansion
  const toggleExpandMatrix = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Derive Statistics accurately from backend data
  const totalStockOnPage = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockOnPage = products.filter(
    (p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10
  ).length;
  const vaultValueOnPage = products.reduce((acc, p) => {
    const unitPrice =
      p.salePrice !== undefined && p.salePrice !== null && p.salePrice < p.price
        ? p.salePrice
        : p.price || 0;
    return acc + unitPrice * (p.stock || 0);
  }, 0);
  const formattedVaultValue =
    vaultValueOnPage >= 100000
      ? `₹${(vaultValueOnPage / 100000).toFixed(1)}L`
      : `₹${vaultValueOnPage.toLocaleString("en-IN")}`;

  // Pagination bounds calculation
  const startIndex = totalProducts === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const endIndex =
    totalProducts === 0
      ? 0
      : Math.min(startIndex + products.length - 1, totalProducts);

  // Generate pagination buttons
  const pageNumbers = [];
  const maxButtons = 5;
  let startBtn = Math.max(1, currentPage - 2);
  let endBtn = Math.min(totalPages, startBtn + maxButtons - 1);
  if (endBtn - startBtn + 1 < maxButtons) {
    startBtn = Math.max(1, endBtn - maxButtons + 1);
  }
  for (let i = startBtn; i <= endBtn; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="admin-products-page">
      {/* TOP NAVIGATION BAR */}
      <nav className="admin-nav-bar">
        <div className="admin-nav-container">
          <div className="admin-nav-brand">
            <span className="admin-brand-crest">EL</span>
            <span className="admin-brand-name">ELARQUE</span>
            <span className="admin-brand-tag">Atelier Admin</span>
          </div>

          <div className="admin-nav-links">
            <Link to="/admin/products" className="admin-nav-link active">
              <Shirt size={14} />
              <span>Products</span>
            </Link>
            <Link to="/admin/categories" className="admin-nav-link">
              <FolderTree size={14} />
              <span>Categories</span>
            </Link>
            <Link to="/admin/users" className="admin-nav-link">
              <UsersIcon size={14} />
              <span>Customers</span>
            </Link>
          </div>

          <div className="admin-nav-actions">
            <div className="admin-user-badge">
              <div className="admin-user-avatar-dot" />
              <span>Administrator</span>
            </div>
            <button
              type="button"
              className="admin-nav-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-products-container">
        {/* 1. PAGE HEADER */}
        <header className="admin-products-header">
          <div className="admin-products-title-group">
            <div className="admin-header-kicker">
              <Sparkles size={13} className="kicker-icon" />
              <span>Couture &amp; Ready-to-Wear Atelier</span>
            </div>
            <h1 className="admin-products-title">Product Management</h1>
            <p className="admin-products-subtitle">
              Manage luxury western garments, couture variants, bespoke sizing matrix,
              stock reserve, and pricing tiers across Parisian &amp; Dallas salons.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn-add-product"
              onClick={() => navigate("/admin/products/add")}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ ADD NEW PRODUCT</span>
            </button>
          </div>
        </header>

        {/* NOTICE BANNER */}
        {noticeMessage && (
          <div className="admin-notice-banner" role="status">
            <Info size={17} className="notice-icon" />
            <span>{noticeMessage}</span>
            <button
              type="button"
              className="notice-close"
              onClick={() => setNoticeMessage("")}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 2. STATISTICS CARDS */}
        <section className="admin-stats-strip">
          {/* Card 1: Active Silhouettes */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-burgundy">
              <Shirt size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">ACTIVE SILHOUETTES</div>
              <div className="stat-value">{totalProducts}</div>
              <div className="stat-badge badge-neutral">Catalog Styles</div>
            </div>
          </div>

          {/* Card 2: Total Units In Stock */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-gold">
              <Boxes size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">TOTAL UNITS IN STOCK</div>
              <div className="stat-value">{totalStockOnPage}</div>
              <div className="stat-badge badge-emerald">Loaded Reserve</div>
            </div>
          </div>

          {/* Card 3: Low Stock Reserve */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-amber">
              <AlertTriangle size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">LOW STOCK RESERVE</div>
              <div className="stat-value">{lowStockOnPage}</div>
              <div className="stat-badge badge-amber">Require Loom Run</div>
            </div>
          </div>

          {/* Card 4: Bespoke Vault Value */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-gold-accent">
              <TrendingUp size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">BESPOKE VAULT VALUE</div>
              <div className="stat-value">{formattedVaultValue}</div>
              <div className="stat-badge badge-gold">Active Reserve</div>
            </div>
          </div>
        </section>

        {/* 3. FILTER / SEARCH AREA */}
        <section className="admin-toolbar-card">
          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or brand..."
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            {/* Category Select - Dynamic from real backend categories */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Category: All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    Category: {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Status Select - Visual filter preservation */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Status: All Atelier Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Sort Select - Connected to backend sort parameter */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="updated-desc">Sort: Last Updated (Newest)</option>
                <option value="updated-asc">Sort: Last Updated (Oldest)</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="created-asc">Sort: Date Created</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Refresh / Reset Button */}
            <button
              type="button"
              className="admin-btn-refresh"
              onClick={handleResetFilters}
              title="Reset Filters"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </section>

        {/* 4. BULK ACTION AREA */}
        <section className="admin-bulk-bar">
          <div className="bulk-left">
            <label className="bulk-checkbox-label">
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={
                  products.length > 0 && selectedIds.length === products.length
                }
                onChange={handleSelectAll}
                disabled={products.length === 0}
              />
              <span className="bulk-count-text">
                Select All ({selectedIds.length} Selected)
              </span>
            </label>

            <button
              type="button"
              className="bulk-action-btn btn-danger-ghost"
              onClick={() => showPlaceholderNotice("Delete Selected")}
              disabled={selectedIds.length === 0}
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              className="bulk-action-btn btn-neutral"
              onClick={() => showPlaceholderNotice("Change Status")}
              disabled={selectedIds.length === 0}
            >
              <SlidersHorizontal size={13} />
              <span>Change Status</span>
            </button>
          </div>

          <div className="bulk-right">
            <button
              type="button"
              className="bulk-btn-secondary"
              onClick={() => showPlaceholderNotice("Export Products (PDF)")}
            >
              <Download size={13} />
              <span>Export Products (PDF)</span>
            </button>

            <button
              type="button"
              className="bulk-btn-secondary"
              onClick={() => showPlaceholderNotice("Import Products")}
            >
              <Upload size={13} />
              <span>Import Products</span>
            </button>
          </div>
        </section>

        {/* 5. PRODUCT TABLE */}
        <section className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={
                        products.length > 0 && selectedIds.length === products.length
                      }
                      onChange={handleSelectAll}
                      disabled={products.length === 0}
                    />
                  </th>
                  <th className="col-image">PRODUCT IMAGE</th>
                  <th className="col-product">PRODUCT NAME &amp; SKU</th>
                  <th className="col-category">CATEGORY</th>
                  <th className="col-variants">VARIANTS (MATRIX)</th>
                  <th className="col-price">PRICE</th>
                  <th className="col-stock">STOCK</th>
                  <th className="col-status">STATUS</th>
                  <th className="col-updated">LAST UPDATED</th>
                  <th className="col-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Loading State */}
                {loading ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-table-loading-state">
                        <div className="admin-table-spinner" />
                        <p>Retrieving luxury silhouettes from atelier vault...</p>
                      </div>
                    </td>
                  </tr>
                ) : errorMessage ? (
                  /* 2. Error State */
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-table-error-state">
                        <AlertTriangle size={32} color="#fca5a5" />
                        <p>{errorMessage}</p>
                        <button
                          type="button"
                          className="admin-table-retry-btn"
                          onClick={() => setRetryTrigger((prev) => prev + 1)}
                        >
                          <RefreshCw size={14} />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  /* 3. Empty State */
                  <tr>
                    <td colSpan={10}>
                      <div className="admin-table-empty-state">
                        <Shirt size={36} color="#8e7a69" />
                        <p>
                          {debouncedSearch || (selectedCategory && selectedCategory !== "all")
                            ? "No matching luxury products found for current search and filters."
                            : "No luxury silhouettes found in atelier vault."}
                        </p>
                        {(debouncedSearch || (selectedCategory && selectedCategory !== "all")) && (
                          <button
                            type="button"
                            className="admin-table-retry-btn"
                            onClick={handleResetFilters}
                          >
                            <RefreshCw size={14} />
                            <span>Reset Search &amp; Filters</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* 4. Product Data Rows */
                  products.map((product) => {
                    const isExpanded = expandedIds.includes(product.id);
                    const isSelected = selectedIds.includes(product.id);
                    const thumbnailUrl = getProductThumbnail(product);
                    const initials = getInitials(product.name);

                    // Extract unique sizes & colors for the summary
                    const sizes = Array.from(
                      new Set(
                        (product.variants || []).map((v) => v.size).filter(Boolean)
                      )
                    );
                    const colors = Array.from(
                      new Set(
                        (product.variants || []).map((v) => v.color).filter(Boolean)
                      )
                    );

                    // Determine effective price
                    const activePrice =
                      product.salePrice !== undefined &&
                      product.salePrice !== null &&
                      product.salePrice !== "" &&
                      product.salePrice < product.price
                        ? product.salePrice
                        : product.price;

                    const formattedPrice =
                      typeof activePrice === "number"
                        ? `₹${activePrice.toLocaleString("en-IN")}`
                        : activePrice || "₹0";

                    // Stock & Status calculations
                    const stockUnits = product.stock ?? 0;
                    const statusType =
                      product.status === "inactive"
                        ? "draft"
                        : stockUnits === 0
                        ? "out-of-stock"
                        : stockUnits <= 10
                        ? "low-stock"
                        : "in-stock";
                    const stockPercent =
                      stockUnits === 0
                        ? 0
                        : Math.min(100, Math.max(12, stockUnits * 2));

                    return (
                      <React.Fragment key={product.id}>
                        <tr className={`product-row ${isSelected ? "row-selected" : ""}`}>
                          {/* 1. Checkbox */}
                          <td className="col-checkbox">
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(product.id)}
                            />
                          </td>

                          {/* 2. PRODUCT IMAGE */}
                          <td className="col-image">
                            <div
                              className="product-thumbnail"
                              style={{
                                background: !thumbnailUrl
                                  ? "linear-gradient(135deg, #3d0e1b 0%, #17050a 100%)"
                                  : undefined,
                              }}
                            >
                              {thumbnailUrl ? (
                                <img
                                  src={thumbnailUrl}
                                  alt={product.name}
                                  className="product-thumbnail-img"
                                />
                              ) : (
                                <span className="thumb-initials">{initials}</span>
                              )}
                            </div>
                          </td>

                          {/* 3. PRODUCT NAME & SKU */}
                          <td className="col-product">
                            <div className="product-identity">
                              <span className="product-name">{product.name}</span>
                              {product.sku && (
                                <span className="product-sku">SKU: {product.sku}</span>
                              )}
                            </div>
                          </td>

                          {/* 4. CATEGORY */}
                          <td className="col-category">
                            <span className="category-pill">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </td>

                          {/* 5. VARIANTS (MATRIX) */}
                          <td className="col-variants">
                            <div className="variants-cell">
                              <div className="variants-summary">
                                <span className="variant-sizes">
                                  {sizes.length > 0
                                    ? sizes.join(", ")
                                    : "No sizes specified"}
                                </span>
                                <span className="variant-colors">
                                  {colors.length > 0
                                    ? colors.join(", ")
                                    : "No colors specified"}
                                </span>
                              </div>
                              {Array.isArray(product.variants) &&
                                product.variants.length > 0 && (
                                  <button
                                    type="button"
                                    className={`btn-view-matrix ${
                                      isExpanded ? "active" : ""
                                    }`}
                                    onClick={() => toggleExpandMatrix(product.id)}
                                  >
                                    <span>
                                      {isExpanded ? "Hide Matrix" : "View Matrix"}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp size={12} />
                                    ) : (
                                      <ChevronDown size={12} />
                                    )}
                                  </button>
                                )}
                            </div>
                          </td>

                          {/* 6. PRICE */}
                          <td className="col-price">
                            <span className="price-tag">{formattedPrice}</span>
                          </td>

                          {/* 7. STOCK DISPLAY */}
                          <td className="col-stock">
                            <div className="stock-display">
                              <span className="stock-units">
                                {stockUnits} units
                              </span>
                              <div className="stock-progress-bar">
                                <div
                                  className={`stock-progress-fill fill-${statusType}`}
                                  style={{ width: `${stockPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 8. STATUS BADGES */}
                          <td className="col-status">
                            <span className={`status-badge status-${statusType}`}>
                              <span className="status-dot" />
                              <span>
                                {product.status
                                  ? product.status.charAt(0).toUpperCase() +
                                    product.status.slice(1)
                                  : "Active"}
                              </span>
                            </span>
                          </td>

                          {/* 9. LAST UPDATED */}
                          <td className="col-updated">
                            <span className="updated-text">
                              {formatUpdated(product.updatedAt)}
                            </span>
                          </td>

                          {/* 10. ACTIONS */}
                          <td className="col-actions">
                            <div className="action-buttons-group">
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() =>
                                  showPlaceholderNotice(`Edit ${product.name}`)
                                }
                                title="Edit Silhouette"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() =>
                                  showPlaceholderNotice(`View ${product.name}`)
                                }
                                title="View Atelier Details"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon btn-icon-danger"
                                onClick={() =>
                                  showPlaceholderNotice(`Delete ${product.name}`)
                                }
                                title="Delete Product"
                              >
                                <Trash2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() =>
                                  showPlaceholderNotice(
                                    `More actions for ${product.name}`
                                  )
                                }
                                title="More Options"
                              >
                                <MoreHorizontal size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 6. EXPANDED VARIANT MATRIX ACCORDION ROW */}
                        {isExpanded && (
                          <tr className="variant-matrix-row">
                            <td colSpan={10} className="variant-matrix-cell">
                              <div className="variant-matrix-panel">
                                <div className="matrix-panel-header">
                                  <div className="matrix-title-group">
                                    <Layers size={14} className="matrix-icon" />
                                    <span className="matrix-title">
                                      VARIANT MATRIX &amp; STOCK ALLOCATION
                                    </span>
                                    {product.sku && (
                                      <span className="matrix-sku-ref">
                                        Parent SKU: {product.sku}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-add-variant"
                                    onClick={() =>
                                      showPlaceholderNotice(
                                        `+ Add Variant to ${product.name}`
                                      )
                                    }
                                  >
                                    <Plus size={13} />
                                    <span>+ Add Variant</span>
                                  </button>
                                </div>

                                <div className="matrix-cards-grid">
                                  {(product.variants || []).map((v, vIdx) => {
                                    const variantImages = Array.isArray(v.images)
                                      ? v.images
                                      : [];
                                    const firstImg =
                                      variantImages.length > 0
                                        ? variantImages[0].startsWith("http")
                                          ? variantImages[0]
                                          : `http://localhost:5000${variantImages[0]}`
                                        : null;

                                    return (
                                      <div
                                        key={v._id || vIdx}
                                        className="matrix-variant-card"
                                      >
                                        <div className="matrix-card-top">
                                          <div className="matrix-color-tag">
                                            <span
                                              className="color-dot"
                                              style={{
                                                backgroundColor: getColorHex(
                                                  v.color
                                                ),
                                              }}
                                            />
                                            <span className="color-name">
                                              {v.color || "Default"}
                                            </span>
                                          </div>
                                          <span className="matrix-size-pill">
                                            Size {v.size || "Standard"}
                                          </span>
                                        </div>

                                        {firstImg && (
                                          <div className="matrix-images-strip">
                                            <img
                                              src={firstImg}
                                              alt={`${product.name} ${v.color}`}
                                              className="matrix-variant-img"
                                            />
                                          </div>
                                        )}

                                        <div className="matrix-stock-info">
                                          <span className="stock-reserve-label">
                                            Stock Reserve:
                                          </span>
                                          <span
                                            className={`stock-reserve-val ${
                                              v.stock === 0
                                                ? "text-out"
                                                : v.stock <= 5
                                                ? "text-low"
                                                : "text-ok"
                                            }`}
                                          >
                                            {v.stock ?? 0} units
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 10. PAGINATION */}
          <footer className="admin-pagination-footer">
            <div className="pagination-info">
              Showing <span>{startIndex}–{endIndex}</span> of{" "}
              <span>{totalProducts}</span> luxury silhouettes
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn btn-nav"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn btn-page ${
                    currentPage === page ? "page-active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  {page}
                </button>
              ))}

              {totalPages > maxButtons && !pageNumbers.includes(totalPages) && (
                <>
                  <span className="pagination-ellipsis">...</span>
                  <button
                    type="button"
                    className={`pagination-btn btn-page ${
                      currentPage === totalPages ? "page-active" : ""
                    }`}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={loading}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="pagination-btn btn-nav"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages || totalPages === 0 || loading}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default ProductManagement;
