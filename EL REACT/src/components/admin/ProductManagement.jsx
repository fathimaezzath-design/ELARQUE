import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

// Realistic Mock Luxury Fashion Products
const INITIAL_MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "Executive Burgundy Blazer",
    sku: "ELQ-BLZ-701",
    category: "Blazers",
    price: "₹24,999",
    stock: 42,
    maxStock: 50,
    status: "In Stock",
    statusType: "in-stock",
    lastUpdated: "Today, 14:22",
    imageInitials: "BB",
    imageGradient: "linear-gradient(135deg, #7a1526 0%, #3d0711 100%)",
    sizes: ["S", "M", "L"],
    colors: ["Burgundy", "Black"],
    variants: [
      { id: "v1-1", color: "Burgundy", size: "S", stock: 12, salon: "Dallas Salon Reserve" },
      { id: "v1-2", color: "Burgundy", size: "M", stock: 15, salon: "Parisian Salon Main" },
      { id: "v1-3", color: "Burgundy", size: "L", stock: 8, salon: "Dallas Salon Reserve" },
      { id: "v1-4", color: "Black", size: "M", stock: 7, salon: "Parisian Salon Main" },
    ],
  },
  {
    id: "prod-2",
    name: "Executive Cream Silk Suit",
    sku: "ELQ-SUT-702",
    category: "Suits",
    price: "₹34,500",
    stock: 12,
    maxStock: 40,
    status: "Low Stock",
    statusType: "low-stock",
    lastUpdated: "Yesterday, 18:10",
    imageInitials: "CS",
    imageGradient: "linear-gradient(135deg, #dfc28d 0%, #7d6537 100%)",
    sizes: ["38R", "40R", "42R"],
    colors: ["Cream", "Champagne"],
    variants: [
      { id: "v2-1", color: "Cream", size: "38R", stock: 4, salon: "Parisian Salon Main" },
      { id: "v2-2", color: "Cream", size: "40R", stock: 5, salon: "Dallas Salon Reserve" },
      { id: "v2-3", color: "Champagne", size: "42R", stock: 3, salon: "Parisian Salon Main" },
    ],
  },
  {
    id: "prod-3",
    name: "Office Crepe Pencil Dress",
    sku: "ELQ-DRS-703",
    category: "Dresses",
    price: "₹18,900",
    stock: 28,
    maxStock: 35,
    status: "In Stock",
    statusType: "in-stock",
    lastUpdated: "3 days ago",
    imageInitials: "PD",
    imageGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Midnight Navy", "Onyx"],
    variants: [
      { id: "v3-1", color: "Midnight Navy", size: "XS", stock: 6, salon: "Dallas Salon Reserve" },
      { id: "v3-2", color: "Midnight Navy", size: "S", stock: 10, salon: "Parisian Salon Main" },
      { id: "v3-3", color: "Midnight Navy", size: "M", stock: 8, salon: "Dallas Salon Reserve" },
      { id: "v3-4", color: "Onyx", size: "L", stock: 4, salon: "Parisian Salon Main" },
    ],
  },
  {
    id: "prod-4",
    name: "Modern Wide-Leg Trousers",
    sku: "ELQ-TRS-704",
    category: "Trousers",
    price: "₹12,400",
    stock: 0,
    maxStock: 30,
    status: "Out of Stock",
    statusType: "out-of-stock",
    lastUpdated: "5 days ago",
    imageInitials: "WT",
    imageGradient: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
    sizes: ["28", "30", "32"],
    colors: ["Charcoal", "Taupe"],
    variants: [
      { id: "v4-1", color: "Charcoal", size: "28", stock: 0, salon: "Parisian Salon Main" },
      { id: "v4-2", color: "Charcoal", size: "30", stock: 0, salon: "Dallas Salon Reserve" },
      { id: "v4-3", color: "Taupe", size: "32", stock: 0, salon: "Dallas Salon Reserve" },
    ],
  },
  {
    id: "prod-5",
    name: "Pleated Frontier Silk Shirt",
    sku: "ELQ-SHT-705",
    category: "Shirts",
    price: "₹15,200",
    stock: 16,
    maxStock: 25,
    status: "Draft / Preview",
    statusType: "draft",
    lastUpdated: "1 week ago",
    imageInitials: "FS",
    imageGradient: "linear-gradient(135deg, #475569 0%, #1e1b4b 100%)",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Pearl White", "Ivory"],
    variants: [
      { id: "v5-1", color: "Pearl White", size: "S", stock: 5, salon: "Parisian Salon Main" },
      { id: "v5-2", color: "Pearl White", size: "M", stock: 6, salon: "Dallas Salon Reserve" },
      { id: "v5-3", color: "Ivory", size: "L", stock: 3, salon: "Parisian Salon Main" },
      { id: "v5-4", color: "Ivory", size: "XL", stock: 2, salon: "Dallas Salon Reserve" },
    ],
  },
];

