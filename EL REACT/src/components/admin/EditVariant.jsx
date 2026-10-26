import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  AlertCircle,
  UploadCloud,
  RefreshCw,
  Trash2,
  Pipette,
  Package,
} from "lucide-react";
import "./EditVariant.css";

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

const EditVariant = () => {
  const { productId, variantId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const fileInputRef    = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const filterProductId   = location.state?.productId   || queryParams.get("productId")   || productId;
  const filterProductName = location.state?.productName || queryParams.get("productName") || "";

  // ── Data loading ──
  const [parentProduct, setParentProduct]   = useState(null);
  const [siblingVariants, setSiblingVariants] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState("");

  // ── Form fields ──
  const [color, setColor]       = useState("");
  const [size,  setSize]        = useState("M");
  const [stock, setStock]       = useState("0");
  const [price, setPrice]       = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [availability, setAvailability] = useState("in_stock");

  // ── Images ──
  const [images, setImages]         = useState([]); // [{id, previewUrl, file?, url, uploaded}]
  const [isDragOver, setIsDragOver] = useState(false);
  const [imgError, setImgError]     = useState("");
  const [uploading, setUploading]   = useState(false);

  // ── Submission ──
  const [formErrors, setFormErrors]   = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Load variant data ──
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }

    const run = async () => {
      if (!productId || !variantId) {
        setFetchError("Invalid product or variant identifier.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(
          `${PRODUCTS_API_URL}/${productId}/variants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!isMounted) return;

        if (res.data?.success) {
          const productData = res.data.product || {};
          const variantsList = res.data.variants || [];
          setParentProduct(productData);
          setSiblingVariants(variantsList);

          const target = variantsList.find((v) => (v.id || v._id) === variantId);
          if (!target) { setFetchError("Requested variant was not found."); return; }

          setColor(target.color || "");
          setSize(target.size  || "M");
          setStock(String(target.stock !== undefined ? target.stock : 0));
          setPrice(target.price !== undefined && target.price !== null
            ? String(target.price)
            : String(productData.price || ""));
          setSalePrice(target.salePrice !== undefined && target.salePrice !== null
            ? String(target.salePrice)
            : "");

          // Build image list from existing URLs
          const existingImages = (Array.isArray(target.images) ? target.images : []).map((url, idx) => ({
            id:         "existing-" + idx + "-" + Date.now(),
            previewUrl: url,
            file:       null,
            url,
            uploaded:   true,
            name:       url.split("/").pop() || `image-${idx}`,
            size:       0,
          }));
          setImages(existingImages);

          // Derive availability from stock
          const s = target.stock || 0;
          setAvailability(s > 5 ? "in_stock" : s > 0 ? "low_stock" : "out_of_stock");
        } else {
          setFetchError("Unable to retrieve variant information.");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          return;
        }
        setFetchError(err.response?.data?.message || "Failed to load variant. Please retry.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [productId, variantId, navigate]);

  // Derived stock status
  const numericStock = Number(stock);
  const derivedStatus =
    !isNaN(numericStock) && numericStock > 5 ? "in_stock"
    : !isNaN(numericStock) && numericStock > 0 ? "low_stock"
    : "out_of_stock";

  const availDotColor = availability === "in_stock" ? "#10b981"
    : availability === "low_stock"    ? "#f59e0b"
    : availability === "coming_soon"  ? "#3b82f6"
    : "#ef4444";

  // ── Image Handling ──
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

  // Upload new (not yet uploaded) images
  const uploadNewImages = async (token) => {
    const newFiles = images.filter((i) => !i.uploaded && i.file);
    if (newFiles.length === 0) {
      // All existing — return current URLs
      return images.map((i) => i.url).filter(Boolean);
    }
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
    if (!color.trim()) errors.color = "Color name is required.";
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
    // Duplicate check against siblings (excluding self)
    if (Array.isArray(siblingVariants)) {
      const tc = color.trim().toLowerCase();
      const ts = size.trim();
      if (siblingVariants.some((v) =>
        (v.id || v._id) !== variantId &&
        v.color?.trim().toLowerCase() === tc &&
        v.size?.trim() === ts
      )) {
        errors.color = `Variant "${color.trim()} / ${ts}" already exists for this product.`;
      }
    }
    return errors;
  };

  // ── Submit (PATCH) ──
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
      // 1. Upload any new images
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadNewImages(token);
      }

      // 2. Patch variant
      const payload = {
        size:   size.trim(),
        color:  color.trim(),
        stock:  Number(stock),
        price:  Number(price),
        images: imageUrls,
      };
      if (salePrice !== "" && salePrice !== null && salePrice !== undefined) {
        payload.salePrice = Number(salePrice);
      }

      const res = await axios.patch(
        `${PRODUCTS_API_URL}/${productId}/variants/${variantId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200 && res.data?.success) {
        const prodName   = parentProduct?.name || filterProductName || "Product";
        const backTarget = filterProductId
          ? `/admin/variants?productId=${filterProductId}&productName=${encodeURIComponent(prodName)}`
          : "/admin/variants";
        localStorage.setItem("elarque_last_update", Date.now().toString());
        window.dispatchEvent(new CustomEvent("elarque:data-updated"));
        navigate(backTarget, {
          state: {
            productId:      filterProductId,
            productName:    prodName,
            successMessage: `Variant "${color.trim()} (${size.trim()})" updated successfully.`,
          },
        });
      } else {
        setSubmitError("Failed to update variant. Please retry.");
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

  const backUrl = filterProductId
    ? `/admin/variants?productId=${filterProductId}&productName=${encodeURIComponent(filterProductName || parentProduct?.name || "")}`
    : "/admin/variants";

  // ── Loading / Error States ──
  if (loading) {
    return (
      <div className="ev-page">
        <div className="ev-main">
          <div className="ev-loading">
            <div className="ev-spinner" />
            <p>Loading variant specifications…</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="ev-page">
        <div className="ev-main">
          <div className="ev-error-card">
            <AlertCircle size={38} color="#ef4444" />
            <h2>Variant Not Found</h2>
            <p>{fetchError}</p>
            <Link to="/admin/variants" className="ev-btn-back-err">
              Return to Variants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-page">
      <div className="ev-main">
        {/* ── Page Header ── */}
        <div className="av-page-header">
          <div className="av-header-left">
            <div className="av-eyebrow">
              <span className="av-eyebrow-dot" />
              Atelier Merchandising · SKU Specification &amp; Attribute Creation
            </div>
            <h1 className="av-page-title">Edit Variant</h1>
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

                {/* LEFT: Parent Silhouette (read-only in edit mode) */}
                <div className="av-field">
                  <label className="av-label">Parent Silhouette</label>
                  <input
                    type="text"
                    className="av-input"
                    value={parentProduct?.name
                      ? `${parentProduct.name}${parentProduct.brand ? " — " + parentProduct.brand : ""}`
                      : "Loading…"}
                    readOnly
                    style={{ background: "#f0ede9", cursor: "default", color: "#4a3228" }}
                  />

                  {/* Parent product mini-preview */}
                  {parentProduct && (
                    <div className="av-product-preview" style={{ marginTop: 12 }}>
                      <div className="av-preview-badge">
                        <span className={`av-preview-dot ${parentProduct.status !== "active" ? "inactive" : ""}`} />
                        <span className="av-preview-dot-label">
                          {parentProduct.status === "active" ? "Active Silhouette" : "Inactive"}
                        </span>
                      </div>
                      <div className="av-preview-grid">
                        <div className="av-preview-item">
                          <span className="av-preview-label">Base Price</span>
                          <span className="av-preview-value gold">{formatPrice(parentProduct.price)}</span>
                        </div>
                        <div className="av-preview-item">
                          <span className="av-preview-label">Category</span>
                          <span className="av-preview-value">
                            {typeof parentProduct.category === "object"
                              ? parentProduct.category?.name
                              : parentProduct.category || "—"}
                          </span>
                        </div>
                      </div>
                      {Array.isArray(siblingVariants) && siblingVariants.length > 0 && (
                        <div className="av-existing-variants">
                          <span className="av-preview-label">
                            All Variants ({siblingVariants.length}):
                          </span>
                          <div className="av-existing-chips">
                            {siblingVariants.map((v, i) => {
                              const isCurrent = (v.id || v._id) === variantId;
                              return (
                                <span
                                  key={i}
                                  className="av-existing-chip"
                                  style={isCurrent ? { border: "1.5px solid #590719", background: "rgba(89,7,25,0.1)", fontWeight: 600 } : {}}
                                >
                                  <span
                                    className="av-chip-dot"
                                    style={{ backgroundColor: getColorHex(v.color) }}
                                  />
                                  {v.color} ({v.size}){isCurrent ? " [Editing]" : ""}
                                </span>
                              );
                            })}
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
                      <button type="button" className="av-color-picker-btn" tabIndex={-1}>
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

                {/* Sale Price row */}
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
              </div>

              {/* ── Lookbook Image Section ── */}
              <div className="av-section-divider" />

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

              {/* Hidden file inputs */}
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

              {/* Thumbnails — show existing + new */}
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
                Discard Changes
              </button>
              <button
                type="submit"
                className="av-btn-submit"
                disabled={isSubmitting || uploading}
              >
                {(isSubmitting || uploading) ? (
                  <>
                    <span className="av-spinner-sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                    <span>{uploading ? "Uploading…" : "Updating…"}</span>
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

export default EditVariant;
