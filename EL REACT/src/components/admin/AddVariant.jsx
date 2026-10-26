import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  UploadCloud,
  RefreshCw,
  Trash2,
  Pipette,
  Package,
} from "lucide-react";
import "./AddVariant.css";

const PRODUCTS_API_URL = "http://localhost:5000/api/admin/products";
const UPLOAD_API_URL   = "http://localhost:5000/api/admin/products/images";
const SIZES = ["XS", "S", "M", "L", "XL"];

// Color name → hex mapping
const getColorHex = (color) => {
  if (!color) return "#94a3b8";
  const c = color.toLowerCase().trim();
  const map = {
    black: "#111827", onyx: "#111827", white: "#f8fafc", ivory: "#fffff0",
    burgundy: "#590719", crimson: "#991b1b", ruby: "#be123c", wine: "#722f37",
    navy: "#1e3a8a", emerald: "#065f46", green: "#15803d", gold: "#d97706",
    beige: "#d4b996", cream: "#fef3c7", champagne: "#f7e7c4", camel: "#c19a6b",
    charcoal: "#374151", grey: "#6b7280", gray: "#6b7280", silver: "#9ca3af",
    rose: "#e11d48", pink: "#ec4899", lavender: "#a855f7", purple: "#7e22ce",
    olive: "#4d7c0f", brown: "#78350f", cognac: "#9a3412", tan: "#d2b48c",
  };
  return map[c] || "#dfc28d";
};

const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
};

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXT  = [".jpg", ".jpeg", ".png", ".webp"];

