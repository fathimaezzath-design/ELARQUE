import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Plus,
  Check,
} from "lucide-react";
import ProductImageUploader from "./ProductImageUploader";
import "./AddVariant.css";

const PRODUCTS_API_URL = "http://localhost:5000/api/admin/products";
const SIZES = ["XS", "S", "M", "L", "XL"];

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

const AddVariant = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialProductId = location.state?.productId || queryParams.get("productId") || "";
  const initialProductName = location.state?.productName || queryParams.get("productName") || "";

  // Products List State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  // Form Fields State
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("M");
  const [stock, setStock] = useState("10");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);

  // Submission & Validation State
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Parent Products for the dropdown selector
  useEffect(() => {
    let isMounted = true;
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const response = await axios.get(`${PRODUCTS_API_URL}?limit=100`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!isMounted) return;

        if (response.data?.success) {
          const prods = response.data.products || [];
          setProducts(prods);
          if (prods.length > 0) {
            setSelectedProductId((prev) => prev || prods[0].id);
          }
        } else {
          setProductsError("Unable to retrieve parent products.");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
        setProductsError("Failed to load products. Please refresh and retry.");
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Selected Product Details
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-populate price from selected product if empty
  useEffect(() => {
    if (selectedProduct && selectedProduct.price && !price) {
      setPrice(String(selectedProduct.price));
    }
  }, [selectedProduct]);

  // Derived stock status
  const numericStock = Number(stock);
  const derivedStatus =
    !isNaN(numericStock) && numericStock > 5
      ? "in_stock"
      : !isNaN(numericStock) && numericStock > 0
      ? "low_stock"
      : "out_of_stock";

  // Handle Image Upload Completion from ProductImageUploader
  const handleImagesUploaded = (imageUrls) => {
    if (Array.isArray(imageUrls)) {
      setUploadedImages(imageUrls);
    }
  };




  // Form Validation
  const validate = () => {
    const errors = {};

    if (!selectedProductId) {
      errors.product = "Please select a parent product.";
    }

    if (!color.trim()) {
      errors.color = "Color name is required.";
    }

    if (!size || !SIZES.includes(size.trim())) {
      errors.size = "Please select a valid size (XS, S, M, L, XL).";
    }

    if (
      stock === "" ||
      isNaN(numericStock) ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      errors.stock = "Stock must be a whole number greater than or equal to 0.";
    }

    const numericPrice = Number(price);
    if (
      price === "" ||
      price === null ||
      price === undefined ||
      isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      errors.price = "Price is compulsory and must be a valid number greater than or equal to 0.";
    }

    if (salePrice !== "" && salePrice !== null && salePrice !== undefined) {
      const numericSalePrice = Number(salePrice);
      if (isNaN(numericSalePrice) || numericSalePrice < 0) {
        errors.salePrice = "Sale price must be a valid number greater than or equal to 0.";
      } else if (!isNaN(numericPrice) && numericSalePrice >= numericPrice) {
        errors.salePrice = "Sale price must be strictly lower than regular price.";
      }
    }

    // Check duplicate color + size against selected product's existing variants
    if (selectedProduct && Array.isArray(selectedProduct.variants)) {
      const trimmedColor = color.trim().toLowerCase();
      const trimmedSize = size.trim();
      const isDuplicate = selectedProduct.variants.some(
        (v) =>
          v.color &&
          v.color.trim().toLowerCase() === trimmedColor &&
          v.size &&
          v.size.trim() === trimmedSize
      );

      if (isDuplicate) {
        errors.color = `A variant with color '${color.trim()}' and size '${trimmedSize}' already exists for this product.`;
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
      const payload = {
        size: size.trim(),
        color: color.trim(),
        stock: Number(stock),
        price: Number(price),
        images: uploadedImages,
      };

      if (salePrice !== "" && salePrice !== null && salePrice !== undefined) {
        payload.salePrice = Number(salePrice);
      }

      const response = await axios.post(
        `http://localhost:5000/api/admin/products/${selectedProductId}/variants`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.status === 201 && response.data?.success) {
        const prodName = selectedProduct?.name || initialProductName || "Product";
        const backTarget = selectedProductId
          ? `/admin/variants?productId=${selectedProductId}&productName=${encodeURIComponent(prodName)}`
          : "/admin/variants";
        localStorage.setItem("elarque_last_update", Date.now().toString());
        window.dispatchEvent(new CustomEvent("elarque:data-updated"));
        navigate(backTarget, {
          state: {
            productId: selectedProductId,
            productName: prodName,
            successMessage: `Variant "${color.trim()} (${size.trim()})" added successfully to ${prodName}.`,
          },
        });
      } else {
        setSubmitError("Failed to add variant. Please verify and retry.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 409) {
        setSubmitError(
          err.response?.data?.message ||
            "A variant with this color and size combination already exists for this product."
        );
      } else {
        const msg =
          err.response?.data?.message ||
          "An error occurred while creating the variant. Please retry.";
        setSubmitError(msg);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-add-variant-page">
      {/* MAIN CONTENT AREA */}
      <div className="admin-add-variant-main">
        <form onSubmit={handleSubmit} noValidate>
          <div className="admin-add-variant-card">
            {/* Back Navigation Bar */}
            <div className="admin-back-nav">
              <Link
                to={
                  selectedProductId || initialProductId
                    ? `/admin/variants?productId=${selectedProductId || initialProductId}&productName=${encodeURIComponent(initialProductName || selectedProduct?.name || "")}`
                    : "/admin/variants"
                }
                className="admin-btn-back"
              >
                <ArrowLeft size={14} />
                <span>Back to Variants</span>
              </Link>
            </div>

            {/* Header */}
            <header className="admin-add-header">
              <div className="admin-header-kicker">
                <Sparkles size={13} />
                <span>Haute Couture Atelier Creation</span>
              </div>
              <h1 className="admin-add-title">ADD NEW VARIANT</h1>
              <p className="admin-add-subtitle">
                Register a bespoke colorway, size matrix, and stock allocation
                for an existing silhouette.
              </p>
            </header>

            {/* Global Error Banner */}
            {submitError && (
              <div className="admin-form-alert admin-alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* 1. PARENT PRODUCT SELECTION */}
            <section className="admin-form-section">
              <h2 className="admin-section-heading">1. PARENT SILHOUETTE</h2>
              <p className="admin-section-subheading">
                Select the luxury garment that will host this variant.
              </p>

              {loadingProducts ? (
                <div className="admin-loading-products-inline">
                  <span>Loading atelier silhouettes...</span>
                </div>
              ) : productsError ? (
                <div className="admin-field-error">{productsError}</div>
              ) : products.length === 0 ? (
                <div className="admin-field-warning">
                  No active products found in the catalog. Please create a
                  product first.
                </div>
              ) : (
                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    htmlFor="parent-product-select"
                  >
                    SELECT PRODUCT <span className="req">*</span>
                  </label>
                  <select
                    id="parent-product-select"
                    className={`admin-form-select ${
                      formErrors.product ? "has-error" : ""
                    }`}
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      if (formErrors.product) {
                        setFormErrors((prev) => ({ ...prev, product: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.brand} (
                        {typeof p.category === "object"
                          ? p.category?.name
                          : p.category || "Uncategorized"}
                        )
                      </option>
                    ))}
                  </select>
                  {formErrors.product && (
                    <span className="admin-field-error">
                      {formErrors.product}
                    </span>
                  )}
                </div>
              )}

              {/* Selected Product Preview Card */}
              {selectedProduct && (
                <div className="admin-product-preview-card">
                  <div className="preview-badge-status">
                    <span
                      className={`status-dot ${
                        selectedProduct.status === "active"
                          ? "active"
                          : "inactive"
                      }`}
                    />
                    <span>
                      {selectedProduct.status === "active"
                        ? "Active Silhouette"
                        : "Inactive Silhouette"}
                    </span>
                  </div>

                  <div className="preview-details-grid">
                    <div className="preview-item">
                      <span className="preview-label">Product Name</span>
                      <span className="preview-value title-val">
                        {selectedProduct.name}
                      </span>
                    </div>

                    <div className="preview-item">
                      <span className="preview-label">Brand / Maison</span>
                      <span className="preview-value">
                        {selectedProduct.brand}
                      </span>
                    </div>

                    <div className="preview-item">
                      <span className="preview-label">Category</span>
                      <span className="preview-value">
                        {typeof selectedProduct.category === "object"
                          ? selectedProduct.category?.name
                          : selectedProduct.category || "Uncategorized"}
                      </span>
                    </div>

                    <div className="preview-item">
                      <span className="preview-label">Base Retail Price</span>
                      <span className="preview-value gold-val">
                        {formatPrice(selectedProduct.price)}
                        {selectedProduct.salePrice ? (
                          <span className="sale-val">
                            {" "}
                            (Sale: {formatPrice(selectedProduct.salePrice)})
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  {/* Existing variants summary */}
                  {Array.isArray(selectedProduct.variants) &&
                    selectedProduct.variants.length > 0 && (
                      <div className="preview-existing-variants">
                        <span className="existing-variants-label">
                          Existing Allocated Variants (
                          {selectedProduct.variants.length}):
                        </span>
                        <div className="existing-variants-chips">
                          {selectedProduct.variants.map((ev, idx) => (
                            <span key={idx} className="existing-variant-chip">
                              <span
                                className="chip-dot"
                                style={{
                                  backgroundColor: getColorHex(ev.color),
                                }}
                              />
                              <span>
                                {ev.color} ({ev.size}) — {ev.stock} units
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </section>

            {/* 2. VARIANT SPECIFICATIONS */}
            <section className="admin-form-section">
              <h2 className="admin-section-heading">
                2. VARIANT SPECIFICATIONS &amp; SIZING
              </h2>
              <p className="admin-section-subheading">
                Configure colorway shade, standard atelier sizing, and stock
                allocation.
              </p>

              <div className="admin-form-grid-2">
                {/* COLOR */}
                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    htmlFor="variant-color-input"
                  >
                    COLORWAY NAME <span className="req">*</span>
                  </label>
                  <div className="admin-color-input-wrap">
                    <span
                      className="admin-color-preview-swatch"
                      style={{
                        backgroundColor: getColorHex(color),
                      }}
                      title="Estimated color swatch"
                    />
                    <input
                      id="variant-color-input"
                      type="text"
                      className={`admin-form-input with-swatch ${
                        formErrors.color ? "has-error" : ""
                      }`}
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        if (formErrors.color) {
                          setFormErrors((prev) => ({ ...prev, color: "" }));
                        }
                      }}
                      placeholder="e.g. Burgundy, Obsidian Black, Navy"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.color && (
                    <span className="admin-field-error">
                      {formErrors.color}
                    </span>
                  )}
                  <span className="admin-input-helper">
                    Matches luxury swatch:{" "}
                    <strong>{color || "Select shade"}</strong>
                  </span>
                </div>

                {/* STOCK QUANTITY */}
                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    htmlFor="variant-stock-input"
                  >
                    STOCK QUANTITY (UNITS) <span className="req">*</span>
                  </label>
                  <div className="admin-stock-input-wrap">
                    <input
                      id="variant-stock-input"
                      type="number"
                      min="0"
                      step="1"
                      className={`admin-form-input ${
                        formErrors.stock ? "has-error" : ""
                      }`}
                      value={stock}
                      onChange={(e) => {
                        setStock(e.target.value);
                        if (formErrors.stock) {
                          setFormErrors((prev) => ({ ...prev, stock: "" }));
                        }
                      }}
                      placeholder="e.g. 24"
                      disabled={isSubmitting}
                    />
                    <span className="admin-stock-unit-label">units</span>
                  </div>
                  {formErrors.stock && (
                    <span className="admin-field-error">
                      {formErrors.stock}
                    </span>
                  )}
                  <div className="admin-derived-status-badge">
                    <span>Derived Inventory Status: </span>
                    {derivedStatus === "in_stock" && (
                      <strong className="status-pill in-stock">
                        In Stock (&gt; 5)
                      </strong>
                    )}
                    {derivedStatus === "low_stock" && (
                      <strong className="status-pill low-stock">
                        Low Stock (1–5)
                      </strong>
                    )}
                    {derivedStatus === "out_of_stock" && (
                      <strong className="status-pill out-of-stock">
                        Out of Stock (0)
                      </strong>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 2: VARIANT PRICE (COMPULSORY) & SALE PRICE (OPTIONAL) */}
              <div className="admin-form-grid-2" style={{ marginTop: "16px" }}>
                {/* VARIANT PRICE */}
                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    htmlFor="variant-price-input"
                  >
                    VARIANT PRICE (₹) <span className="req">*</span>
                  </label>
                  <div className="admin-stock-input-wrap">
                    <input
                      id="variant-price-input"
                      type="number"
                      min="0"
                      step="1"
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
                      placeholder="e.g. 18500"
                      disabled={isSubmitting}
                    />
                    <span className="admin-stock-unit-label">INR</span>
                  </div>
                  {formErrors.price && (
                    <span className="admin-field-error">
                      {formErrors.price}
                    </span>
                  )}
                  <span className="admin-input-helper">
                    Base Product Retail Price:{" "}
                    <strong>{formatPrice(selectedProduct?.price)}</strong>
                  </span>
                </div>

                {/* SALE PRICE */}
                <div className="admin-form-group">
                  <label
                    className="admin-form-label"
                    htmlFor="variant-saleprice-input"
                  >
                    SALE / PROMO PRICE (₹) <span className="optional">(Optional)</span>
                  </label>
                  <div className="admin-stock-input-wrap">
                    <input
                      id="variant-saleprice-input"
                      type="number"
                      min="0"
                      step="1"
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
                      placeholder="e.g. 15500 (Leave blank if none)"
                      disabled={isSubmitting}
                    />
                    <span className="admin-stock-unit-label">INR</span>
                  </div>
                  {formErrors.salePrice && (
                    <span className="admin-field-error">
                      {formErrors.salePrice}
                    </span>
                  )}
                  <span className="admin-input-helper">
                    Leave blank to sell at regular variant price.
                  </span>
                </div>
              </div>

              {/* SIZE SELECTOR */}
              <div className="admin-form-group" style={{ marginTop: "16px" }}>
                <label className="admin-form-label">
                  SELECT GARMENT SIZE <span className="req">*</span>
                </label>
                <div className="admin-size-selector-grid">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`admin-size-btn ${
                        size === sz ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSize(sz);
                        if (formErrors.size) {
                          setFormErrors((prev) => ({ ...prev, size: "" }));
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <span className="size-label">{sz}</span>
                      {size === sz && <Check size={13} className="check-icon" />}
                    </button>
                  ))}
                </div>
                {formErrors.size && (
                  <span className="admin-field-error">{formErrors.size}</span>
                )}
              </div>
            </section>

            {/* 3. VARIANT VISUALS */}
            <section className="admin-form-section">
              <h2 className="admin-section-heading">
                3. VARIANT VISUALS (OPTIONAL)
              </h2>
              <p className="admin-section-subheading">
                Upload bespoke 3:4 lookbook visuals specific to this colorway,
                using the atelier cropper.
              </p>

              <ProductImageUploader
                onUploadComplete={handleImagesUploaded}
                minImages={3}
                maxImages={8}
                disabled={isSubmitting}
              />
            </section>

            {/* 4. FOOTER ACTIONS */}
            <footer className="admin-add-variant-footer">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() =>
                  navigate(
                    selectedProductId || initialProductId
                      ? `/admin/variants?productId=${selectedProductId || initialProductId}&productName=${encodeURIComponent(initialProductName || selectedProduct?.name || "")}`
                      : "/admin/variants"
                  )
                }
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-btn-submit"
                disabled={isSubmitting || loadingProducts || products.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="admin-spinner-sm" />
                    <span>Creating Variant...</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Create Variant</span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVariant;
