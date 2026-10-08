import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Layers,
  LayoutDashboard,
  Shirt,
  FolderTree,
  ShoppingBag,
  Users as UsersIcon,
  Tag,
  Ticket,
  RotateCcw,
  BarChart3,
  Settings,
  LogOut,
  Search,
  X,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Info,
  Plus,
} from "lucide-react";
import "./VariantManagement.css";

const VARIANTS_API_URL = "http://localhost:5000/api/admin/variants";
const PAGE_LIMIT = 10;

// Luxury Atelier Color Swatch Mapping
const getColorHex = (color) => {
  if (!color) return "#94a3b8";
  const c = color.toLowerCase().trim();
  const colorMap = {
    black: "#111827",
    onyx: "#111827",
    white: "#f8fafc",
    burgundy: "#7a1526",
    crimson: "#991b1b",
    navy: "#1e3a8a",
    emerald: "#065f46",
    green: "#15803d",
    gold: "#d97706",
    beige: "#d4b996",
    cream: "#fef3c7",
    charcoal: "#374151",
    grey: "#6b7280",
    gray: "#6b7280",
    silver: "#9ca3af",
    rose: "#e11d48",
    pink: "#ec4899",
    camel: "#c19a6b",
    brown: "#78350f",
    lavender: "#a855f7",
    purple: "#7e22ce",
    olive: "#4d7c0f",
    ruby: "#be123c",
    champagne: "#f7e7c4",
    cognac: "#9a3412",
  };
  return colorMap[c] || "#dfc28d";
};

// Currency Formatter
const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Resolve Image URL
const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }
  return `http://localhost:5000${imagePath}`;
};

const VariantManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Backend Data State
  const [variants, setVariants] = useState([]);
  const [summary, setSummary] = useState({
    totalVariants: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [sortBy, setSortBy] = useState("stock-desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Notice Banner State
  const [noticeMessage, setNoticeMessage] = useState(
    () => location.state?.successMessage || ""
  );

  // Clear history state once consumed
  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage("");
    }, 4500);
  };

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    variantId: null,
    productId: null,
    variantColor: "",
    variantSize: "",
    productName: "",
    errorMessage: "",
    isDeleting: false,
  });

  // Open Delete Modal
  const handleOpenDeleteModal = (variant, parent) => {
    const pId = parent?.id || parent?._id;
    const vId = variant?.id || variant?._id;
    if (!pId || !vId) {
      showNotice("Unable to identify variant for deletion.");
      return;
    }

    setDeleteModal({
      isOpen: true,
      variantId: vId,
      productId: pId,
      variantColor: variant.color || "—",
      variantSize: variant.size || "—",
      productName: parent.name || "Untitled Product",
      errorMessage: "",
      isDeleting: false,
    });
  };

  // Close Delete Modal
  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return;
    setDeleteModal({
      isOpen: false,
      variantId: null,
      productId: null,
      variantColor: "",
      variantSize: "",
      productName: "",
      errorMessage: "",
      isDeleting: false,
    });
  };

  // Keyboard Escape listener for delete modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && deleteModal.isOpen && !deleteModal.isDeleting) {
        setDeleteModal({
          isOpen: false,
          variantId: null,
          productId: null,
          variantColor: "",
          variantSize: "",
          productName: "",
          errorMessage: "",
          isDeleting: false,
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModal.isOpen, deleteModal.isDeleting]);

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (
      !deleteModal.productId ||
      !deleteModal.variantId ||
      deleteModal.isDeleting
    ) {
      return;
    }

    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    setDeleteModal((prev) => ({ ...prev, isDeleting: true, errorMessage: "" }));

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/products/${deleteModal.productId}/variants/${deleteModal.variantId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.status === 200 && response.data?.success) {
        const deletedColor = deleteModal.variantColor;
        const deletedSize = deleteModal.variantSize;
        const prodName = deleteModal.productName;

        setDeleteModal({
          isOpen: false,
          variantId: null,
          productId: null,
          variantColor: "",
          variantSize: "",
          productName: "",
          errorMessage: "",
          isDeleting: false,
        });

        showNotice(
          `Variant "${deletedColor} (${deletedSize})" of "${prodName}" deleted successfully.`
        );

        // Requirement 7: If the deleted row was the only row on the current page, move to valid page
        if (variants.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        } else {
          setRetryTrigger((prev) => prev + 1);
        }
      } else {
        setDeleteModal((prev) => ({
          ...prev,
          isDeleting: false,
          errorMessage:
            response.data?.message ||
            "Failed to delete variant. Please retry.",
        }));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 409) {
        // Last-variant constraint: display backend's meaningful error message and keep variant visible
        const backendMsg =
          err.response?.data?.message ||
          "Cannot delete the only remaining variant of this product.";
        setDeleteModal((prev) => ({
          ...prev,
          isDeleting: false,
          errorMessage: backendMsg,
        }));
        return;
      }

      const msg =
        err.response?.data?.message ||
        "An unexpected error occurred while deleting the variant. Please try again.";
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        errorMessage: msg,
      }));
    }
  };

  // Logout Handler (Clears ONLY admin credentials)
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // Debounce search input (350ms) & reset to page 1
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle filter changes (Reset to page 1)
  const handleSizeChange = (e) => {
    setSelectedSize(e.target.value);
    setCurrentPage(1);
  };

  const handleStockStatusChange = (e) => {
    setSelectedStockStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedSize("");
    setSelectedStockStatus("");
    setSortBy("stock-desc");
    setCurrentPage(1);
    setRetryTrigger((prev) => prev + 1);
  };

  // Fetch Variants from API with AbortController
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchVariants = async () => {
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

        if (selectedSize) {
          params.size = selectedSize;
        }

        if (selectedStockStatus) {
          params.stockStatus = selectedStockStatus;
        }

        const response = await axios.get(VARIANTS_API_URL, {
          params,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (response.data && response.data.success) {
          const fetchedVariants = response.data.variants || [];
          const fetchedSummary = response.data.summary || {
            totalVariants: 0,
            totalUnits: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
          };
          const paginationData = response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalVariants: 0,
            limit: PAGE_LIMIT,
          };

          // Edge case: if current page is beyond totalPages and totalPages > 0
          if (
            paginationData.totalPages > 0 &&
            currentPage > paginationData.totalPages
          ) {
            setCurrentPage(paginationData.totalPages);
            return;
          }

          setVariants(fetchedVariants);
          setSummary(fetchedSummary);
          setTotalPages(paginationData.totalPages || 0);
          setTotalFiltered(paginationData.totalVariants || 0);
        } else {
          setErrorMessage("Unable to retrieve variants from atelier catalog.");
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

        const msg =
          error.response?.data?.message ||
          "An error occurred while connecting to the variant catalog. Please retry.";
        setErrorMessage(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVariants();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    currentPage,
    debouncedSearch,
    selectedSize,
    selectedStockStatus,
    sortBy,
    retryTrigger,
    navigate,
  ]);

  // Pagination calculation
  const startIndex =
    totalFiltered === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const endIndex =
    totalFiltered === 0
      ? 0
      : Math.min(startIndex + variants.length - 1, totalFiltered);

  // Generate page numbers
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
    <div className="admin-variants-page">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-crest-group">
              <span className="admin-brand-crest">EL</span>
              <span className="admin-brand-name">ELARQUE</span>
            </div>
            <span className="admin-sidebar-subtitle">ADMIN DASHBOARD</span>
          </div>

          <nav className="admin-sidebar-nav">
            <Link to="/admin" className="admin-sidebar-link">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/products" className="admin-sidebar-link">
              <Shirt size={15} />
              <span>Products</span>
            </Link>
            <Link to="/admin/variants" className="admin-sidebar-link active">
              <Layers size={15} />
              <span>Variants</span>
            </Link>
            <Link to="/admin/categories" className="admin-sidebar-link">
              <FolderTree size={15} />
              <span>Categories</span>
            </Link>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <ShoppingBag size={15} />
              <span>Orders</span>
            </span>
            <Link to="/admin/users" className="admin-sidebar-link">
              <UsersIcon size={15} />
              <span>Customers</span>
            </Link>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <Tag size={15} />
              <span>Offers</span>
            </span>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <Ticket size={15} />
              <span>Coupons</span>
            </span>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <RotateCcw size={15} />
              <span>Returns</span>
            </span>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
            </span>
            <span
              className="admin-sidebar-link"
              style={{ opacity: 0.6, cursor: "default" }}
            >
              <Settings size={15} />
              <span>Settings</span>
            </span>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-badge">
            <div className="admin-user-avatar-dot" />
            <span>Administrator</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="admin-variants-main">
        <div className="admin-variants-container">
          {/* NOTICE BANNER */}
          {noticeMessage && (
            <div className="admin-variants-notice-banner" role="status">
              <div className="admin-variants-notice-content">
                <Info size={16} />
                <span>{noticeMessage}</span>
              </div>
              <button
                type="button"
                className="admin-variants-notice-close"
                onClick={() => setNoticeMessage("")}
                aria-label="Dismiss notice"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* PAGE HEADER */}
          <header className="admin-variants-header">
            <div className="admin-variants-title-group">
              <div className="admin-header-kicker">
                <Sparkles size={13} className="kicker-icon" />
                <span>Couture Atelier Matrix</span>
              </div>
              <h1 className="admin-variants-title">Manage Variants</h1>
              <p className="admin-variants-subtitle">
                Catalog-wide inventory, size matrices, and stock reserves across
                all silhouettes.
              </p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-btn-add-variant"
                onClick={() => navigate("/admin/variants/add")}
              >
                <Plus size={15} />
                <span>Add Variant</span>
              </button>
            </div>
          </header>

          {/* 3. GLOBAL CATALOG SUMMARY STRIP */}
          <section
            className="admin-variants-stats-strip"
            aria-label="Variant Inventory Summary"
          >
            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap gold">
                <Layers size={18} />
              </div>
              <div className="admin-stat-content">
                <span className="admin-stat-number">
                  {summary.totalVariants}
                </span>
                <span className="admin-stat-label">Total Variants</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap gold">
                <Boxes size={18} />
              </div>
              <div className="admin-stat-content">
                <span className="admin-stat-number">{summary.totalUnits}</span>
                <span className="admin-stat-label">Total Units in Stock</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap amber">
                <AlertTriangle size={18} />
              </div>
              <div className="admin-stat-content">
                <span className="admin-stat-number amber-text">
                  {summary.lowStockCount}
                </span>
                <span className="admin-stat-label">Low Stock (1–5 Units)</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap rose">
                <AlertTriangle size={18} />
              </div>
              <div className="admin-stat-content">
                <span className="admin-stat-number rose-text">
                  {summary.outOfStockCount}
                </span>
                <span className="admin-stat-label">Out of Stock</span>
              </div>
            </div>
          </section>

          {/* 4. CONTROLS BAR: SEARCH, FILTERS, SORT */}
          <section
            className="admin-variants-controls"
            aria-label="Filter and Sort Variants"
          >
            <div className="admin-search-wrap">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by color, product, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="admin-search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filters-group">
              {/* Size Filter */}
              <div className="admin-filter-select-wrap">
                <select
                  className="admin-filter-select"
                  value={selectedSize}
                  onChange={handleSizeChange}
                  aria-label="Filter by size"
                >
                  <option value="">All Sizes</option>
                  <option value="XS">Size XS</option>
                  <option value="S">Size S</option>
                  <option value="M">Size M</option>
                  <option value="L">Size L</option>
                  <option value="XL">Size XL</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div className="admin-filter-select-wrap">
                <select
                  className="admin-filter-select"
                  value={selectedStockStatus}
                  onChange={handleStockStatusChange}
                  aria-label="Filter by stock status"
                >
                  <option value="">All Stock Status</option>
                  <option value="in_stock">In Stock (&gt; 5)</option>
                  <option value="low_stock">Low Stock (1–5)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="admin-filter-select-wrap">
                <select
                  className="admin-filter-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  aria-label="Sort variants"
                >
                  <option value="stock-desc">Stock: High to Low (Default)</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="size-asc">Size: XS to XL</option>
                  <option value="size-desc">Size: XL to XS</option>
                </select>
              </div>

              {/* Reset / Refresh Button */}
              <button
                type="button"
                className="admin-btn-reset-filters"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </section>

          {/* 5. TABLE / LOADING / ERROR / EMPTY STATES */}
          <div className="admin-variants-table-container">
            {loading ? (
              <div className="admin-variants-loading-state">
                <div className="admin-spinner" />
                <p>Retrieving couture variant matrices...</p>
              </div>
            ) : errorMessage ? (
              <div className="admin-variants-error-state">
                <AlertTriangle size={36} color="#f87171" />
                <h3>Catalog Connection Error</h3>
                <p>{errorMessage}</p>
                <button
                  type="button"
                  className="admin-btn-retry"
                  onClick={() => setRetryTrigger((prev) => prev + 1)}
                >
                  <RefreshCw size={14} />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : variants.length === 0 ? (
              <div className="admin-variants-empty-state">
                <SlidersHorizontal size={40} className="empty-icon" />
                <h3>No Garment Variants Found</h3>
                <p>
                  {debouncedSearch || selectedSize || selectedStockStatus
                    ? "No variants match the selected search, size, or stock criteria."
                    : "No garment variants have been registered in the catalog yet."}
                </p>
                {(debouncedSearch || selectedSize || selectedStockStatus) && (
                  <button
                    type="button"
                    className="admin-btn-clear-empty"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-table-scroll-wrap">
                <table className="admin-variants-table">
                  <thead>
                    <tr>
                      <th className="col-img">IMAGE</th>
                      <th className="col-product">PRODUCT &amp; BRAND</th>
                      <th className="col-category">CATEGORY</th>
                      <th className="col-color">COLOR</th>
                      <th className="col-size">SIZE</th>
                      <th className="col-price">PRICE</th>
                      <th className="col-stock">STOCK</th>
                      <th className="col-status">STATUS</th>
                      <th className="col-actions">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const firstImg =
                        Array.isArray(v.images) && v.images.length > 0
                          ? resolveImageUrl(v.images[0])
                          : null;
                      const parent = v.product || {};
                      const hasSale =
                        parent.salePrice !== undefined &&
                        parent.salePrice !== null &&
                        Number(parent.salePrice) < Number(parent.price);

                      return (
                        <tr key={v.id} className="admin-variant-row">
                          {/* 1. Variant Image */}
                          <td className="col-img">
                            <div className="variant-thumbnail-wrap">
                              {firstImg ? (
                                <img
                                  src={firstImg}
                                  alt={`${parent.name || "Product"} - ${v.color}`}
                                  className="variant-thumbnail"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling.style.display =
                                      "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="variant-thumbnail-placeholder"
                                style={{ display: firstImg ? "none" : "flex" }}
                              >
                                <Shirt size={16} />
                              </div>
                            </div>
                          </td>

                          {/* 2. Parent Product & Brand */}
                          <td className="col-product">
                            <div className="product-info-cell">
                              <span className="product-name">
                                {parent.name || "Untitled Product"}
                              </span>
                              <span className="product-brand">
                                {parent.brand || "ELARQUE"}
                              </span>
                            </div>
                          </td>

                          {/* 3. Category */}
                          <td className="col-category">
                            <span className="category-pill">
                              {parent.category || "Uncategorized"}
                            </span>
                          </td>

                          {/* 4. Color */}
                          <td className="col-color">
                            <div className="color-cell">
                              <span
                                className="color-swatch-dot"
                                style={{
                                  backgroundColor: getColorHex(v.color),
                                }}
                              />
                              <span className="color-name">
                                {v.color || "—"}
                              </span>
                            </div>
                          </td>

                          {/* 5. Size */}
                          <td className="col-size">
                            <span className="size-pill-badge">{v.size}</span>
                          </td>

                          {/* 6. Price */}
                          <td className="col-price">
                            <div className="price-cell">
                              {hasSale ? (
                                <>
                                  <span className="price-sale">
                                    {formatPrice(parent.salePrice)}
                                  </span>
                                  <span className="price-regular-struck">
                                    {formatPrice(parent.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="price-regular">
                                  {formatPrice(parent.price)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Stock */}
                          <td className="col-stock">
                            <span className="stock-number">{v.stock}</span>
                          </td>

                          {/* 8. Status */}
                          <td className="col-status">
                            {v.status === "in_stock" && (
                              <span className="status-badge badge-in-stock">
                                In Stock
                              </span>
                            )}
                            {v.status === "low_stock" && (
                              <span className="status-badge badge-low-stock">
                                Low Stock
                              </span>
                            )}
                            {v.status === "out_of_stock" && (
                              <span className="status-badge badge-out-of-stock">
                                Out of Stock
                              </span>
                            )}
                          </td>

                          {/* 9. Actions (Placeholders strictly conforming to scope) */}
                          <td className="col-actions">
                            <div className="actions-cell">
                              <button
                                type="button"
                                className="btn-action-edit"
                                title="Edit Variant"
                                onClick={() => {
                                  const pId = parent.id || parent._id;
                                  const vId = v.id || v._id;
                                  if (pId && vId) {
                                    navigate(`/admin/variants/edit/${pId}/${vId}`);
                                  } else {
                                    showNotice("Variant identifier not available for editing.");
                                  }
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-action-delete"
                                title="Delete Variant"
                                onClick={() => handleOpenDeleteModal(v, parent)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. PAGINATION BAR */}
            {!loading && !errorMessage && totalFiltered > 0 && (
              <footer
                className="admin-variants-pagination"
                aria-label="Variants Pagination"
              >
                <div className="pagination-info">
                  Showing <strong>{startIndex}</strong> to{" "}
                  <strong>{endIndex}</strong> of <strong>{totalFiltered}</strong>{" "}
                  variants
                </div>

                <div className="pagination-nav">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div className="pagination-numbers">
                    {startBtn > 1 && (
                      <>
                        <button
                          type="button"
                          className="page-number-btn"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </button>
                        {startBtn > 2 && <span className="page-dots">...</span>}
                      </>
                    )}

                    {pageNumbers.map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`page-number-btn ${
                          num === currentPage ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}

                    {endBtn < totalPages && (
                      <>
                        {endBtn < totalPages - 1 && (
                          <span className="page-dots">...</span>
                        )}
                        <button
                          type="button"
                          className="page-number-btn"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    title="Next Page"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </footer>
            )}
          </div>
        </div>
      </main>
      {/* 7. DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteModal.isDeleting) {
              handleCloseDeleteModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-variant-modal-title"
        >
          <div className="admin-modal-card">
            <div className="admin-modal-icon-wrapper admin-modal-icon-delete">
              <Trash2 size={24} />
            </div>

            <h2 id="delete-variant-modal-title" className="admin-modal-title">
              Delete Variant?
            </h2>

            <p className="admin-modal-description">
              Are you sure you want to permanently remove this variant? This
              action <strong className="danger-highlight">cannot be undone</strong> and will remove all stock allocation and imagery associated with this size and shade.
            </p>

            {/* Target Variant Specifications Card */}
            <div className="admin-modal-variant-details">
              <div className="modal-detail-row">
                <span className="modal-detail-label">Parent Silhouette:</span>
                <span className="modal-detail-value product-title">
                  {deleteModal.productName}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Colorway:</span>
                <span className="modal-detail-value color-badge">
                  <span
                    className="modal-color-swatch-dot"
                    style={{
                      backgroundColor: getColorHex(deleteModal.variantColor),
                    }}
                  />
                  <span>{deleteModal.variantColor}</span>
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Garment Size:</span>
                <span className="modal-detail-value size-badge">
                  {deleteModal.variantSize}
                </span>
              </div>
            </div>

            {/* Error Message inside Modal (e.g. 409 last variant or network error) */}
            {deleteModal.errorMessage && (
              <div className="admin-modal-error-alert" role="alert">
                <AlertCircle size={15} />
                <span>{deleteModal.errorMessage}</span>
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={deleteModal.isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn-confirm admin-modal-btn-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? (
                  <>
                    <span className="admin-spinner-sm" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Variant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantManagement;
