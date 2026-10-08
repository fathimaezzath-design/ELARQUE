const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

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