const ProductManagement = () => {
  const navigate = useNavigate();

  // Mock Products & UI State
  const [products] = useState(INITIAL_MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updated-desc");

  // Selection & Accordion Expansion State
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState(["prod-1"]); // Product 1 expanded by default for preview
  const [activePage, setActivePage] = useState(1);

  // Placeholder Notice Banner
  const [noticeMessage, setNoticeMessage] = useState("");

  const showPlaceholderNotice = (actionName) => {
    setNoticeMessage(`Action "${actionName}" is a placeholder in Step 12D. Backend integration will be connected in subsequent steps.`);
    setTimeout(() => {
      setNoticeMessage("");
    }, 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // Filter products by client search & selects
  const filteredProducts = products.filter((prod) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      prod.name.toLowerCase().includes(query) ||
      prod.sku.toLowerCase().includes(query) ||
      prod.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "all" || prod.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || prod.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle selection for a single product
  const toggleSelectProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Toggle variant matrix expansion
  const toggleExpandMatrix = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("updated-desc");
  };

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
              onClick={() => showPlaceholderNotice("+ ADD NEW PRODUCT")}
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
              <div className="stat-value">84</div>
              <div className="stat-badge badge-neutral">Styles</div>
            </div>
          </div>

          {/* Card 2: Total Units In Stock */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-gold">
              <Boxes size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">TOTAL UNITS IN STOCK</div>
              <div className="stat-value">1,248</div>
              <div className="stat-badge badge-emerald">96% Available</div>
            </div>
          </div>

          {/* Card 3: Low Stock Reserve */}
          <div className="admin-stat-card">
            <div className="stat-card-icon-wrap icon-amber">
              <AlertTriangle size={20} />
            </div>
            <div className="stat-card-content">
              <div className="stat-label">LOW STOCK RESERVE</div>
              <div className="stat-value">18</div>
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
              <div className="stat-value">₹49.8L</div>
              <div className="stat-badge badge-gold">High Yield</div>
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
              placeholder="Burgundy Tailored Blazer..."
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            {/* Category Select */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Category: Bespoke Blazers (42)</option>
                <option value="Blazers">Category: Blazers (42)</option>
                <option value="Suits">Category: Couture Suits (18)</option>
                <option value="Dresses">Category: Evening Dresses (14)</option>
                <option value="Trousers">Category: Tailored Trousers (10)</option>
                <option value="Shirts">Category: Frontier Shirts (16)</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Status Select */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Status: All Atelier Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Draft / Preview">Draft / Preview</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Sort Select */}
            <div className="admin-select-wrap">
              <select
                className="admin-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated-desc">Sort: Last Updated (Newest)</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="stock-asc">Stock: Low to High</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {/* Refresh Button */}
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
                  filteredProducts.length > 0 &&
                  selectedIds.length === filteredProducts.length
                }
                onChange={handleSelectAll}
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
                        filteredProducts.length > 0 &&
                        selectedIds.length === filteredProducts.length
                      }
                      onChange={handleSelectAll}
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
                {filteredProducts.map((product) => {
                  const isExpanded = expandedIds.includes(product.id);
                  const isSelected = selectedIds.includes(product.id);
                  const stockPercent = Math.min(
                    100,
                    Math.round((product.stock / product.maxStock) * 100)
                  );

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
                            style={{ background: product.imageGradient }}
                          >
                            <span className="thumb-initials">{product.imageInitials}</span>
                          </div>
                        </td>

                        {/* 3. PRODUCT NAME & SKU */}
                        <td className="col-product">
                          <div className="product-identity">
                            <span className="product-name">{product.name}</span>
                            <span className="product-sku">SKU: {product.sku}</span>
                          </div>
                        </td>

                        {/* 4. CATEGORY */}
                        <td className="col-category">
                          <span className="category-pill">{product.category}</span>
                        </td>

                        {/* 5. VARIANTS (MATRIX) */}
                        <td className="col-variants">
                          <div className="variants-cell">
                            <div className="variants-summary">
                              <span className="variant-sizes">
                                {product.sizes.join(", ")}
                              </span>
                              <span className="variant-colors">
                                {product.colors.join(", ")}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`btn-view-matrix ${isExpanded ? "active" : ""}`}
                              onClick={() => toggleExpandMatrix(product.id)}
                            >
                              <span>{isExpanded ? "Hide Matrix" : "View Matrix"}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </div>
                        </td>

                        {/* 6. PRICE */}
                        <td className="col-price">
                          <span className="price-tag">{product.price}</span>
                        </td>

                        {/* 7. STOCK DISPLAY */}
                        <td className="col-stock">
                          <div className="stock-display">
                            <span className="stock-units">{product.stock} units</span>
                            <div className="stock-progress-bar">
                              <div
                                className={`stock-progress-fill fill-${product.statusType}`}
                                style={{ width: `${stockPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 8. STATUS BADGES */}
                        <td className="col-status">
                          <span className={`status-badge status-${product.statusType}`}>
                            <span className="status-dot" />
                            <span>{product.status}</span>
                          </span>
                        </td>

                        {/* 9. LAST UPDATED */}
                        <td className="col-updated">
                          <span className="updated-text">{product.lastUpdated}</span>
                        </td>

                        {/* 10. ACTIONS */}
                        <td className="col-actions">
                          <div className="action-buttons-group">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => showPlaceholderNotice(`Edit ${product.name}`)}
                              title="Edit Silhouette"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => showPlaceholderNotice(`View ${product.name}`)}
                              title="View Atelier Details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              onClick={() => showPlaceholderNotice(`Delete ${product.name}`)}
                              title="Delete Product"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => showPlaceholderNotice(`More actions for ${product.name}`)}
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
                                    VARIANT MATRIX &amp; SALON ALLOCATION
                                  </span>
                                  <span className="matrix-sku-ref">
                                    Parent SKU: {product.sku}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="btn-add-variant"
                                  onClick={() =>
                                    showPlaceholderNotice(`+ Add Variant to ${product.sku}`)
                                  }
                                >
                                  <Plus size={13} />
                                  <span>+ Add Variant</span>
                                </button>
                              </div>

                              <div className="matrix-cards-grid">
                                {product.variants.map((v) => (
                                  <div key={v.id} className="matrix-variant-card">
                                    <div className="matrix-card-top">
                                      <div className="matrix-color-tag">
                                        <span
                                          className="color-dot"
                                          style={{
                                            backgroundColor:
                                              v.color.toLowerCase() === "burgundy"
                                                ? "#7a1526"
                                                : v.color.toLowerCase() === "black" ||
                                                  v.color.toLowerCase() === "onyx"
                                                ? "#111827"
                                                : v.color.toLowerCase() === "cream" ||
                                                  v.color.toLowerCase() === "champagne"
                                                ? "#dfc28d"
                                                : v.color.toLowerCase() === "charcoal"
                                                ? "#4b5563"
                                                : "#94a3b8",
                                          }}
                                        />
                                        <span className="color-name">{v.color}</span>
                                      </div>
                                      <span className="matrix-size-pill">
                                        Size {v.size}
                                      </span>
                                    </div>

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
                                        {v.stock} units
                                      </span>
                                    </div>

                                    <div className="matrix-salon-footer">
                                      <span className="salon-badge">{v.salon}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 10. PAGINATION */}
          <footer className="admin-pagination-footer">
            <div className="pagination-info">
              Showing <span>1–5</span> of <span>84</span> luxury silhouettes
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn btn-nav"
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn btn-page ${
                    activePage === page ? "page-active" : ""
                  }`}
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </button>
              ))}

              <span className="pagination-ellipsis">...</span>

              <button
                type="button"
                className={`pagination-btn btn-page ${
                  activePage === 9 ? "page-active" : ""
                }`}
                onClick={() => setActivePage(9)}
              >
                9
              </button>

              <button
                type="button"
                className="pagination-btn btn-nav"
                onClick={() => setActivePage((p) => Math.min(9, p + 1))}
                disabled={activePage === 9}
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