const AddVariant = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const fileInputRef    = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const initialProductId   = location.state?.productId   || queryParams.get("productId")   || "";
  const initialProductName = location.state?.productName || queryParams.get("productName") || "";

  // ── Products list ──
  const [products, setProducts]             = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError]   = useState("");

  // ── Form fields ──
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [color, setColor]     = useState("");
  const [size,  setSize]      = useState("M");
  const [stock, setStock]     = useState("10");
  const [price, setPrice]     = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [availability, setAvailability] = useState("in_stock");

  // ── Images ──
  const [images, setImages]         = useState([]); // [{id, previewUrl, file, uploaded:false, url:''}]
  const [isDragOver, setIsDragOver] = useState(false);
  const [imgError, setImgError]     = useState("");
  const [uploading, setUploading]   = useState(false);

  // ── Submission ──
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch products ──
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }

    const run = async () => {
      try {
        setLoadingProducts(true);
        const res = await axios.get(`${PRODUCTS_API_URL}?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;
        if (res.data?.success) {
          const prods = res.data.products || [];
          setProducts(prods);
          setSelectedProductId((prev) => prev || prods[0]?.id || "");
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
        setProductsError("Failed to load products. Please refresh.");
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [navigate]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-fill price from product
  useEffect(() => {
    if (selectedProduct?.price && !price) {
      setPrice(String(selectedProduct.price));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // Derived stock status
  const numericStock = Number(stock);
  const derivedStatus =
    !isNaN(numericStock) && numericStock > 5 ? "in_stock"
    : !isNaN(numericStock) && numericStock > 0 ? "low_stock"
    : "out_of_stock";

  // Availability dot colour
  const availDotColor = availability === "in_stock" ? "#10b981"
    : availability === "low_stock"    ? "#f59e0b"
    : availability === "coming_soon"  ? "#3b82f6"
    : "#ef4444";

  // ────────────────────────────────────────
  // Image Handling (Simplified — no crop modal,
  // uses existing ProductImageUploader API endpoint)
  // ────────────────────────────────────────
  const handleFiles = (fileList) => {
    setImgError("");
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const slots = 8 - images.length;
    if (slots <= 0) { setImgError("Maximum 8 images reached."); return; }

    const toAdd = [];
    for (const file of files) {
      const ext  = ("." + file.name.split(".").pop()).toLowerCase();
      const mime = file.type.toLowerCase();
      if (!ALLOWED_MIME.includes(mime) && !ALLOWED_EXT.includes(ext)) {
        setImgError(`"${file.name}" — unsupported format. Use JPG, PNG, or WEBP.`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        setImgError(`"${file.name}" exceeds 25 MB raw size limit.`);
        continue;
      }
      const isDup = images.some((i) => i.name === file.name && i.size === file.size);
      if (isDup) continue;
      toAdd.push({
        id:         "img-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
        previewUrl: URL.createObjectURL(file),
        file,
        name:       file.name,
        size:       file.size,
        uploaded:   false,
        url:        "",
      });
      if (toAdd.length >= slots) break;
    }
    if (toAdd.length > 0) setImages((prev) => [...prev, ...toAdd]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleReplace = (id) => {
    replaceTargetRef.current = id;
    replaceInputRef.current.value = "";
    replaceInputRef.current.click();
  };

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    const id   = replaceTargetRef.current;
    if (!file || !id) return;
    const ext  = ("." + file.name.split(".").pop()).toLowerCase();
    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME.includes(mime) && !ALLOWED_EXT.includes(ext)) {
      setImgError("Invalid format. Use JPG, PNG, or WEBP.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          if (i.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(i.previewUrl);
          return { ...i, previewUrl, file, name: file.name, size: file.size, uploaded: false, url: "" };
        }
        return i;
      })
    );
  };

  // Upload images to backend; returns array of URLs
  const uploadImages = async (token) => {
    const newFiles = images.filter((i) => !i.uploaded && i.file);
    if (newFiles.length === 0) return images.map((i) => i.url).filter(Boolean);

    const formData = new FormData();
    newFiles.forEach((i) => formData.append("images", i.file));

    setUploading(true);
    try {
      const res = await axios.post(UPLOAD_API_URL, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && Array.isArray(res.data.images)) {
        let urlIdx = 0;
        const updated = images.map((i) => {
          if (!i.uploaded && i.file) {
            const url = res.data.images[urlIdx++] || "";
            return { ...i, uploaded: true, url };
          }
          return i;
        });
        setImages(updated);
        return updated.map((i) => i.url).filter(Boolean);
      } else {
        throw new Error("Image upload response invalid.");
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Validation ──
  const validate = () => {
    const errors = {};
    if (!selectedProductId) errors.product = "Please select a parent product.";
    if (!color.trim())       errors.color   = "Color name is required.";
    if (!size || !SIZES.includes(size)) errors.size = "Please select a valid size.";
    if (stock === "" || isNaN(numericStock) || !Number.isInteger(numericStock) || numericStock < 0)
      errors.stock = "Stock must be a whole number ≥ 0.";
    const numPrice = Number(price);
    if (price === "" || isNaN(numPrice) || numPrice < 0)
      errors.price = "Price is required and must be a valid number ≥ 0.";
    if (salePrice !== "" && salePrice !== null) {
      const ns = Number(salePrice);
      if (isNaN(ns) || ns < 0) errors.salePrice = "Sale price must be ≥ 0.";
      else if (!isNaN(numPrice) && ns >= numPrice) errors.salePrice = "Sale price must be less than regular price.";
    }
    // Duplicate check
    if (selectedProduct && Array.isArray(selectedProduct.variants)) {
      const tc = color.trim().toLowerCase();
      const ts = size.trim();
      if (selectedProduct.variants.some((v) =>
        v.color?.trim().toLowerCase() === tc && v.size?.trim() === ts
      )) {
        errors.color = `Variant "${color.trim()} / ${ts}" already exists for this product.`;
      }
    }
    return errors;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    setIsSubmitting(true);

    try {
      // 1. Upload any new images first
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(token);
      }

      // 2. Create variant
      const payload = {
        size:  size.trim(),
        color: color.trim(),
        stock: Number(stock),
        price: Number(price),
        images: imageUrls,
      };
      if (salePrice !== "" && salePrice !== null && salePrice !== undefined) {
        payload.salePrice = Number(salePrice);
      }

      const res = await axios.post(
        `${PRODUCTS_API_URL}/${selectedProductId}/variants`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201 && res.data?.success) {
        const prodName  = selectedProduct?.name || initialProductName || "Product";
        const backTarget = selectedProductId
          ? `/admin/variants?productId=${selectedProductId}&productName=${encodeURIComponent(prodName)}`
          : "/admin/variants";
        localStorage.setItem("elarque_last_update", Date.now().toString());
        window.dispatchEvent(new CustomEvent("elarque:data-updated"));
        navigate(backTarget, {
          state: {
            productId:   selectedProductId,
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
        setSubmitError(err.response?.data?.message || "A variant with this color and size already exists.");
      } else {
        setSubmitError(err.response?.data?.message || "An error occurred. Please retry.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const backUrl = selectedProductId || initialProductId
    ? `/admin/variants?productId=${selectedProductId || initialProductId}&productName=${encodeURIComponent(initialProductName || selectedProduct?.name || "")}`
    : "/admin/variants";

  return (
    <div className="av-page">
      <div className="av-main">
        {/* ── Page Header ── */}
        <div className="av-page-header">
          <div className="av-header-left">
            <div className="av-eyebrow">
              <span className="av-eyebrow-dot" />
              Atelier Merchandising · SKU Specification &amp; Attribute Creation
            </div>
            <h1 className="av-page-title">Add New Variant</h1>
            <p className="av-page-subtitle">
              Add a new size or color variant for an existing product to sync directly across
              international couture salons.
            </p>
          </div>

          <Link to={backUrl} className="av-btn-back">
            <ArrowLeft size={13} />
            Back to Variants
          </Link>
        </div>

        <div className="av-header-divider" />

        {/* ── Global Error ── */}
        {submitError && (
          <div className="av-alert av-alert-error" role="alert">
            <span>{submitError}</span>
          </div>
        )}

        {/* ── Form Card ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="av-card">
            <div className="av-card-top-accent" />
            <div className="av-card-body">

              {/* ── Two-column grid ── */}
              <div className="av-form-grid">

                {/* LEFT: Parent Silhouette */}
                <div className="av-field">
                  <label className="av-label">
                    Parent Silhouette <span className="av-req">*</span>
                  </label>
                  {loadingProducts ? (
                    <div className="av-loading-inline">
                      <span className="av-spinner-sm" />
                      <span>Loading products…</span>
                    </div>
                  ) : productsError ? (
                    <p className="av-field-err-text">{productsError}</p>
                  ) : products.length === 0 ? (
                    <p className="av-warning-text">No products found. Create a product first.</p>
                  ) : (
                    <>
                      <select
                        className={`av-select ${formErrors.product ? "has-error" : ""}`}
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setFormErrors((p) => ({ ...p, product: "" }));
                        }}
                        disabled={isSubmitting}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.brand ? ` — ${p.brand}` : ""}
                          </option>
                        ))}
                      </select>
                      {formErrors.product && <span className="av-field-err-text">{formErrors.product}</span>}
                    </>
                  )}

                  {/* Parent product mini-preview */}
                  {selectedProduct && (
                    <div className="av-product-preview" style={{ marginTop: 12 }}>
                      <div className="av-preview-badge">
                        <span className={`av-preview-dot ${selectedProduct.status !== "active" ? "inactive" : ""}`} />
                        <span className="av-preview-dot-label">
                          {selectedProduct.status === "active" ? "Active Silhouette" : "Inactive"}
                        </span>
                      </div>
                      <div className="av-preview-grid">
                        <div className="av-preview-item">
                          <span className="av-preview-label">Product</span>
                          <span className="av-preview-value">{selectedProduct.name}</span>
                        </div>
                        <div className="av-preview-item">
                          <span className="av-preview-label">Brand</span>
                          <span className="av-preview-value">{selectedProduct.brand || "—"}</span>
                        </div>
                        <div className="av-preview-item">
                          <span className="av-preview-label">Base Price</span>
                          <span className="av-preview-value gold">{formatPrice(selectedProduct.price)}</span>
                        </div>
                        <div className="av-preview-item">
                          <span className="av-preview-label">Category</span>
                          <span className="av-preview-value">
                            {typeof selectedProduct.category === "object"
                              ? selectedProduct.category?.name
                              : selectedProduct.category || "—"}
                          </span>
                        </div>
                      </div>
                      {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 && (
                        <div className="av-existing-variants">
                          <span className="av-preview-label">
                            Existing Variants ({selectedProduct.variants.length}):
                          </span>
                          <div className="av-existing-chips">
                            {selectedProduct.variants.map((v, i) => (
                              <span key={i} className="av-existing-chip">
                                <span
                                  className="av-chip-dot"
                                  style={{ backgroundColor: getColorHex(v.color) }}
                                />
                                {v.color} ({v.size})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Standard Cut Size */}
                <div className="av-field">
                  <div className="av-label-row">
                    <label className="av-label">
                      Standard Cut Size <span className="av-req">*</span>
                    </label>
                    <span className="av-label-badge">EU Standard 38</span>
                  </div>
                  <div className="av-size-chips">
                    {SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`av-size-chip ${size === sz ? "av-size-selected" : ""}`}
                        onClick={() => {
                          setSize(sz);
                          setFormErrors((p) => ({ ...p, size: "" }));
                        }}
                        disabled={isSubmitting}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  {formErrors.size && <span className="av-field-err-text">{formErrors.size}</span>}
                </div>

                {/* LEFT: Chromatic Shade & Label */}
                <div className="av-field">
                  <label className="av-label">
                    Chromatic Shade &amp; Label <span className="av-req">*</span>
                  </label>
                  <div className="av-color-wrap">
                    <span
                      className="av-color-swatch"
                      style={{ backgroundColor: getColorHex(color) }}
                      title="Estimated color swatch"
                    />
                    <div className="av-color-input-inner">
                      <input
                        type="text"
                        className={`av-input ${formErrors.color ? "has-error" : ""}`}
                        value={color}
                        onChange={(e) => {
                          setColor(e.target.value);
                          setFormErrors((p) => ({ ...p, color: "" }));
                        }}
                        placeholder="e.g. Burgundy Velvet / Noir"
                        disabled={isSubmitting}
                        style={{ paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        className="av-color-picker-btn"
                        title="Color name sets the swatch preview"
                        tabIndex={-1}
                      >
                        <Pipette size={14} />
                      </button>
                    </div>
                  </div>
                  {formErrors.color && <span className="av-field-err-text">{formErrors.color}</span>}
                </div>

                {/* RIGHT: Vault Allocation + Geneva Depositary */}
                <div className="av-field">
                  <div className="av-sub-label-pair">
                    <span className="av-sub-label">Vault Allocation <span className="av-req">*</span></span>
                    <span className="av-sub-label-right">Geneva Depositary</span>
                  </div>
                  <div className="av-stock-wrap">
                    <span className="av-stock-icon">
                      <Package size={14} />
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`av-input av-stock-input ${formErrors.stock ? "has-error" : ""}`}
                      value={stock}
                      onChange={(e) => {
                        setStock(e.target.value);
                        setFormErrors((p) => ({ ...p, stock: "" }));
                      }}
                      placeholder="e.g. 25"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.stock && <span className="av-field-err-text">{formErrors.stock}</span>}
                  {/* Derived status */}
                  {stock !== "" && !isNaN(numericStock) && (
                    <span className={`av-status-pill ${derivedStatus === "in_stock" ? "in-stock" : derivedStatus === "low_stock" ? "low-stock" : "out-stock"}`}>
                      <span className="av-status-dot" />
                      {derivedStatus === "in_stock" ? "In Stock (> 5)"
                        : derivedStatus === "low_stock" ? "Low Stock (1–5)"
                        : "Out of Stock (0)"}
                    </span>
                  )}
                </div>

                {/* LEFT: Retail Valuation */}
                <div className="av-field">
                  <div className="av-label-row">
                    <label className="av-label">
                      Retail Valuation (Atelier INR) <span className="av-req">*</span>
                    </label>
                    <span className="av-label-badge" style={{ fontSize: "9px", lineHeight: 1.3 }}>
                      incl. vat &amp;<br />luxury tariff
                    </span>
                  </div>
                  <div className="av-price-wrap">
                    <span className="av-price-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`av-input av-price-input ${formErrors.price ? "has-error" : ""}`}
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setFormErrors((p) => ({ ...p, price: "" }));
                      }}
                      placeholder="e.g. 18500"
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.price && <span className="av-field-err-text">{formErrors.price}</span>}
                  <span className="av-helper">
                    Calculated markup: +42% couture craftsmanship surcharge
                  </span>
                </div>

                {/* RIGHT: Commercial Availability */}
                <div className="av-field">
                  <label className="av-label">Commercial Availability</label>
                  <div className="av-avail-wrap">
                    <span className="av-avail-dot" style={{ backgroundColor: availDotColor }} />
                    <select
                      className="av-select av-avail-select"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="in_stock">In Stock (Ready for Dispatch)</option>
                      <option value="low_stock">Low Stock (Limited Units)</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                {/* Sale Price — spans both columns */}
                {salePrice !== "" && (
                  <div className="av-field">
                    <div className="av-label-row">
                      <label className="av-label">Sale / Promo Price (₹)</label>
                      <span className="av-label-badge">Optional</span>
                    </div>
                    <div className="av-price-wrap">
                      <span className="av-price-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={`av-input av-price-input ${formErrors.salePrice ? "has-error" : ""}`}
                        value={salePrice}
                        onChange={(e) => {
                          setSalePrice(e.target.value);
                          setFormErrors((p) => ({ ...p, salePrice: "" }));
                        }}
                        placeholder="e.g. 15500"
                        disabled={isSubmitting}
                      />
                    </div>
                    {formErrors.salePrice && <span className="av-field-err-text">{formErrors.salePrice}</span>}
                  </div>
                )}
                {salePrice === "" && (
                  <div className="av-field" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="av-btn-cancel"
                      style={{ fontSize: 11, padding: "4px 0", textAlign: "left", color: "#9a8578", letterSpacing: "0.5px" }}
                      onClick={() => setSalePrice("0")}
                    >
                      + Add sale / promo price (optional)
                    </button>
                  </div>
                )}
              </div>

              {/* ── Image Section ── */}
              <div className="av-section-divider" />

              {/* Imagery header */}
              <div className="av-imagery-header">
                <div>
                  <p className="av-imagery-title">Variant Lookbook Imagery</p>
                  <p className="av-imagery-subtitle">
                    Atelier editorial portrait 3:4 ratio, min 1200×1600px
                  </p>
                </div>
                <span className="av-imagery-count">
                  {images.length} Media Linked
                </span>
              </div>

              {/* Hidden inputs */}
              <input type="file" ref={fileInputRef} multiple accept=".jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isSubmitting || uploading}
              />
              <input type="file" ref={replaceInputRef} accept=".jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={handleReplaceFile}
              />

              {/* Dropzone */}
              <div
                className={`av-dropzone ${isDragOver ? "dz-active" : ""} ${(isSubmitting || uploading) ? "dz-disabled" : ""}`}
                onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => {
                  if (!isSubmitting && !uploading && fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
              >
                <UploadCloud size={32} className="av-dz-icon" />
                <p className="av-dz-lead">
                  Drag &amp; drop 3 variant master photo here, or{" "}
                  <span
                    className="av-dz-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    browse atelier files
                  </span>
                </p>
                <p className="av-dz-meta">High-resolution TIFF, RAW, or lossless WebP accepted</p>
              </div>

              {imgError && <p className="av-field-err-text" style={{ marginTop: 8 }}>{imgError}</p>}

              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="av-thumbs-row">
                  {images.map((img) => (
                    <div key={img.id} className="av-thumb">
                      <img src={img.previewUrl} alt={img.name} />
                      <div className="av-thumb-actions">
                        <button
                          type="button"
                          className="av-thumb-btn"
                          title="Replace image"
                          onClick={() => handleReplace(img.id)}
                          disabled={isSubmitting || uploading}
                        >
                          <RefreshCw size={12} />
                        </button>
                        <button
                          type="button"
                          className="av-thumb-btn"
                          title="Remove image"
                          onClick={() => handleRemove(img.id)}
                          disabled={isSubmitting || uploading}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer Actions ── */}
            <div className="av-card-footer">
              <button
                type="button"
                className="av-btn-cancel"
                onClick={() => navigate(backUrl)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="av-btn-submit"
                disabled={isSubmitting || uploading || loadingProducts || products.length === 0}
              >
                {(isSubmitting || uploading) ? (
                  <>
                    <span className="av-spinner-sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                    <span>{uploading ? "Uploading…" : "Registering…"}</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                      <path d="M8 12h8M12 8v8" />
                    </svg>
                    Register Variant
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVariant;
