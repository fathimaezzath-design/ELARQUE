import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  ShoppingBag,
  Users as UsersIcon,
  Tag,
  Ticket,
  RotateCcw,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import ProductImageUploader from "./ProductImageUploader";
import "./AddProduct.css";

const API_BASE_URL = "http://localhost:5000/api/admin/products";
const CATEGORIES_API_URL = "http://localhost:5000/api/admin/categories";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];

const AddProduct = () => {
  const navigate = useNavigate();

  // Basic Product Fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("ELARQUE Haute Couture");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [status, setStatus] = useState("active");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Uploaded Media URLs from ProductImageUploader
  const [uploadedImages, setUploadedImages] = useState([]);

  // Categories Loading State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [retryCategories, setRetryCategories] = useState(0);

  // Garment Variants State
  const [variants, setVariants] = useState([
    {
      id: "v-initial-1",
      color: "Burgundy",
      colorHex: "#5A1E2A",
      size: "M",
      stock: 10,
    },
  ]);

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // Logout handler - strictly admin credentials
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // 1. Fetch Categories for Dropdown
  useEffect(() => {
    let isMounted = true;
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    const fetchCategories = async () => {
      setLoadingCategories(true);
      setCategoryError("");
      try {
        const response = await axios.get(
          `${CATEGORIES_API_URL}?page=1&limit=100`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (!isMounted) return;

        if (response.data?.success && Array.isArray(response.data?.categories)) {
          const fetchedCats = response.data.categories;
          setCategories(fetchedCats);
          if (fetchedCats.length > 0) {
            setCategoryId((prev) => prev || fetchedCats[0].id || fetchedCats[0]._id);
          }
        } else {
          setCategoryError("Unable to retrieve atelier categories.");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
        setCategoryError(
          "Failed to load product categories. Please check connection and retry."
        );
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [navigate, retryCategories]);

  // Handle Image Upload Completion from ProductImageUploader
  const handleImagesUploaded = (imageUrls) => {
    if (Array.isArray(imageUrls)) {
      setUploadedImages(imageUrls);
      setFormErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  // Variant Management Handlers
  const handleAddVariant = () => {
    const newVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      color: "Obsidian Black",
      colorHex: "#141414",
      size: "M",
      stock: 10,
    };
    setVariants((prev) => [...prev, newVariant]);
    setFormErrors((prev) => ({ ...prev, variants: "" }));
  };

  const handleRemoveVariant = (indexToRemove) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleVariantFieldChange = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [field]: value } : v))
    );
    setFormErrors((prev) => ({ ...prev, variants: "" }));
  };

  // Derived Total Variant Stock for read-only summary
  const totalStockQuantity = variants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

  // Validate form before submission
  const validate = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = "Product name is required.";
    }

    if (!brand.trim()) {
      errors.brand = "Brand is required.";
    }

    if (!description.trim()) {
      errors.description = "Product description is required.";
    }

    if (!categoryId) {
      errors.category = "Please select a category.";
    }

    const numPrice = Number(price);
    if (price === "" || isNaN(numPrice) || numPrice < 0) {
      errors.price = "Price must be a valid number greater than or equal to 0.";
    }

    if (salePrice !== "" && salePrice !== undefined && salePrice !== null) {
      const numSalePrice = Number(salePrice);
      if (isNaN(numSalePrice) || numSalePrice < 0) {
        errors.salePrice =
          "Sale price must be a valid number greater than or equal to 0.";
      } else if (numSalePrice > numPrice) {
        errors.salePrice = "Sale price cannot be greater than regular price.";
      }
    }

    if (!uploadedImages || uploadedImages.length < 3) {
      errors.images =
        "Please upload and confirm at least 3 cropped images using the uploader below.";
    }

    if (!variants || variants.length === 0) {
      errors.variants = "At least one garment variant is required.";
    } else {
      const combinationsSeen = new Set();
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const trimmedColor = (v.color || "").trim();
        const trimmedSize = (v.size || "").trim();
        const numStock = Number(v.stock);

        if (!trimmedColor) {
          errors.variants = `Variant #${i + 1}: Color name is required.`;
          break;
        }

        if (!trimmedSize) {
          errors.variants = `Variant #${i + 1}: Size is required.`;
          break;
        }

        if (
          v.stock === "" ||
          isNaN(numStock) ||
          numStock < 0 ||
          !Number.isInteger(numStock)
        ) {
          errors.variants = `Variant #${
            i + 1
          }: Stock must be a whole number greater than or equal to 0.`;
          break;
        }

        const comboKey = `${trimmedColor.toLowerCase()}__${trimmedSize.toLowerCase()}`;
        if (combinationsSeen.has(comboKey)) {
          errors.variants = `Duplicate variant: Combination of Color "${trimmedColor}" and Size "${trimmedSize}" already exists.`;
          break;
        }
        combinationsSeen.add(comboKey);
      }
    }

    return errors;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build safe payload conforming strictly to backend schema
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        brand: brand.trim(),
        price: Number(price),
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        status: status === "inactive" ? "inactive" : "active",
        variants: variants.map((v, idx) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock),
          images: idx === 0 ? uploadedImages : [],
        })),
      };

      if (salePrice !== "" && salePrice !== undefined && salePrice !== null) {
        payload.salePrice = Number(salePrice);
      }

      const response = await axios.post(API_BASE_URL, payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201 && response.data?.success) {
        navigate("/admin/products", {
          state: {
            successMessage: `Product "${name.trim()}" created successfully in atelier collection.`,
          },
        });
      } else {
        setSubmitError("Failed to create product. Please verify and retry.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        return;
      }
      if (err.response?.status === 409) {
        setSubmitError("A product with this name already exists.");
      } else {
        const errorMsg =
          err.response?.data?.message ||
          "An error occurred while creating the product. Please try again.";
        setSubmitError(errorMsg);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-add-product-page">
      {/* LEFT SIDEBAR NAVIGATION */}
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
            <Link to="/admin/products" className="admin-sidebar-link active">
              <Shirt size={15} />
              <span>Products</span>
            </Link>
            <Link to="/admin/categories" className="admin-sidebar-link">
              <FolderTree size={15} />
              <span>Categories</span>
            </Link>
            <span className="admin-sidebar-link" style={{ opacity: 0.6, cursor: "default" }}>
              <ShoppingBag size={15} />
              <span>Orders</span>
            </span>
            <Link to="/admin/users" className="admin-sidebar-link">
              <UsersIcon size={15} />
              <span>Customers</span>
            </Link>
            <span className="admin-sidebar-link" style={{ opacity: 0.6, cursor: "default" }}>
              <Tag size={15} />
              <span>Offers</span>
            </span>
            <span className="admin-sidebar-link" style={{ opacity: 0.6, cursor: "default" }}>
              <Ticket size={15} />
              <span>Coupons</span>
            </span>
            <span className="admin-sidebar-link" style={{ opacity: 0.6, cursor: "default" }}>
              <RotateCcw size={15} />
              <span>Returns</span>
            </span>
            <span className="admin-sidebar-link" style={{ opacity: 0.6, cursor: "default" }}>
              <BarChart3 size={15} />
              <span>Sales Report</span>
            </span>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-add-product-main">
        <form onSubmit={handleSubmit} noValidate>
          <div className="admin-add-product-card">
            {/* Header */}
            <header className="admin-add-header">
              <div className="admin-header-kicker">
                <Sparkles size={13} />
                <span>Haute Couture Atelier Creation</span>
              </div>
              <h1 className="admin-add-title">ADD NEW PRODUCT</h1>
              <p className="admin-add-subtitle">
                Add a new luxury fashion product to your collection.
              </p>
            </header>

            {/* Global Error Banner */}
            {submitError && (
              <div className="admin-form-alert admin-alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* 1. PRODUCT MEDIA & LOOKBOOK COVER */}
            <section className="admin-form-section">
              <h2 className="admin-section-heading">
                PRODUCT MEDIA &amp; LOOKBOOK COVER
              </h2>
              <p className="admin-section-subheading">
                Upload 3 to 10 high-resolution visuals. Crop to standard 3:4 portrait
                and designate an atelier Lookbook Cover.
              </p>

              <ProductImageUploader
                onUploadComplete={handleImagesUploaded}
                minImages={3}
                maxImages={10}
                disabled={isSubmitting}
              />

              {formErrors.images && (
                <div className="admin-field-error" style={{ marginTop: "10px" }}>
                  {formErrors.images}
                </div>
              )}
            </section>

            {/* 2. PRODUCT NAME & BRAND */}
            <section className="admin-form-section">
              <div className="admin-form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-name-input">
                    PRODUCT NAME <span className="req">*</span>
                  </label>
                  <input
                    id="product-name-input"
                    type="text"
                    className={`admin-form-input ${
                      formErrors.name ? "has-error" : ""
                    }`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    placeholder="e.g. Executive Burgundy Velvet Blazer"
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <span className="admin-field-error">{formErrors.name}</span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-brand-input">
                    BRAND <span className="req">*</span>
                  </label>
                  <input
                    id="product-brand-input"
                    type="text"
                    className={`admin-form-input ${
                      formErrors.brand ? "has-error" : ""
                    }`}
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      if (formErrors.brand) {
                        setFormErrors((prev) => ({ ...prev, brand: "" }));
                      }
                    }}
                    placeholder="e.g. ELARQUE Haute Couture"
                    disabled={isSubmitting}
                  />
                  {formErrors.brand && (
                    <span className="admin-field-error">{formErrors.brand}</span>
                  )}
                </div>
              </div>

              {/* CATEGORY, STOCK QUANTITY, STATUS */}
              <div className="admin-form-grid-3">
                {/* CATEGORY */}
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-category-select">
                    CATEGORY <span className="req">*</span>
                  </label>
                  {loadingCategories ? (
                    <input
                      type="text"
                      className="admin-form-input admin-input-readonly"
                      value="Loading categories..."
                      readOnly
                      disabled
                    />
                  ) : categoryError ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="admin-form-input has-error"
                        value="Category error"
                        readOnly
                        disabled
                      />
                      <button
                        type="button"
                        onClick={() => setRetryCategories((c) => c + 1)}
                        className="admin-btn-cancel"
                        style={{ padding: "8px 12px" }}
                        title="Retry loading categories"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  ) : (
                    <select
                      id="product-category-select"
                      className={`admin-form-select ${
                        formErrors.category ? "has-error" : ""
                      }`}
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        if (formErrors.category) {
                          setFormErrors((prev) => ({ ...prev, category: "" }));
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id || cat._id} value={cat.id || cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.category && (
                    <span className="admin-field-error">{formErrors.category}</span>
                  )}
                </div>

                {/* STOCK QUANTITY (READ-ONLY DERIVED SUMMARY) */}
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-stock-summary">
                    STOCK QUANTITY
                  </label>
                  <input
                    id="product-stock-summary"
                    type="text"
                    className="admin-form-input admin-input-readonly"
                    value={`${totalStockQuantity} units`}
                    readOnly
                    disabled
                  />
                  <span className="admin-input-helper">
                    Calculated from allocated garment variant stock.
                  </span>
                </div>

                {/* STATUS */}
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-status-select">
                    STATUS
                  </label>
                  <select
                    id="product-status-select"
                    className="admin-form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* PRICE & SALE PRICE */}
              <div className="admin-form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-price-input">
                    PRICE (₹) <span className="req">*</span>
                  </label>
                  <input
                    id="product-price-input"
                    type="number"
                    min="0"
                    step="any"
                    className={`admin-form-input ${
                      formErrors.price ? "has-error" : ""
                    }`}
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (formErrors.price) {
                        setFormErrors((prev) => ({ ...prev, price: "" }));
                      }
                    }}
                    placeholder="e.g. 24999"
                    disabled={isSubmitting}
                  />
                  {formErrors.price && (
                    <span className="admin-field-error">{formErrors.price}</span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-saleprice-input">
                    SALE PRICE (₹)
                  </label>
                  <input
                    id="product-saleprice-input"
                    type="number"
                    min="0"
                    step="any"
                    className={`admin-form-input ${
                      formErrors.salePrice ? "has-error" : ""
                    }`}
                    value={salePrice}
                    onChange={(e) => {
                      setSalePrice(e.target.value);
                      if (formErrors.salePrice) {
                        setFormErrors((prev) => ({ ...prev, salePrice: "" }));
                      }
                    }}
                    placeholder="Optional, must be ≤ regular price"
                    disabled={isSubmitting}
                  />
                  {formErrors.salePrice && (
                    <span className="admin-field-error">{formErrors.salePrice}</span>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="product-description-input">
                  DESCRIPTION <span className="req">*</span>
                </label>
                <textarea
                  id="product-description-input"
                  className={`admin-form-textarea ${
                    formErrors.description ? "has-error" : ""
                  }`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formErrors.description) {
                      setFormErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  placeholder="Artisanal silhouette cut in heavy Italian wool with satin peak lapels..."
                  rows={3}
                  disabled={isSubmitting}
                />
                {formErrors.description && (
                  <span className="admin-field-error">{formErrors.description}</span>
                )}
              </div>

              {/* FEATURED & BEST SELLER TOGGLES */}
              <div className="admin-toggles-row">
                <label className="admin-toggle-label">
                  <input
                    type="checkbox"
                    className="admin-toggle-checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="admin-toggle-text">Featured Silhouette</span>
                </label>

                <label className="admin-toggle-label">
                  <input
                    type="checkbox"
                    className="admin-toggle-checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="admin-toggle-text">Best Seller Reserve</span>
                </label>
              </div>
            </section>

            {/* 3. GARMENT VARIANTS */}
            <section className="admin-form-section">
              <div className="admin-variants-panel">
                <div className="admin-variants-header">
                  <div>
                    <h2 className="admin-section-heading">GARMENT VARIANTS</h2>
                    <p className="admin-section-subheading" style={{ margin: 0 }}>
                      Tailor specific color shades, atelier sizing, and allocated stock.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn-add-variant"
                    onClick={handleAddVariant}
                    disabled={isSubmitting}
                  >
                    <Plus size={14} />
                    <span>+ ADD VARIANT</span>
                  </button>
                </div>

                {formErrors.variants && (
                  <div
                    className="admin-form-alert admin-alert-error"
                    style={{ marginBottom: "16px" }}
                  >
                    <AlertCircle size={15} />
                    <span>{formErrors.variants}</span>
                  </div>
                )}

                <div className="admin-variant-rows-list">
                  {variants.map((v, index) => (
                    <div key={v.id} className="admin-variant-row-card">
                      {/* COLOR */}
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          COLOR <span className="req">*</span>
                        </label>
                        <div className="admin-color-picker-wrap">
                          <input
                            type="color"
                            className="admin-color-swatch-input"
                            value={v.colorHex || "#7a1526"}
                            onChange={(e) =>
                              handleVariantFieldChange(index, "colorHex", e.target.value)
                            }
                            disabled={isSubmitting}
                            title="Choose color shade"
                          />
                          <input
                            type="text"
                            className="admin-color-text-input"
                            value={v.color}
                            onChange={(e) =>
                              handleVariantFieldChange(index, "color", e.target.value)
                            }
                            placeholder="e.g. Burgundy"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* SIZE (PILL SELECTOR) */}
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          SIZE <span className="req">*</span>
                        </label>
                        <div className="admin-size-selector">
                          {SIZE_OPTIONS.map((sizeOption) => (
                            <button
                              key={sizeOption}
                              type="button"
                              className={`admin-size-pill-btn ${
                                v.size === sizeOption ? "size-selected" : ""
                              }`}
                              onClick={() =>
                                handleVariantFieldChange(index, "size", sizeOption)
                              }
                              disabled={isSubmitting}
                            >
                              {sizeOption}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* QTY (STOCK) */}
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          QTY <span className="req">*</span>
                        </label>
                        <div className="admin-stock-wrap">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="admin-variant-stock-input"
                            value={v.stock}
                            onChange={(e) =>
                              handleVariantFieldChange(index, "stock", e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                          <span style={{ fontSize: "12px", color: "#8e7a69" }}>
                            units
                          </span>
                        </div>
                      </div>

                      {/* DELETE ACTION */}
                      <button
                        type="button"
                        className="admin-btn-delete-variant"
                        onClick={() => handleRemoveVariant(index)}
                        disabled={variants.length <= 1 || isSubmitting}
                        title={
                          variants.length <= 1
                            ? "At least one variant required"
                            : "Delete variant"
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. CANCEL & CREATE PRODUCT FOOTER */}
            <footer className="admin-add-product-footer">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => navigate("/admin/products")}
                disabled={isSubmitting}
              >
                CANCEL
              </button>

              <button
                type="submit"
                className="admin-btn-create-product"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="admin-btn-spinner" />
                    <span>CREATING PRODUCT...</span>
                  </>
                ) : (
                  <span>CREATE PRODUCT</span>
                )}
              </button>
            </footer>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddProduct;
