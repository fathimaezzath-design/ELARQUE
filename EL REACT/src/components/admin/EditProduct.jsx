import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Image as ImageIcon,
  Star,
  Save,
  CheckCircle2,
} from "lucide-react";
import ProductImageUploader from "./ProductImageUploader";
import "./EditProduct.css";

const API_BASE_URL = "http://localhost:5000/api/admin/products";
const CATEGORIES_API_URL = "http://localhost:5000/api/admin/categories";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];

// Luxury Atelier Color Mapping
const getColorHex = (color) => {
  if (!color) return "#dfc28d";
  const c = color.toLowerCase().trim();
  const colorMap = {
    black: "#111827",
    onyx: "#111827",
    "obsidian black": "#141414",
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

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading & Fetch Error States
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

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

  // Images State: Existing Preserved Images vs New Replacement Visuals
  const [existingImages, setExistingImages] = useState([]);
  const [newUploadedImages, setNewUploadedImages] = useState([]);
  const [showUploader, setShowUploader] = useState(false);

  // Categories Loading State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Garment Variants State
  const [variants, setVariants] = useState([]);

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");



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
      try {
        const response = await axios.get(
          `${CATEGORIES_API_URL}?page=1&limit=100`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (!isMounted) return;

        if (response.data?.success && Array.isArray(response.data?.categories)) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
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
  }, [navigate]);

  // 2. Fetch Product By MongoDB ID
  useEffect(() => {
    let isMounted = true;
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    const fetchProduct = async () => {
      if (!id) {
        setFetchError("Product identifier is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError("");

      try {
        const response = await axios.get(`${API_BASE_URL}/${id}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!isMounted) return;

        if (response.data?.success && response.data?.product) {
          const product = response.data.product;

          setName(product.name || "");
          setBrand(product.brand || "ELARQUE Haute Couture");
          setDescription(product.description || "");
          setCategoryId(
            product.categoryId || product.category?.id || ""
          );
          setPrice(
            product.price !== undefined && product.price !== null
              ? String(product.price)
              : ""
          );
          setSalePrice(
            product.salePrice !== undefined && product.salePrice !== null
              ? String(product.salePrice)
              : ""
          );
          setStatus(product.status === "inactive" ? "inactive" : "active");
          setIsFeatured(Boolean(product.isFeatured));
          setIsBestSeller(Boolean(product.isBestSeller));

          // Extract existing images from first variant or variants list
          let extractedImages = [];
          if (Array.isArray(product.variants) && product.variants.length > 0) {
            for (const v of product.variants) {
              if (Array.isArray(v.images) && v.images.length > 0) {
                extractedImages = v.images;
                break;
              }
            }
          }
          setExistingImages(extractedImages);

          // Populate variants preserving existing embedded variant IDs
          if (Array.isArray(product.variants) && product.variants.length > 0) {
            setVariants(
              product.variants.map((v, idx) => ({
                _id: v._id || v.id,
                id: v.id || v._id || `v-loaded-${idx}`,
                color: v.color || "Burgundy",
                colorHex: getColorHex(v.color),
                size: v.size || "M",
                stock: v.stock !== undefined ? v.stock : 10,
                images: Array.isArray(v.images) ? v.images : [],
              }))
            );
          } else {
            setVariants([
              {
                id: "v-initial-1",
                color: "Burgundy",
                colorHex: "#5A1E2A",
                size: "M",
                stock: 10,
                images: [],
              },
            ]);
          }
        } else {
          setFetchError("Unable to retrieve product details from atelier vault.");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
        if (err.response?.status === 404) {
          setFetchError(
            "This luxury product could not be found or has been removed from the catalog."
          );
          return;
        }
        setFetchError(
          err.response?.data?.message ||
            "Failed to load product details. Please check connection and retry."
        );
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
  }, [id, navigate, retryTrigger]);

  // Handle Image Upload Completion from ProductImageUploader
  const handleImagesUploaded = (imageUrls) => {
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      setNewUploadedImages(imageUrls);
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
      images: [],
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
      prev.map((v, idx) => {
        if (idx === index) {
          const updated = { ...v, [field]: value };
          if (field === "color") {
            updated.colorHex = getColorHex(value);
          }
          return updated;
        }
        return v;
      })
    );
    setFormErrors((prev) => ({ ...prev, variants: "" }));
  };

  // Derived Total Variant Stock for summary
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

    // Determine effective images: new upload takes precedence if provided, else existing
    const effectiveImages =
      newUploadedImages.length >= 3 ? newUploadedImages : existingImages;

    if (!effectiveImages || effectiveImages.length < 3) {
      errors.images =
        "At least 3 product images are required. Please upload replacement visuals using the atelier uploader below.";
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

        if (!trimmedSize || !SIZE_OPTIONS.includes(trimmedSize)) {
          errors.variants = `Variant #${i + 1}: Please select a valid size (${SIZE_OPTIONS.join(
            ", "
          )}).`;
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
      // Determine effective image set:
      // If user uploaded new images, use them. Otherwise preserve existing images.
      const effectiveImages =
        newUploadedImages.length >= 3 ? newUploadedImages : existingImages;

      // Construct update payload conforming strictly to backend PATCH endpoint
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        brand: brand.trim(),
        price: Number(price),
        salePrice:
          salePrice !== "" && salePrice !== undefined && salePrice !== null
            ? Number(salePrice)
            : null,
        status: status === "inactive" ? "inactive" : "active",
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        // Preserve embedded variant _id when updating existing variants
        variants: variants.map((v, idx) => ({
          ...(v._id ? { _id: v._id } : {}),
          size: v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock),
          images:
            idx === 0
              ? effectiveImages
              : Array.isArray(v.images)
              ? v.images
              : [],
        })),
      };

      const response = await axios.patch(`${API_BASE_URL}/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 && response.data?.success) {
        navigate("/admin/products", {
          state: {
            successMessage: `Product "${name.trim()}" updated successfully in atelier collection.`,
          },
        });
      } else {
        setSubmitError("Failed to update product. Please verify and retry.");
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
          "An error occurred while updating the product. Please try again.";
        setSubmitError(errorMsg);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-edit-product-page">
      <div className="admin-edit-product-main">
        {/* Loading State */}
        {loading ? (
          <div className="admin-edit-product-card admin-state-card">
            <div className="admin-edit-spinner-lg" />
            <h3 className="admin-state-title">Retrieving Product Details</h3>
            <p className="admin-state-desc">
              Fetching garment silhouette, pricing tiers, and variant inventory from
              atelier vault...
            </p>
          </div>
        ) : fetchError ? (
          /* Error State */
          <div className="admin-edit-product-card admin-state-card">
            <AlertCircle size={40} color="#fca5a5" />
            <h3 className="admin-state-title error-text">Product Retrieval Failed</h3>
            <p className="admin-state-desc">{fetchError}</p>
            <div className="admin-state-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setRetryTrigger((prev) => prev + 1)}
              >
                <RefreshCw size={14} />
                <span>Retry Loading</span>
              </button>
              <button
                type="button"
                className="admin-btn-primary-link"
                onClick={() => navigate("/admin/products")}
              >
                <ArrowLeft size={14} />
                <span>Back to Products</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Edit Form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="admin-edit-product-card">
              {/* Header */}
              <header className="admin-edit-header">
                <div className="admin-header-nav-back">
                  <button
                    type="button"
                    className="admin-btn-back-crumb"
                    onClick={() => navigate("/admin/products")}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Products</span>
                  </button>
                </div>

                <div className="admin-header-kicker">
                  <Sparkles size={13} />
                  <span>Haute Couture Atelier Edition</span>
                </div>
                <h1 className="admin-edit-title">EDIT LUXURY PRODUCT</h1>
                <p className="admin-edit-subtitle">
                  Modify silhouette specifications, pricing tiers, lookbook visuals,
                  and variant inventory.
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
                <div className="admin-section-header-flex">
                  <div>
                    <h2 className="admin-section-heading">
                      1. PRODUCT MEDIA &amp; LOOKBOOK VISUALS
                    </h2>
                    <p className="admin-section-subheading">
                      Review current storefront photography or upload replacement
                      visuals.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`admin-btn-toggle-upload ${
                      showUploader ? "active" : ""
                    }`}
                    onClick={() => setShowUploader((prev) => !prev)}
                  >
                    <ImageIcon size={14} />
                    <span>
                      {showUploader
                        ? "Hide Image Uploader"
                        : "+ Replace / Upload New Visuals"}
                    </span>
                  </button>
                </div>

                {/* Existing Images Display */}
                <div className="admin-current-images-box">
                  <div className="admin-current-images-header">
                    <span className="current-images-title">
                      {newUploadedImages.length >= 3
                        ? "Original Preserved Visuals (Will be replaced upon save)"
                        : "Active Product Visuals (Preserved)"}
                    </span>
                    <span className="current-images-count">
                      {existingImages.length} image
                      {existingImages.length === 1 ? "" : "s"} currently active
                    </span>
                  </div>

                  {existingImages.length > 0 ? (
                    <div className="admin-existing-grid">
                      {existingImages.map((imgUrl, idx) => {
                        const fullUrl = imgUrl.startsWith("http")
                          ? imgUrl
                          : `http://localhost:5000${imgUrl}`;
                        return (
                          <div
                            key={idx}
                            className={`admin-existing-thumb-card ${
                              idx === 0 ? "is-cover-thumb" : ""
                            }`}
                          >
                            {idx === 0 && (
                              <div className="existing-cover-tag">
                                <Star size={10} fill="#dfc28d" color="#dfc28d" />
                                <span>LOOKBOOK COVER</span>
                              </div>
                            )}
                            <img
                              src={fullUrl}
                              alt={`Visual ${idx + 1}`}
                              className="existing-thumb-img"
                            />
                            <div className="existing-thumb-idx">#{idx + 1}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="admin-existing-empty">
                      <ImageIcon size={28} color="#8e7a69" />
                      <span>No active visuals found. Please upload new images.</span>
                    </div>
                  )}

                  {newUploadedImages.length >= 3 && (
                    <div className="admin-new-images-notice">
                      <CheckCircle2 size={16} color="#34d399" />
                      <span>
                        {newUploadedImages.length} new visuals uploaded. These will
                        replace the existing visuals when you save changes.
                      </span>
                      <button
                        type="button"
                        className="admin-btn-revert-images"
                        onClick={() => setNewUploadedImages([])}
                      >
                        Keep Original Images
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Expandable ProductImageUploader */}
                {showUploader && (
                  <div className="admin-uploader-wrapper">
                    <ProductImageUploader
                      onUploadComplete={handleImagesUploaded}
                      minImages={3}
                      maxImages={10}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {formErrors.images && (
                  <div className="admin-field-error" style={{ marginTop: "10px" }}>
                    {formErrors.images}
                  </div>
                )}
              </section>

              {/* 2. PRODUCT NAME & BRAND */}
              <section className="admin-form-section">
                <h2 className="admin-section-heading">2. SILHOUETTE IDENTITY</h2>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-name">
                      Product Name <span className="req">*</span>
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      className={`admin-form-input ${
                        formErrors.name ? "has-error" : ""
                      }`}
                      placeholder="e.g., Midnight Velvet Tuxedo Blazer"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFormErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.name && (
                      <span className="admin-field-error">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-brand">
                      Brand / Atelier Maison <span className="req">*</span>
                    </label>
                    <input
                      id="product-brand"
                      type="text"
                      className={`admin-form-input ${
                        formErrors.brand ? "has-error" : ""
                      }`}
                      placeholder="e.g., ELARQUE Haute Couture"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        setFormErrors((prev) => ({ ...prev, brand: "" }));
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.brand && (
                      <span className="admin-field-error">{formErrors.brand}</span>
                    )}
                  </div>
                </div>

                {/* Category & Status Row */}
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-category">
                      Category Classification <span className="req">*</span>
                    </label>
                    <select
                      id="product-category"
                      className={`admin-form-select ${
                        formErrors.category ? "has-error" : ""
                      }`}
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setFormErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      disabled={isSubmitting || loadingCategories}
                    >
                      <option value="">Select Atelier Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat._id} value={cat.id || cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <span className="admin-field-error">
                        {formErrors.category}
                      </span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-status">
                      Atelier Catalog Status
                    </label>
                    <select
                      id="product-status"
                      className="admin-form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="active">Active (Visible in Storefront)</option>
                      <option value="inactive">Inactive (Hidden Draft)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="product-desc">
                    Product Narrative &amp; Craftsmanship <span className="req">*</span>
                  </label>
                  <textarea
                    id="product-desc"
                    className={`admin-form-textarea ${
                      formErrors.description ? "has-error" : ""
                    }`}
                    rows={4}
                    placeholder="Describe tailoring details, fabric composition, lining, and craftsmanship..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setFormErrors((prev) => ({ ...prev, description: "" }));
                    }}
                    disabled={isSubmitting}
                  />
                  {formErrors.description && (
                    <span className="admin-field-error">
                      {formErrors.description}
                    </span>
                  )}
                </div>
              </section>

              {/* 3. PRICING & PROMOTIONS */}
              <section className="admin-form-section">
                <h2 className="admin-section-heading">3. PRICING &amp; PRIVILEGES</h2>
                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-price">
                      Regular Retail Price (₹) <span className="req">*</span>
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      step="any"
                      min="0"
                      className={`admin-form-input ${
                        formErrors.price ? "has-error" : ""
                      }`}
                      placeholder="e.g., 24999"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setFormErrors((prev) => ({ ...prev, price: "" }));
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.price && (
                      <span className="admin-field-error">{formErrors.price}</span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label" htmlFor="product-sale-price">
                      Promotional Sale Price (₹) (Optional)
                    </label>
                    <input
                      id="product-sale-price"
                      type="number"
                      step="any"
                      min="0"
                      className={`admin-form-input ${
                        formErrors.salePrice ? "has-error" : ""
                      }`}
                      placeholder="Leave empty if regular price applies"
                      value={salePrice}
                      onChange={(e) => {
                        setSalePrice(e.target.value);
                        setFormErrors((prev) => ({ ...prev, salePrice: "" }));
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.salePrice && (
                      <span className="admin-field-error">
                        {formErrors.salePrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Flags / Switches */}
                <div className="admin-toggles-row">
                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      className="admin-toggle-checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span className="admin-toggle-text">
                      Mark as Featured Collection Style
                    </span>
                  </label>

                  <label className="admin-toggle-label">
                    <input
                      type="checkbox"
                      className="admin-toggle-checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span className="admin-toggle-text">
                      Mark as Haute Couture Best Seller
                    </span>
                  </label>
                </div>
              </section>

              {/* 4. GARMENT VARIANTS (SIZES, COLORS & STOCK) */}
              <section className="admin-form-section">
                <div className="admin-variants-panel">
                  <div className="admin-variants-header">
                    <div>
                      <h2 className="admin-section-heading">
                        4. GARMENT VARIANTS &amp; INVENTORY ALLOCATION
                      </h2>
                      <p className="admin-section-subheading">
                        Manage size &amp; colorway matrix. Total allocated reserve:{" "}
                        <strong style={{ color: "#dfc28d" }}>
                          {totalStockQuantity} units
                        </strong>
                        . Existing variant IDs are preserved upon saving.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-add-variant"
                      onClick={handleAddVariant}
                      disabled={isSubmitting}
                    >
                      <Plus size={14} />
                      <span>+ Add Variant</span>
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
                    {variants.map((v, idx) => (
                      <div key={v.id || idx} className="admin-variant-row-card">
                        {/* 1. Color with Hex Picker */}
                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Colorway #{idx + 1}
                          </label>
                          <div className="admin-color-picker-wrap">
                            <input
                              type="color"
                              className="admin-color-swatch-input"
                              value={v.colorHex || "#141414"}
                              onChange={(e) =>
                                handleVariantFieldChange(
                                  idx,
                                  "colorHex",
                                  e.target.value
                                )
                              }
                              disabled={isSubmitting}
                            />
                            <input
                              type="text"
                              className="admin-color-text-input"
                              placeholder="e.g., Obsidian Black"
                              value={v.color}
                              onChange={(e) =>
                                handleVariantFieldChange(
                                  idx,
                                  "color",
                                  e.target.value
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* 2. Size Selector */}
                        <div className="admin-form-group">
                          <label className="admin-form-label">Size</label>
                          <div className="admin-size-selector">
                            {SIZE_OPTIONS.map((sizeOpt) => (
                              <button
                                key={sizeOpt}
                                type="button"
                                className={`admin-size-pill-btn ${
                                  v.size === sizeOpt ? "size-selected" : ""
                                }`}
                                onClick={() =>
                                  handleVariantFieldChange(idx, "size", sizeOpt)
                                }
                                disabled={isSubmitting}
                              >
                                {sizeOpt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Stock */}
                        <div className="admin-form-group">
                          <label className="admin-form-label">Stock Units</label>
                          <div className="admin-stock-wrap">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="admin-variant-stock-input"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantFieldChange(
                                  idx,
                                  "stock",
                                  e.target.value
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* 4. Delete Variant Button */}
                        <div style={{ paddingTop: "20px" }}>
                          <button
                            type="button"
                            className="admin-btn-delete-variant"
                            onClick={() => handleRemoveVariant(idx)}
                            disabled={variants.length <= 1 || isSubmitting}
                            title={
                              variants.length <= 1
                                ? "At least one variant is required"
                                : "Remove this variant"
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FOOTER ACTIONS */}
              <footer className="admin-edit-product-footer">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => navigate("/admin/products")}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-btn-save-product"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="admin-btn-spinner" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </footer>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProduct;
