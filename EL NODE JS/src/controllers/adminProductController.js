const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { cleanupFiles } = require("../middlewares/productUploadMiddleware");

// Helper to escape regex special characters for safe regex matching
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      brand,
      price,
      salePrice,
      variants,
      isFeatured,
      isBestSeller,
      status,
    } = req.body;

    // 1. Validate required text fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product description is required.",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product brand is required.",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product price is required.",
      });
    }

    if (!variants) {
      return res.status(400).json({
        success: false,
        message: "Product variants are required.",
      });
    }

    // 2. Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID format.",
      });
    }

    // 3. Verify referenced category exists, is not deleted, and is active
    const category = await Category.findById(categoryId);
    if (!category || category.isDeleted || category.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Referenced category does not exist or is inactive/deleted.",
      });
    }

    // 4. Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than or equal to 0.",
      });
    }

    // 5. Validate salePrice (if supplied)
    let numericSalePrice = undefined;
    if (salePrice !== undefined && salePrice !== null && salePrice !== "") {
      numericSalePrice = Number(salePrice);
      if (isNaN(numericSalePrice) || numericSalePrice < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Sale price must be a valid number greater than or equal to 0.",
        });
      }
      if (numericSalePrice > numericPrice) {
        return res.status(400).json({
          success: false,
          message: "Sale price cannot be greater than regular price.",
        });
      }
    }

    // 6. Validate variants
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product variants must be a non-empty array.",
      });
    }

    const cleanedVariants = [];
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v || typeof v !== "object") {
        return res.status(400).json({
          success: false,
          message: `Variant at index ${i} is invalid.`,
        });
      }

      const { size, color, stock, images } = v;

      if (!size || typeof size !== "string" || size.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Variant at index ${i} must have a valid size.`,
        });
      }

      if (!color || typeof color !== "string" || color.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Variant at index ${i} must have a valid color.`,
        });
      }

      if (stock === undefined || stock === null || stock === "") {
        return res.status(400).json({
          success: false,
          message: `Variant at index ${i} must have a stock value.`,
        });
      }

      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return res.status(400).json({
          success: false,
          message: `Variant at index ${i} stock must be an integer greater than or equal to 0.`,
        });
      }

      let variantImages = [];
      if (images !== undefined) {
        if (!Array.isArray(images)) {
          return res.status(400).json({
            success: false,
            message: `Variant at index ${i} images must be an array of strings.`,
          });
        }
        const allStrings = images.every((img) => typeof img === "string");
        if (!allStrings) {
          return res.status(400).json({
            success: false,
            message: `Variant at index ${i} images must contain only strings.`,
          });
        }
        variantImages = images.map((img) => img.trim());
      }

      cleanedVariants.push({
        size: size.trim(),
        color: color.trim(),
        stock: numStock,
        images: variantImages,
      });
    }

    // 7. Validate status
    let productStatus = "active";
    if (status !== undefined) {
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product status. Allowed values are 'active' or 'inactive'.",
        });
      }
      productStatus = status;
    }

    // 8. Duplicate active product name check (case-insensitive)
    const trimmedName = name.trim();
    const escapedName = escapeRegex(trimmedName);
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      isDeleted: false,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }

    // 9. Create Product
    const newProduct = new Product({
      name: trimmedName,
      description: description.trim(),
      categoryId: category._id,
      brand: brand.trim(),
      price: numericPrice,
      salePrice: numericSalePrice !== undefined ? numericSalePrice : undefined,
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      status: productStatus,
      isDeleted: false,
      variants: cleanedVariants,
    });

    await newProduct.save();

    // 10. Return HTTP 201 safe response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        id: newProduct._id.toString(),
        name: newProduct.name,
        description: newProduct.description,
        categoryId: newProduct.categoryId.toString(),
        brand: newProduct.brand,
        price: newProduct.price,
        salePrice: newProduct.salePrice,
        variants: newProduct.variants.map((v) => ({
          _id: v._id ? v._id.toString() : undefined,
          size: v.size,
          color: v.color,
          images: v.images,
          stock: v.stock,
        })),
        isFeatured: newProduct.isFeatured,
        isBestSeller: newProduct.isBestSeller,
        status: newProduct.status,
        isDeleted: newProduct.isDeleted,
        createdAt: newProduct.createdAt,
        updatedAt: newProduct.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while creating the product.",
    });
  }
};

exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length < 3) {
      cleanupFiles(req);
      return res.status(400).json({
        success: false,
        message: "A minimum of 3 images is required.",
      });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );

    return res.status(201).json({
      success: true,
      message: "Product images uploaded successfully",
      images: imagePaths,
    });
  } catch (error) {
    cleanupFiles(req);
    console.error("Upload product images error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while uploading product images.",
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, page, limit, sort, category } = req.query;

    // 1. Pagination Validation
    const pageNumber = page !== undefined ? Number(page) : 1;
    const limitNumber = limit !== undefined ? Number(limit) : 10;

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. 'page' must be an integer >= 1 and 'limit' must be an integer between 1 and 100.",
      });
    }

    // 2. Query filter: strictly non-deleted products
    const filter = {
      isDeleted: false,
    };

    // Optional category filter if provided
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.categoryId = category;
    }

    // Search case-insensitively and partially by name or brand
    if (search && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = { $regex: sanitized, $options: "i" };
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
      ];
    }

    // 3. Sorting (default: newest first)
    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    } else if (sort === "updated-asc") {
      sortOption = { updatedAt: 1 };
    } else if (sort === "updated-desc") {
      sortOption = { updatedAt: -1 };
    } else if (sort === "created-asc") {
      sortOption = { createdAt: 1 };
    }

    // 4. Count & pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages =
      totalProducts === 0 ? 0 : Math.ceil(totalProducts / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    // 5. Fetch products with populated categoryId
    const products = await Product.find(filter)
      .populate({
        path: "categoryId",
        select: "_id name isDeleted status",
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // 6. Safe payload formatting
    const safeProducts = products.map((prod) => {
      const variants = Array.isArray(prod.variants) ? prod.variants : [];
      const totalStock = variants.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0
      );

      let categoryData = null;
      if (prod.categoryId && !prod.categoryId.isDeleted) {
        categoryData = {
          id: prod.categoryId._id.toString(),
          name: prod.categoryId.name,
        };
      }

      return {
        id: prod._id.toString(),
        name: prod.name,
        description: prod.description || "",
        brand: prod.brand,
        category: categoryData,
        price: prod.price,
        salePrice: prod.salePrice,
        status: prod.status,
        isFeatured: Boolean(prod.isFeatured),
        isBestSeller: Boolean(prod.isBestSeller),
        stock: totalStock,
        variantCount: variants.length,
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
          images: Array.isArray(v.images) ? v.images : [],
        })),
        createdAt: prod.createdAt,
        updatedAt: prod.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      products: safeProducts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving products.",
    });
  }
};


