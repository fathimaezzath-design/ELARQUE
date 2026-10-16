const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../uploads/products");

// Ensure directory exists automatically
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Clean up helper to remove files if validation or request fails
const cleanupFiles = (req) => {
  const filesToDelete = new Set();

  if (Array.isArray(req._uploadedFilePaths)) {
    req._uploadedFilePaths.forEach((filePath) => {
      if (filePath) filesToDelete.add(filePath);
    });
  }

  if (Array.isArray(req.files)) {
    req.files.forEach((file) => {
      if (file && file.path) filesToDelete.add(file.path);
    });
  }

  filesToDelete.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Error cleaning up file:", filePath, err);
    }
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const finalName = `product-${uniqueSuffix}${ext}`;

    if (!req._uploadedFilePaths) {
      req._uploadedFilePaths = [];
    }
    req._uploadedFilePaths.push(path.join(uploadPath, finalName));

    cb(null, finalName);
  },
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Only JPG, JPEG, PNG, and WEBP image files are allowed."
    );
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 10, // Maximum 10 files
  },
});

const productUploadMiddleware = (req, res, next) => {
  req._uploadedFilePaths = [];

  const uploadHandler = upload.array("images", 10);

  uploadHandler(req, res, (err) => {
    if (err) {
      // Clean up any files that were already written to disk before failure
      cleanupFiles(req);

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size exceeds the 5 MB limit.",
          });
        }
        if (
          err.code === "LIMIT_FILE_COUNT" ||
          err.code === "LIMIT_UNEXPECTED_FILE"
        ) {
          return res.status(400).json({
            success: false,
            message: "Maximum 10 images can be uploaded per request.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (
        err.code === "INVALID_FILE_TYPE" ||
        err.message?.includes("Only JPG, JPEG, PNG, and WEBP")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload images.",
      });
    }

    // Validate image count constraints
    if (!req.files || req.files.length === 0) {
      cleanupFiles(req);
      return res.status(400).json({
        success: false,
        message: "No images provided. Please upload at least 3 images.",
      });
    }

    if (req.files.length < 3) {
      cleanupFiles(req);
      return res.status(400).json({
        success: false,
        message: `Minimum 3 images are required. You provided ${req.files.length}.`,
      });
    }

    if (req.files.length > 10) {
      cleanupFiles(req);
      return res.status(400).json({
        success: false,
        message: `Maximum 10 images allowed. You provided ${req.files.length}.`,
      });
    }

    next();
  });
};

module.exports = {
  productUploadMiddleware,
  cleanupFiles,
};
