import React, { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import axios from "axios";
import {
  Upload,
  Image as ImageIcon,
  Crop as CropIcon,
  Trash2,
  Star,
  RefreshCw,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import "./ProductImageUploader.css";

// Helper to create an HTML Image element from a source URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Perform high-quality client-side crop and resolution downscaling
 * to ensure visuals are crisp for luxury display while complying
 * with backend file size restrictions.
 */
async function getCroppedImg(imageSrc, pixelCrop, fileName = "product.jpg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not obtain canvas 2D rendering context.");
  }

  // Set canvas size to the cropped pixel dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the specified crop rectangle onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // High-resolution constraint: Max 1800 x 2400 for fashion editorial visuals
  const MAX_WIDTH = 1800;
  const MAX_HEIGHT = 2400;
  let finalCanvas = canvas;

  if (canvas.width > MAX_WIDTH || canvas.height > MAX_HEIGHT) {
    let newWidth = canvas.width;
    let newHeight = canvas.height;

    if (newWidth / MAX_WIDTH > newHeight / MAX_HEIGHT) {
      newHeight = Math.round((newHeight * MAX_WIDTH) / newWidth);
      newWidth = MAX_WIDTH;
    } else {
      newWidth = Math.round((newWidth * MAX_HEIGHT) / newHeight);
      newHeight = MAX_HEIGHT;
    }

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    const resizedCtx = resizedCanvas.getContext("2d");
    if (resizedCtx) {
      resizedCtx.imageSmoothingQuality = "high";
      resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
      finalCanvas = resizedCanvas;
    }
  }

  // Preserve PNG if original was PNG, otherwise default to high-grade JPEG
  const isPng = fileName.toLowerCase().endsWith(".png");
  const outputMime = isPng ? "image/png" : "image/jpeg";
  const outputExt = isPng ? ".png" : ".jpg";
  const finalFileName = fileName.replace(/\.[^/.]+$/, "") + outputExt;

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob export failed."));
          return;
        }

        const file = new File([blob], finalFileName, { type: outputMime });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      },
      outputMime,
      0.92
    );
  });
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function ProductImageUploader({
  onUploadComplete,
  initialImages = [],
  maxImages = 10,
  minImages = 3,
  disabled = false,
}) {
  // Main list of finalized, cropped images ready for upload
  const [processedImages, setProcessedImages] = useState(initialImages);

  // Active item currently inside the crop modal
  const [croppingItem, setCroppingItem] = useState(null);
  // Queue of remaining images waiting to be cropped sequentially
  const [cropQueue, setCropQueue] = useState([]);

  // Cropper geometry state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(3 / 4); // 3:4 portrait luxury standard
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // UI status state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorNotification, setErrorNotification] = useState("");
  const [successNotification, setSuccessNotification] = useState("");
  const [uploadedUrls, setUploadedUrls] = useState([]);

  // File input refs
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetIdRef = useRef(null);

  // Clean up object URLs on component unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      processedImages.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      if (croppingItem?.rawUrl && croppingItem.rawUrl.startsWith("blob:")) {
        URL.revokeObjectURL(croppingItem.rawUrl);
      }
      cropQueue.forEach((item) => {
        if (item.rawUrl && item.rawUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.rawUrl);
        }
      });
    };
  }, [processedImages, croppingItem, cropQueue]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (successNotification || errorNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification("");
        setErrorNotification("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification, errorNotification]);

  const onCropCompleteCallback = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  /**
   * Validate and queue incoming File objects
   */
  const handleFiles = (filesList) => {
    setErrorNotification("");
    setSuccessNotification("");

    if (!filesList || filesList.length === 0) return;

    const filesArray = Array.from(filesList);
    const validFiles = [];
    const availableSlots = maxImages - processedImages.length;

    if (availableSlots <= 0) {
      setErrorNotification(`Maximum limit of ${maxImages} images already reached.`);
      return;
    }

    for (const file of filesArray) {
      const ext = ("." + file.name.split(".").pop()).toLowerCase();
      const mime = file.type.toLowerCase();

      // Format validation
      if (!ALLOWED_MIME_TYPES.includes(mime) && !ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorNotification(
          `Invalid file format for "${file.name}". Supported formats: JPG, JPEG, PNG, WEBP.`
        );
        continue;
      }

      // Raw pre-crop size limit (25 MB max raw input to avoid crashing browser canvas)
      if (file.size > 25 * 1024 * 1024) {
        setErrorNotification(
          `"${file.name}" exceeds the maximum allowable initial file size (25MB).`
        );
        continue;
      }

      // Duplicate prevention based on file name and size
      const isDuplicate = processedImages.some(
        (img) => img.originalName === file.name && img.file?.size === file.size
      );
      if (isDuplicate) {
        setErrorNotification(`"${file.name}" is already selected.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check count capacity
    let filesToQueue = validFiles;
    if (validFiles.length > availableSlots) {
      setErrorNotification(
        `Only ${availableSlots} more image(s) can be added (Maximum ${maxImages} allowed).`
      );
      filesToQueue = validFiles.slice(0, availableSlots);
    }

    // Build crop queue with temporary raw object URLs
    const queueItems = filesToQueue.map((file, idx) => ({
      file,
      rawUrl: URL.createObjectURL(file),
      originalName: file.name,
      queueIndex: idx + 1,
      totalQueue: filesToQueue.length,
      isReplacement: false,
    }));

    // Start with first item; queue the rest
    setCroppingItem(queueItems[0]);
    setCropQueue(queueItems.slice(1));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  /**
   * Confirm the current crop and proceed to next in queue
   */
  const handleConfirmCrop = async () => {
    if (!croppingItem || !croppedAreaPixels) return;

    try {
      const { file: croppedFile, previewUrl } = await getCroppedImg(
        croppingItem.rawUrl,
        croppedAreaPixels,
        croppingItem.originalName
      );

      // Clean up the raw pre-crop object URL
      URL.revokeObjectURL(croppingItem.rawUrl);

      if (croppingItem.isReplacement && croppingItem.replaceTargetId) {
        // Replace existing image in-place, preserving cover status
        setProcessedImages((prev) =>
          prev.map((img) => {
            if (img.id === croppingItem.replaceTargetId) {
              if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(img.previewUrl);
              }
              return {
                ...img,
                file: croppedFile,
                previewUrl,
                originalName: croppingItem.originalName,
              };
            }
            return img;
          })
        );
        setSuccessNotification(`Image "${croppingItem.originalName}" replaced successfully.`);
      } else {
        // Append newly cropped image
        const isFirstImage = processedImages.length === 0;
        const newImage = {
          id: "img-" + Date.now() + "-" + Math.random().toString(36).substr(2, 7),
          file: croppedFile,
          previewUrl,
          originalName: croppingItem.originalName,
          isCover: isFirstImage, // First image defaults to Lookbook Cover
        };
        setProcessedImages((prev) => [...prev, newImage]);
      }

      // Check for remaining queued images
      if (cropQueue.length > 0) {
        const nextItem = cropQueue[0];
        setCroppingItem(nextItem);
        setCropQueue(cropQueue.slice(1));
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        setCroppingItem(null);
      }
    } catch (err) {
      console.error("Cropping error:", err);
      setErrorNotification("Failed to crop image. Please try again.");
    }
  };

  /**
   * Skip crop for current image (use raw file scaled/converted)
   */
  const handleSkipCrop = () => {
    if (!croppingItem) return;

    // Use raw file directly
    const previewUrl = URL.createObjectURL(croppingItem.file);
    URL.revokeObjectURL(croppingItem.rawUrl);

    if (croppingItem.isReplacement && croppingItem.replaceTargetId) {
      setProcessedImages((prev) =>
        prev.map((img) => {
          if (img.id === croppingItem.replaceTargetId) {
            if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(img.previewUrl);
            }
            return {
              ...img,
              file: croppingItem.file,
              previewUrl,
              originalName: croppingItem.originalName,
            };
          }
          return img;
        })
      );
    } else {
      const isFirstImage = processedImages.length === 0;
      setProcessedImages((prev) => [
        ...prev,
        {
          id: "img-" + Date.now() + "-" + Math.random().toString(36).substr(2, 7),
          file: croppingItem.file,
          previewUrl,
          originalName: croppingItem.originalName,
          isCover: isFirstImage,
        },
      ]);
    }

    // Process next queued image
    if (cropQueue.length > 0) {
      const nextItem = cropQueue[0];
      setCroppingItem(nextItem);
      setCropQueue(cropQueue.slice(1));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      setCroppingItem(null);
    }
  };

  /**
   * Cancel cropping modal and discard remaining queue
   */
  const handleCancelCrop = () => {
    if (croppingItem?.rawUrl) {
      URL.revokeObjectURL(croppingItem.rawUrl);
    }
    cropQueue.forEach((item) => {
      if (item.rawUrl) URL.revokeObjectURL(item.rawUrl);
    });
    setCroppingItem(null);
    setCropQueue([]);
  };

  /**
   * Assign designated Lookbook Cover image
   */
  const handleMakeCover = (targetId) => {
    setProcessedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === targetId,
      }))
    );
    setSuccessNotification("Lookbook Cover image assigned.");
  };

  /**
   * Remove individual image thumbnail
   */
  const handleRemoveImage = (targetId) => {
    setProcessedImages((prev) => {
      const targetImg = prev.find((img) => img.id === targetId);
      if (targetImg?.previewUrl && targetImg.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(targetImg.previewUrl);
      }

      const filtered = prev.filter((img) => img.id !== targetId);

      // If removed image was the cover, assign cover status to the new first image
      if (targetImg?.isCover && filtered.length > 0) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
    setSuccessNotification("Image removed.");
  };

  /**
   * Trigger replacement flow for an existing image
   */
  const handleTriggerReplace = (targetId) => {
    replaceTargetIdRef.current = targetId;
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReplacementFileSelected = (e) => {
    const file = e.target.files?.[0];
    const targetId = replaceTargetIdRef.current;
    if (!file || !targetId) return;

    const ext = ("." + file.name.split(".").pop()).toLowerCase();
    const mime = file.type.toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(mime) && !ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorNotification("Invalid format. Please select a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    const item = {
      file,
      rawUrl: URL.createObjectURL(file),
      originalName: file.name,
      queueIndex: 1,
      totalQueue: 1,
      isReplacement: true,
      replaceTargetId: targetId,
    };

    setCroppingItem(item);
    setCropQueue([]);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  /**
   * Upload all processed images to the Step 12B backend endpoint
   */
  const handleUploadImages = async () => {
    setErrorNotification("");
    setSuccessNotification("");

    if (processedImages.length < minImages) {
      setErrorNotification(`Minimum ${minImages} images are required before upload. You have ${processedImages.length}.`);
      return;
    }

    if (processedImages.length > maxImages) {
      setErrorNotification(`Maximum ${maxImages} images allowed. Please remove ${processedImages.length - maxImages} image(s).`);
      return;
    }

    // Strictly read admin token from localStorage
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setErrorNotification("Admin authorization token not found. Please log in as an administrator.");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1800);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Order images so the Lookbook Cover image is index 0
      const sortedImages = [...processedImages].sort((a, b) =>
        b.isCover ? 1 : a.isCover ? -1 : 0
      );

      const formData = new FormData();
      sortedImages.forEach((img) => {
        formData.append("images", img.file);
      });

      const response = await axios.post(
        "http://localhost:5000/api/admin/products/images",
        formData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          },
        }
      );

      if (response.data?.success && Array.isArray(response.data?.images)) {
        setUploadedUrls(response.data.images);
        setSuccessNotification(
          response.data.message || "Product images uploaded successfully!"
        );

        // Expose uploaded URLs to parent Add Product container
        if (typeof onUploadComplete === "function") {
          onUploadComplete(response.data.images);
        }
      }
    } catch (err) {
      console.error("Upload visuals error:", err);
      if (err.response?.status === 401) {
        // Clear ONLY admin credentials
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setErrorNotification("Admin session expired. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
      } else {
        const errorMsg =
          err.response?.data?.message ||
          "Network or server error while uploading product visuals.";
        setErrorNotification(errorMsg);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const canUpload =
    processedImages.length >= minImages &&
    processedImages.length <= maxImages &&
    !isUploading &&
    !croppingItem &&
    !disabled;

  return (
    <div className="admin-product-uploader">
      {/* Hidden replacement file input */}
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplacementFileSelected}
        accept=".jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
      />

      {/* SECTION HEADER */}
      <div className="admin-uploader-header">
        <div className="admin-uploader-title-wrap">
          <div className="admin-uploader-tag">
            <Sparkles size={13} className="admin-uploader-tag-icon" />
            <span>High-Resolution Visuals</span>
          </div>
          <h3 className="admin-uploader-title">
            PRODUCT MEDIA &amp; LOOKBOOK COVER
          </h3>
          <p className="admin-uploader-subtitle">
            Upload high-resolution photography for lookbook presentation.
            Minimum 3, maximum 10 images (JPG, PNG, WEBP up to 5MB each).
          </p>
        </div>

        {/* Counter Badge */}
        <div
          className={`admin-uploader-count-badge ${
            processedImages.length >= minImages ? "count-valid" : "count-pending"
          }`}
        >
          <span className="count-number">
            {processedImages.length} / {maxImages}
          </span>
          <span className="count-label">
            {processedImages.length < minImages
              ? `Need ${minImages - processedImages.length} more`
              : "Ready"}
          </span>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorNotification && (
        <div className="admin-uploader-banner banner-error">
          <AlertCircle size={17} className="banner-icon" />
          <span>{errorNotification}</span>
          <button
            type="button"
            className="banner-close"
            onClick={() => setErrorNotification("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {successNotification && (
        <div className="admin-uploader-banner banner-success">
          <CheckCircle2 size={17} className="banner-icon" />
          <span>{successNotification}</span>
          <button
            type="button"
            className="banner-close"
            onClick={() => setSuccessNotification("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* DRAG & DROP ZONE */}
      <div
        className={`admin-uploader-dropzone ${
          isDragOver ? "dropzone-active" : ""
        } ${disabled || isUploading ? "dropzone-disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isUploading && fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
          disabled={disabled || isUploading}
        />

        <div className="admin-dropzone-inner">
          <div className="admin-dropzone-icon-circle">
            <Upload size={24} strokeWidth={1.75} />
          </div>

          <div className="admin-dropzone-copy">
            <span className="admin-dropzone-lead">
              Drag &amp; drop high-resolution editorial visuals
            </span>
            <span className="admin-dropzone-sub">
              or click to browse from device
            </span>
          </div>

          <button
            type="button"
            className="admin-dropzone-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
                fileInputRef.current.click();
              }
            }}
            disabled={disabled || isUploading}
          >
            <ImageIcon size={14} strokeWidth={2} />
            <span>Choose Images</span>
          </button>

          <div className="admin-dropzone-meta">
            <span>JPG • JPEG • PNG • WEBP</span>
            <span className="meta-separator">•</span>
            <span>Up to 5MB per file</span>
            <span className="meta-separator">•</span>
            <span>3 to 10 visuals</span>
          </div>
        </div>
      </div>

      {/* PREVIEW THUMBNAILS GRID */}
      {processedImages.length > 0 && (
        <div className="admin-preview-section">
          <div className="admin-preview-section-header">
            <div className="admin-preview-legend">
              <span className="legend-title">Prepared Visuals</span>
              <span className="legend-caption">
                First image or image marked with gold badge represents the primary Lookbook Cover.
              </span>
            </div>
            {uploadedUrls.length > 0 && (
              <span className="admin-upload-badge-success">
                <Check size={13} strokeWidth={2.5} />
                Uploaded to Server
              </span>
            )}
          </div>

          <div className="admin-preview-grid">
            {processedImages.map((img, index) => (
              <div
                key={img.id}
                className={`admin-preview-card ${img.isCover ? "card-is-cover" : ""}`}
              >
                {/* Lookbook Cover Badge */}
                {img.isCover && (
                  <div className="admin-cover-badge">
                    <Star size={11} fill="#090306" strokeWidth={0} />
                    <span>LOOKBOOK COVER</span>
                  </div>
                )}

                {/* Index Pill */}
                <div className="admin-index-pill">#{index + 1}</div>

                {/* Thumbnail Image */}
                <div className="admin-preview-image-wrap">
                  <img
                    src={img.previewUrl}
                    alt={img.originalName || `Visual ${index + 1}`}
                    className="admin-preview-img"
                  />
                </div>

                {/* Card Action Bar */}
                <div className="admin-preview-card-actions">
                  {!img.isCover ? (
                    <button
                      type="button"
                      className="admin-card-btn btn-make-cover"
                      onClick={() => handleMakeCover(img.id)}
                      title="Make this the Lookbook Cover"
                      disabled={disabled || isUploading}
                    >
                      <Star size={12} strokeWidth={2} />
                      <span>Make Cover</span>
                    </button>
                  ) : (
                    <div className="admin-card-cover-status">
                      <Star size={12} fill="#dfc28d" strokeWidth={0} />
                      <span>Primary Cover</span>
                    </div>
                  )}

                  <div className="admin-card-btn-group">
                    <button
                      type="button"
                      className="admin-card-btn btn-replace"
                      onClick={() => handleTriggerReplace(img.id)}
                      title="Replace image"
                      disabled={disabled || isUploading}
                    >
                      <RefreshCw size={12} strokeWidth={2} />
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      className="admin-card-btn btn-remove"
                      onClick={() => handleRemoveImage(img.id)}
                      title="Remove image"
                      disabled={disabled || isUploading}
                    >
                      <Trash2 size={12} strokeWidth={2} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD ACTION FOOTER */}
      <div className="admin-uploader-footer">
        <div className="admin-uploader-status">
          {processedImages.length === 0 ? (
            <span className="status-text muted">No images selected yet.</span>
          ) : processedImages.length < minImages ? (
            <span className="status-text warning">
              Add at least {minImages - processedImages.length} more image(s) to enable upload.
            </span>
          ) : (
            <span className="status-text success">
              {processedImages.length} image(s) prepared • Cover assigned • Ready to upload.
            </span>
          )}
        </div>

        <div className="admin-uploader-btn-wrap">
          {processedImages.length > 0 && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                processedImages.forEach((img) => {
                  if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(img.previewUrl);
                  }
                });
                setProcessedImages([]);
                setUploadedUrls([]);
              }}
              disabled={isUploading || disabled}
            >
              Clear All
            </button>
          )}

          <button
            type="button"
            className={`admin-btn-upload ${canUpload ? "btn-ready" : "btn-disabled"}`}
            onClick={handleUploadImages}
            disabled={!canUpload}
          >
            {isUploading ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Uploading Visuals ({uploadProgress}%)</span>
              </>
            ) : (
              <>
                <Upload size={14} strokeWidth={2} />
                <span>Upload Images ({processedImages.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CROPPING MODAL */}
      {croppingItem && (
        <div className="admin-crop-modal-overlay">
          <div className="admin-crop-modal">
            {/* Modal Header */}
            <div className="admin-crop-modal-header">
              <div className="admin-crop-title-group">
                <div className="admin-crop-badge">
                  <CropIcon size={12} strokeWidth={2.5} />
                  <span>
                    Refine Visual{" "}
                    {cropQueue.length > 0
                      ? `(${croppingItem.queueIndex} of ${croppingItem.totalQueue})`
                      : ""}
                  </span>
                </div>
                <h4 className="admin-crop-title">
                  Crop &amp; Refine Product Visual
                </h4>
                <p className="admin-crop-desc">
                  Adjust positioning and zoom for editorial framing.
                </p>
              </div>

              <button
                type="button"
                className="admin-crop-close-btn"
                onClick={handleCancelCrop}
                title="Cancel crop"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropper Container */}
            <div className="admin-crop-workspace">
              <Cropper
                image={croppingItem.rawUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
              />
            </div>

            {/* Modal Controls Toolbar */}
            <div className="admin-crop-toolbar">
              {/* Zoom Slider */}
              <div className="admin-crop-zoom-group">
                <span className="control-label">Zoom</span>
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                >
                  <ZoomOut size={14} />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="admin-crop-zoom-slider"
                />
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Aspect Ratio Options */}
              <div className="admin-crop-aspect-group">
                <span className="control-label">Framing</span>
                <button
                  type="button"
                  className={`aspect-btn ${aspect === 3 / 4 ? "aspect-active" : ""}`}
                  onClick={() => setAspect(3 / 4)}
                >
                  3:4 Lookbook
                </button>
                <button
                  type="button"
                  className={`aspect-btn ${aspect === 1 ? "aspect-active" : ""}`}
                  onClick={() => setAspect(1)}
                >
                  1:1 Square
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="admin-crop-modal-footer">
              <button
                type="button"
                className="admin-crop-btn-cancel"
                onClick={handleCancelCrop}
              >
                Cancel
              </button>

              <div className="admin-crop-btn-right">
                <button
                  type="button"
                  className="admin-crop-btn-skip"
                  onClick={handleSkipCrop}
                >
                  Use Original
                </button>
                <button
                  type="button"
                  className="admin-crop-btn-confirm"
                  onClick={handleConfirmCrop}
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>
                    Confirm Crop{" "}
                    {cropQueue.length > 0 ? `& Next (${cropQueue.length})` : ""}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductImageUploader;
