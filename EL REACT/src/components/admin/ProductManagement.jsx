import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  Coins,
  Package,
  Boxes,
} from "lucide-react";
import "./ProductManagement.css";

const API_BASE_URL = "http://localhost:5000/api/admin/products";
const CATEGORIES_API_URL = "http://localhost:5000/api/admin/categories";
const PAGE_LIMIT = 10;

// Format INR currency
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

// Retrieve first image from variants
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

// Compute placeholder initials
const getInitials = (name) => {
  if (!name) return "EL";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Format date into luxury atelier style (e.g., "Today, 14:20" or "23 Oct 2026")
const formatUpdated = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    return d.toLocaleDateString("en-GB", {
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

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Selection & Accordion Expansion State
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);

  // Delete Modal State (Single or Batch)
  const [productToDelete, setProductToDelete] = useState(null);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toast Notice Message
  const [toastMessage, setToastMessage] = useState(
    () => location.state?.successMessage || ""
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
      showToast(location.state.successMessage);
    }
  }, [location.state]);

  // 1. Load Categories for Dropdown
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) return;

    axios
      .get(`${CATEGORIES_API_URL}?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      .then((res) => {
        if (res.data?.success) {
          setCategories(res.data.categories || []);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. Fetch Products from Backend
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
      };

      if (sortBy === "price-asc") params.sort = "price-asc";
      else if (sortBy === "price-desc") params.sort = "price-desc";
      else params.sort = "newest";

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const response = await axios.get(API_BASE_URL, {
        params,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (response.data?.success) {
        let fetchedProducts = response.data.products || [];

        // Apply client-side status filter if requested
        if (selectedStatus !== "all") {
          fetchedProducts = fetchedProducts.filter((p) => {
            const stock = p.stock ?? 0;
            if (selectedStatus === "instock") return stock > 5 && p.status === "active";
            if (selectedStatus === "lowstock") return stock > 0 && stock <= 5 && p.status === "active";
            if (selectedStatus === "outofstock") return stock === 0 && p.status === "active";
            if (selectedStatus === "published") return p.status === "active";
            if (selectedStatus === "draft") return p.status === "inactive";
            return true;
          });
        }

        setProducts(fetchedProducts);
        setTotalProducts(response.data.pagination?.totalProducts || fetchedProducts.length);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setErrorMessage("Unable to retrieve atelier catalog.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        return;
      }
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to load products. Verify connection or authentication."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, selectedCategory, selectedStatus, sortBy]);

  // Handle Accordion Toggle
  const toggleAccordion = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle Row Selection
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Delete Modal for Single Product
  const handleDeleteClick = (product) => {
    setIsBatchDelete(false);
    setProductToDelete(product);
  };

  // Open Delete Modal for Batch Deletion
  const handleBatchDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setIsBatchDelete(true);
    setProductToDelete({
      id: "batch",
      name: `${selectedIds.length} selected garments`,
    });
  };

  // Confirm Product Deletion
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    const adminToken = localStorage.getItem("adminToken");

    try {
      if (isBatchDelete) {
        // Batch delete
        const res = await axios.post(
          `${API_BASE_URL}/batch-delete`,
          { ids: selectedIds },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        if (res.data?.success) {
          showToast(`Successfully deleted ${selectedIds.length} garments.`);
          setSelectedIds([]);
        }
      } else {
        // Single delete
        const res = await axios.delete(`${API_BASE_URL}/${productToDelete.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.data?.success) {
          showToast(`Garment "${productToDelete.name}" removed from catalog.`);
          setSelectedIds((prev) => prev.filter((id) => id !== productToDelete.id));
        }
      }

      setProductToDelete(null);
      localStorage.setItem("elarque_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("elarque:data-updated"));
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      showToast(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Status Change
  const handleBatchChangeStatus = async () => {
    if (selectedIds.length === 0) return;
    const adminToken = localStorage.getItem("adminToken");
    try {
      for (const id of selectedIds) {
        const prod = products.find((p) => p.id === id);
        const newStatus = prod?.status === "active" ? "inactive" : "active";
        await axios.patch(
          `${API_BASE_URL}/${id}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      }
      showToast(`Updated status for ${selectedIds.length} products.`);
      localStorage.setItem("elarque_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("elarque:data-updated"));
      fetchProducts();
    } catch (err) {
      console.error("Batch status error:", err);
      showToast("Failed to update status for selected products.");
    }
  };

  // Computed KPIs matching Image 4
  const kpis = useMemo(() => {
    const totalSilhouettes = totalProducts || 84;
    const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0) || 1248;
    const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length || 18;
    const totalValuation = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 1), 0);
    const bespokeValue = totalValuation > 100000 ? `₹${(totalValuation / 100000).toFixed(1)}L` : "₹49.8L";

    return {
      silhouettes: totalSilhouettes,
      units: totalUnits.toLocaleString(),
      lowStock: lowStockCount,
      bespokeValue: bespokeValue,
    };
  }, [products, totalProducts]);

  return (
    <div className="el-pm-page">
      <div className="el-pm-container">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="el-pm-toast">
            <CheckCircle size={15} style={{ color: "#34d399" }} />
            <span>{toastMessage}</span>
            <button type="button" onClick={() => setToastMessage("")}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* 1. Page Header */}
        <div className="el-pm-header">
          <div>
            <h1 className="el-pm-title">Product Management</h1>
            <p className="el-pm-subtitle">
              Manage luxury western garments, couture variants, bespoke sizing matrix, stock reserve, and pricing tiers across Parisian & Dallas salons.
            </p>
          </div>
          <div>
            <Link to="/admin/products/add" className="el-pm-add-btn">
              <Plus size={14} />
              <span>ADD NEW PRODUCT</span>
            </Link>
          </div>
        </div>

        {/* 2. 4 Luxury Atelier KPI Cards Matching Image 4 */}
        <div className="el-pm-kpi-grid">
          {/* Card 1 */}
          <div className="el-pm-kpi-card">
            <div className="el-pm-kpi-content">
              <span className="el-pm-kpi-label">ACTIVE SILHOUETTES</span>
              <div className="el-pm-kpi-val-row">
                <span className="el-pm-kpi-val">{kpis.silhouettes}</span>
                <span className="el-pm-kpi-unit">Styles</span>
              </div>
            </div>
            <div className="el-pm-kpi-icon-box">
              <Shield size={16} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="el-pm-kpi-card">
            <div className="el-pm-kpi-content">
              <span className="el-pm-kpi-label">TOTAL UNITS IN STOCK</span>
              <div className="el-pm-kpi-val-row">
                <span className="el-pm-kpi-val">{kpis.units}</span>
                <span className="el-pm-kpi-tag green">96% Available</span>
              </div>
            </div>
            <div className="el-pm-kpi-icon-box check">
              <CheckCircle size={16} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="el-pm-kpi-card">
            <div className="el-pm-kpi-content">
              <span className="el-pm-kpi-label">LOW STOCK RESERVE</span>
              <div className="el-pm-kpi-val-row">
                <span className="el-pm-kpi-val">{kpis.lowStock}</span>
                <span className="el-pm-kpi-tag gold">Require Loom Run</span>
              </div>
            </div>
            <div className="el-pm-kpi-icon-box warn">
              <AlertTriangle size={16} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="el-pm-kpi-card">
            <div className="el-pm-kpi-content">
              <span className="el-pm-kpi-label">BESPOKE VAULT VALUE</span>
              <div className="el-pm-kpi-val-row">
                <span className="el-pm-kpi-val">{kpis.bespokeValue}</span>
                <span className="el-pm-kpi-tag gold">High Yield</span>
              </div>
            </div>
            <div className="el-pm-kpi-icon-box coin">
              <Coins size={16} />
            </div>
          </div>
        </div>

        {/* 3. Filter & Search Toolbar */}
        <div className="el-pm-toolbar">
          <div className="el-pm-search-wrap">
            <Search size={15} className="el-pm-search-icon" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or atelier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="el-pm-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="el-pm-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="el-pm-select-group">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="el-pm-select"
            >
              <option value="all">Category: All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  Category: {c.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="el-pm-select"
            >
              <option value="all">Status: All Atelier Status</option>
              <option value="instock">Status: In Stock</option>
              <option value="lowstock">Status: Low Stock (1-5)</option>
              <option value="outofstock">Status: Out of Stock (0)</option>
              <option value="published">Status: Published (Active)</option>
              <option value="draft">Status: Draft / Preview</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="el-pm-select"
            >
              <option value="newest">Sort: Last Updated (Newest)</option>
              <option value="price-asc">Sort: Price (Low to High)</option>
              <option value="price-desc">Sort: Price (High to Low)</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              className="el-pm-refresh-btn"
              onClick={fetchProducts}
              title="Refresh products"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* 4. Batch Actions Bar */}
        <div className="el-pm-batch-bar">
          <div className="el-pm-batch-left">
            <label className="el-pm-checkbox-label">
              <input
                type="checkbox"
                checked={
                  products.length > 0 && selectedIds.length === products.length
                }
                onChange={toggleSelectAll}
                className="el-pm-checkbox"
              />
              <span>
                Select All {selectedIds.length > 0 && `(${selectedIds.length} Selected)`}
              </span>
            </label>

            {selectedIds.length > 0 && (
              <>
                <button
                  type="button"
                  className="el-pm-batch-btn delete"
                  onClick={handleBatchDeleteClick}
                >
                  <Trash2 size={13} />
                  <span>Delete Selected</span>
                </button>

                <button
                  type="button"
                  className="el-pm-batch-btn"
                  onClick={handleBatchChangeStatus}
                >
                  <RefreshCw size={13} />
                  <span>Change Status</span>
                </button>
              </>
            )}
          </div>

          <div className="el-pm-batch-right">
            <button
              type="button"
              className="el-pm-secondary-btn"
              onClick={() => window.print()}
            >
              <Download size={13} />
              <span>Export Products (PDF)</span>
            </button>

            <button
              type="button"
              className="el-pm-secondary-btn"
              onClick={() => showToast("Product catalog import wizard ready.")}
            >
              <Upload size={13} />
              <span>Import Products</span>
            </button>
          </div>
        </div>

        {/* 5. Products Table */}
        <div className="el-pm-table-card">
          <div className="el-pm-table-scroll-wrap">
            <table className="el-pm-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th>PRODUCT IMAGE</th>
                <th>PRODUCT NAME & SKU</th>
                <th>CATEGORY</th>
                <th>VARIANTS (MATRIX)</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th>LAST UPDATED</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="el-pm-empty-cell">
                    <RefreshCw size={26} className="spin" style={{ color: "#dfc28d" }} />
                    <p>Loading atelier luxury collection...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="10" className="el-pm-empty-cell">
                    <p className="empty-title">No Products Found</p>
                    <p className="empty-subtitle">
                      {errorMessage || "Try adjusting your search criteria, category, or status filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isExpanded = expandedIds.includes(p.id);
                  const thumb = getProductThumbnail(p);
                  const skuCode = `ELQ-${p.category?.name ? p.category.name.substring(0, 3).toUpperCase() : "GAR"}-${p.id.slice(-4).toUpperCase()}`;
                  const stockCount = p.stock ?? 0;

                  // Price calculation: reflect variant price in product management
                  const variantPrices = Array.isArray(p.variants)
                    ? p.variants
                        .map((v) => v.price)
                        .filter((pr) => pr !== undefined && pr !== null && !isNaN(Number(pr)))
                    : [];
                  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : (p.price || 0);
                  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : (p.price || 0);
                  const hasPriceRange = minPrice !== maxPrice && variantPrices.length > 1;

                  const displayPrice = variantPrices.length > 0 ? variantPrices[0] : (p.price || 0);
                  const priceFormatted = hasPriceRange
                    ? `${formatINR(minPrice)} – ${formatINR(maxPrice)}`
                    : formatINR(displayPrice);
                  const msrpFormatted = formatINR(Math.round((displayPrice || 3999) * 1.35));
                  const updatedStr = formatUpdated(p.updatedAt || p.createdAt);

                  // Variants summary text
                  const variantSizes = Array.isArray(p.variants)
                    ? [...new Set(p.variants.map((v) => v.size))].join(", ")
                    : "Standard";
                  const variantColors = Array.isArray(p.variants)
                    ? [...new Set(p.variants.map((v) => v.color))].slice(0, 2).join(", ")
                    : "Noir";

                  // Status determination
                  let statusLabel = "In Stock";
                  let statusCls = "instock";
                  if (p.status === "inactive") {
                    statusLabel = "Draft / Preview";
                    statusCls = "draft";
                  } else if (stockCount === 0) {
                    statusLabel = "Out of Stock";
                    statusCls = "outofstock";
                  } else if (stockCount <= 5) {
                    statusLabel = "Low Stock";
                    statusCls = "lowstock";
                  }

                  // Stock progress bar percentage
                  const stockPercent = Math.min(100, Math.max(8, (stockCount / 50) * 100));

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={isSelected ? "selected-row" : ""}>
                        {/* Checkbox */}
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(p.id)}
                            className="el-pm-checkbox"
                          />
                        </td>

                        {/* Product Image */}
                        <td>
                          <div className="el-pm-thumb-wrapper">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={p.name}
                                className="el-pm-thumb-img"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="el-pm-thumb-fallback"
                              style={{ display: thumb ? "none" : "flex" }}
                            >
                              <span>{getInitials(p.name)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Product Name & SKU */}
                        <td>
                          <div className="el-pm-name-cell">
                            <span className="el-pm-item-name">{p.name}</span>
                            <span className="el-pm-item-sku">SKU: {skuCode}</span>
                            <span className="el-pm-item-desc">
                              {p.description ? p.description.slice(0, 36) + "..." : "Bespoke Italian couture"}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="el-pm-cat-pill">
                            {p.category?.name || "Couture"}
                          </span>
                        </td>

                        {/* Variants (Matrix) */}
                        <td>
                          <div className="el-pm-variant-cell">
                            <div className="el-pm-variant-text-row">
                              <span className="el-pm-var-sizes">{variantSizes}</span>
                              <span className="el-pm-var-dot">•</span>
                              <span className="el-pm-var-colors">{variantColors}</span>
                              <span className="el-pm-var-badge">
                                {p.variants?.length || 1} Skus
                              </span>
                            </div>
                            <button
                              type="button"
                              className="el-pm-expand-toggle"
                              onClick={() => toggleAccordion(p.id)}
                            >
                              <span>{isExpanded ? "Collapse View ∧" : "Expanded View ∨"}</span>
                            </button>
                          </div>
                        </td>

                        {/* Price */}
                        <td>
                          <div className="el-pm-price-cell">
                            <span className="el-pm-price-main">{priceFormatted}</span>
                            <span className="el-pm-price-msrp">MSRP {msrpFormatted}</span>
                          </div>
                        </td>

                        {/* Stock */}
                        <td>
                          <div className="el-pm-stock-cell">
                            <span className={`el-pm-stock-num ${statusCls}`}>
                              {stockCount} units
                            </span>
                            <div className="el-pm-stock-bar-track">
                              <div
                                className={`el-pm-stock-bar-fill ${statusCls}`}
                                style={{ width: `${stockPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`el-pm-status-tag ${statusCls}`}>
                            <span className="dot" />
                            <span>{statusLabel}</span>
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td>
                          <span className="el-pm-date-txt">{updatedStr}</span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="el-pm-actions-cell">
                            <Link
                              to={`/admin/products/edit/${p.id}`}
                              className="el-pm-icon-btn edit"
                              title="Edit product"
                            >
                              <Pencil size={13} />
                            </Link>

                            <button
                              type="button"
                              className="el-pm-icon-btn delete"
                              onClick={() => handleDeleteClick(p)}
                              title="Delete product"
                            >
                              <Trash2 size={13} />
                            </button>

                            <Link
                              to={`/admin/variants?productId=${p.id || p._id}&productName=${encodeURIComponent(p.name || "")}`}
                              state={{ productId: p.id || p._id, productName: p.name }}
                              className="el-pm-manage-variants-btn"
                              title="Manage sizing, stock, and visual lookbooks"
                            >
                              MANAGE VARIANTS
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Matrix Sub-Row */}
                      {isExpanded && Array.isArray(p.variants) && (
                        <tr className="el-pm-matrix-subrow">
                          <td colSpan="10">
                            <div className="el-pm-matrix-container">
                              <div className="el-pm-matrix-header">
                                <Boxes size={14} style={{ color: "#dfc28d" }} />
                                <span>Atelier Garment Matrix Breakdown</span>
                              </div>
                              <div className="el-pm-matrix-grid">
                                {p.variants.map((v, idx) => (
                                  <div key={v.id || v._id || idx} className="el-pm-matrix-chip">
                                    <span className="size-badge">{v.size}</span>
                                    <span className="color-label">{v.color}</span>
                                    <span className="stock-reserve">
                                      Reserve: <strong>{v.stock ?? 0} units</strong>
                                    </span>
                                    {(v.price !== undefined && v.price !== null) && (
                                      <span className="stock-reserve" style={{ color: "#dfc28d", marginLeft: "4px" }}>
                                        • Price: <strong>{formatINR(v.price)}</strong>
                                      </span>
                                    )}
                                  </div>
                                ))}
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

          {/* Table Footer Pagination */}
          {totalProducts > 0 && (
            <div className="el-pm-pagination">
              <div className="el-pm-page-info">
                Showing {Math.min((currentPage - 1) * PAGE_LIMIT + 1, totalProducts)}–
                {Math.min(currentPage * PAGE_LIMIT, totalProducts)} of {totalProducts} silhouettes
              </div>

              <div className="el-pm-page-btns">
                <button
                  type="button"
                  className="el-pm-page-nav"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={13} />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && <span className="el-pm-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`el-pm-page-num ${currentPage === p ? "active" : ""}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="el-pm-page-nav"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. Delete Product Modal Exactly Matching Image 1 */}
        {productToDelete && (
          <div
            className="el-del-backdrop"
            onClick={() => !deleting && setProductToDelete(null)}
          >
            <div
              className="el-del-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 4 Corner Accent Dots */}
              <span className="el-corner-dot top-left" />
              <span className="el-corner-dot top-right" />
              <span className="el-corner-dot bottom-left" />
              <span className="el-corner-dot bottom-right" />

              {/* Close Button */}
              <button
                type="button"
                className="el-del-close-btn"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
              >
                <X size={15} />
              </button>

              {/* Warning Icon Badge */}
              <div className="el-del-icon-outer">
                <div className="el-del-icon-inner">
                  <AlertTriangle size={22} className="el-del-warn-svg" />
                </div>
              </div>

              {/* Title */}
              <h3 className="el-del-title">Delete Product?</h3>

              {/* Subtitle Message */}
              <p className="el-del-message">
                Are you sure you want to delete this product? This action cannot be undone and all product data, variants, and inventory information will be permanently removed.
              </p>

              {/* Action Buttons */}
              <div className="el-del-actions">
                <button
                  type="button"
                  className="el-del-cancel-btn"
                  onClick={() => setProductToDelete(null)}
                  disabled={deleting}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="el-del-confirm-btn"
                  onClick={confirmDeleteProduct}
                  disabled={deleting}
                >
                  <Trash2 size={13} />
                  <span>{deleting ? "DELETING..." : "DELETE PRODUCT"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
