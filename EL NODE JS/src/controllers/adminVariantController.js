const mongoose = require("mongoose");
const Product = require("../models/Product");

const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL"];
const ALLOWED_STOCK_STATUS = ["in_stock", "out_of_stock", "low_stock"];
const ALLOWED_SORT = ["stock-desc", "stock-asc", "size-asc", "size-desc"];
const SIZE_ORDER = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };

/**
 * Utility to escape regex special characters
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * GET /api/admin/variants
 * Retrieve flattened variants across all non-deleted products with filtering, sorting, pagination, and catalog-wide summary.
 */
exports.getAllVariants = async (req, res) => {
  try {
    const { search, size, stockStatus, sort, page, limit } = req.query;

    // 1. Validate Pagination
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
        message: "Invalid pagination parameters.",
      });
    }

    // 2. Validate Query Filters
    if (size !== undefined && !ALLOWED_SIZES.includes(size.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid size filter. Allowed values: XS, S, M, L, XL.",
      });
    }

    if (
      stockStatus !== undefined &&
      !ALLOWED_STOCK_STATUS.includes(stockStatus.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stockStatus filter. Allowed values: in_stock, out_of_stock, low_stock.",
      });
    }

    if (sort !== undefined && !ALLOWED_SORT.includes(sort.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid sort parameter. Allowed values: stock-desc, stock-asc, size-asc, size-desc.",
      });
    }

    // 3. Global catalog-wide summary pipeline (across all non-deleted products)
    const summaryPipeline = [
      { $match: { isDeleted: false } },
      { $unwind: "$variants" },
      {
        $group: {
          _id: null,
          totalVariants: { $sum: 1 },
          totalUnits: { $sum: { $ifNull: ["$variants.stock", 0] } },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$variants.stock", 0] },
                    { $lte: ["$variants.stock", 5] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ["$variants.stock", 0] }, 1, 0],
            },
          },
        },
      },
    ];

    // 4. Construct Filtered Variants Pipeline
    const filteredPipeline = [
      { $match: { isDeleted: false } },
      { $unwind: "$variants" },
      {
        $lookup: {
          from: "category",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      {
        $unwind: {
          path: "$categoryDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          categoryName: {
            $cond: [
              {
                $and: [
                  { $ne: ["$categoryDoc", null] },
                  { $ne: ["$categoryDoc.isDeleted", true] },
                  { $ne: [{ $type: "$categoryDoc.name" }, "missing"] },
                ],
              },
              "$categoryDoc.name",
              "Uncategorized",
            ],
          },
          variantStatus: {
            $cond: [
              { $gt: ["$variants.stock", 5] },
              "in_stock",
              {
                $cond: [
                  { $gt: ["$variants.stock", 0] },
                  "low_stock",
                  "out_of_stock",
                ],
              },
            ],
          },
          sizeRank: {
            $indexOfArray: [ALLOWED_SIZES, "$variants.size"],
          },
        },
      },
    ];

    // Apply Filter Criteria
    const matchConditions = {};

    if (search && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      matchConditions.$or = [
        { "variants.color": { $regex: sanitized, $options: "i" } },
        { name: { $regex: sanitized, $options: "i" } },
        { brand: { $regex: sanitized, $options: "i" } },
      ];
    }

    if (size && typeof size === "string" && size.trim().length > 0) {
      matchConditions["variants.size"] = size.trim();
    }

    if (
      stockStatus &&
      typeof stockStatus === "string" &&
      stockStatus.trim().length > 0
    ) {
      const statusKey = stockStatus.trim();
      if (statusKey === "in_stock") {
        matchConditions["variants.stock"] = { $gt: 5 };
      } else if (statusKey === "low_stock") {
        matchConditions["variants.stock"] = { $gt: 0, $lte: 5 };
      } else if (statusKey === "out_of_stock") {
        matchConditions["variants.stock"] = 0;
      }
    }

    if (Object.keys(matchConditions).length > 0) {
      filteredPipeline.push({ $match: matchConditions });
    }

    // Sorting
    let sortStage = { "variants.stock": -1, _id: -1, "variants._id": -1 };
    const sortKey = sort ? sort.trim() : "stock-desc";

    if (sortKey === "stock-asc") {
      sortStage = { "variants.stock": 1, _id: 1, "variants._id": 1 };
    } else if (sortKey === "size-asc") {
      sortStage = {
        sizeRank: 1,
        "variants.stock": -1,
        _id: -1,
        "variants._id": -1,
      };
    } else if (sortKey === "size-desc") {
      sortStage = {
        sizeRank: -1,
        "variants.stock": -1,
        _id: -1,
        "variants._id": -1,
      };
    } else {
      // Default: stock-desc
      sortStage = { "variants.stock": -1, _id: -1, "variants._id": -1 };
    }
    filteredPipeline.push({ $sort: sortStage });

    // Pagination via $facet
    const skip = (pageNumber - 1) * limitNumber;
    filteredPipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        paginatedResults: [{ $skip: skip }, { $limit: limitNumber }],
      },
    });

    // Execute summary and filtered listing in parallel
    const [summaryResult, facetResult] = await Promise.all([
      Product.aggregate(summaryPipeline),
      Product.aggregate(filteredPipeline),
    ]);

    // Format global summary
    const summary = {
      totalVariants: summaryResult[0]?.totalVariants || 0,
      totalUnits: summaryResult[0]?.totalUnits || 0,
      lowStockCount: summaryResult[0]?.lowStockCount || 0,
      outOfStockCount: summaryResult[0]?.outOfStockCount || 0,
    };

    // Format paginated variants
    const totalFiltered = facetResult[0]?.totalCount[0]?.count || 0;
    const totalPages =
      totalFiltered === 0 ? 0 : Math.ceil(totalFiltered / limitNumber);
    const rawDocs = facetResult[0]?.paginatedResults || [];

    const variants = rawDocs.map((doc) => {
      const v = doc.variants;
      const variantObj = {
        id: v._id ? v._id.toString() : "",
        size: v.size,
        color: v.color,
        images: Array.isArray(v.images) ? v.images : [],
        stock: Number(v.stock) || 0,
        status: doc.variantStatus,
        product: {
          id: doc._id.toString(),
          name: doc.name,
          brand: doc.brand,
          price: doc.price,
          status: doc.status,
          category: doc.categoryName,
        },
      };

      if (doc.salePrice !== undefined && doc.salePrice !== null) {
        variantObj.product.salePrice = doc.salePrice;
      }

      return variantObj;
    });

    return res.status(200).json({
      success: true,
      variants,
      summary,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalVariants: totalFiltered,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Get all variants error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving variants.",
    });
  }
};

/**
 * GET /api/admin/products/:productId/variants
 * Retrieve variants for a specific product with filtering, sorting, pagination, and summary.
 */
exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const { search, size, stockStatus, sort, page, limit } = req.query;

    // 1. Validate Product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format.",
      });
    }

    // 2. Validate Pagination
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
        message: "Invalid pagination parameters.",
      });
    }

    // 3. Validate Query Filters
    if (size !== undefined && (!ALLOWED_SIZES.includes(size.trim()))) {
      return res.status(400).json({
        success: false,
        message: "Invalid size filter. Allowed values: XS, S, M, L, XL.",
      });
    }

    if (
      stockStatus !== undefined &&
      (!ALLOWED_STOCK_STATUS.includes(stockStatus.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stockStatus filter. Allowed values: in_stock, out_of_stock, low_stock.",
      });
    }

    if (sort !== undefined && !ALLOWED_SORT.includes(sort.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid sort parameter. Allowed values: stock-desc, stock-asc, size-asc, size-desc.",
      });
    }

    // 4. Find non-deleted Product
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    })
      .populate("categoryId", "name")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // 5. Full Dataset Summary Calculation
    const rawVariants = Array.isArray(product.variants) ? product.variants : [];
    const totalVariants = rawVariants.length;
    const totalUnits = rawVariants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );
    const lowStockCount = rawVariants.filter(
      (v) => Number(v.stock) > 0 && Number(v.stock) <= 5
    ).length;
    const outOfStockCount = rawVariants.filter(
      (v) => Number(v.stock) === 0
    ).length;

    // 6. Map and Filter Variants
    let filtered = rawVariants.map((v) => ({
      id: v._id ? v._id.toString() : "",
      size: v.size,
      color: v.color,
      images: Array.isArray(v.images) ? v.images : [],
      stock: Number(v.stock) || 0,
    }));

    // Search: by color (partial match, case-insensitive)
    if (search && typeof search === "string" && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((v) => v.color.toLowerCase().includes(q));
    }

    // Size filter
    if (size && typeof size === "string" && size.trim().length > 0) {
      const targetSize = size.trim();
      filtered = filtered.filter((v) => v.size === targetSize);
    }

    // Stock status filter
    if (stockStatus && typeof stockStatus === "string") {
      const statusKey = stockStatus.trim();
      if (statusKey === "in_stock") {
        filtered = filtered.filter((v) => v.stock > 0);
      } else if (statusKey === "out_of_stock") {
        filtered = filtered.filter((v) => v.stock === 0);
      } else if (statusKey === "low_stock") {
        filtered = filtered.filter((v) => v.stock > 0 && v.stock <= 5);
      }
    }

    // 7. Sort
    const sortKey = sort ? sort.trim() : "stock-desc";
    if (sortKey === "stock-asc") {
      filtered.sort((a, b) => a.stock - b.stock);
    } else if (sortKey === "size-asc") {
      filtered.sort(
        (a, b) => (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99)
      );
    } else if (sortKey === "size-desc") {
      filtered.sort(
        (a, b) => (SIZE_ORDER[b.size] || 99) - (SIZE_ORDER[a.size] || 99)
      );
    } else {
      // Default: stock-desc
      filtered.sort((a, b) => b.stock - a.stock);
    }

    // 8. Pagination
    const totalFiltered = filtered.length;
    const totalPages =
      totalFiltered === 0 ? 0 : Math.ceil(totalFiltered / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;
    const paginated = filtered.slice(skip, skip + limitNumber);

    // Format category string / name safely
    let categoryName = null;
    if (product.categoryId) {
      categoryName =
        typeof product.categoryId === "object"
          ? product.categoryId.name
          : product.categoryId;
    }

    return res.status(200).json({
      success: true,
      product: {
        id: product._id.toString(),
        name: product.name,
        brand: product.brand,
        category: categoryName,
        price: product.price,
        salePrice: product.salePrice,
        status: product.status,
      },
      summary: {
        totalVariants,
        totalUnits,
        lowStockCount,
        outOfStockCount,
      },
      variants: paginated,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalVariants: totalFiltered,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Get product variants error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving variants.",
    });
  }
};

/**
 * POST /api/admin/products/:productId/variants
 * Add a new variant to an existing product.
 */
exports.addProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, images, stock } = req.body;

    // 1. Validate Product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format.",
      });
    }

    // 2. Validate Size
    if (
      !size ||
      typeof size !== "string" ||
      !ALLOWED_SIZES.includes(size.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid size is required. Allowed values: XS, S, M, L, XL.",
      });
    }

    // 3. Validate Color
    if (
      !color ||
      typeof color !== "string" ||
      color.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Color is required and must be a non-empty string.",
      });
    }

    // 4. Validate Stock
    if (
      stock === undefined ||
      stock === null ||
      stock === "" ||
      isNaN(Number(stock)) ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be an integer greater than or equal to 0.",
      });
    }

    // 5. Validate Images
    if (images !== undefined) {
      if (
        !Array.isArray(images) ||
        !images.every((img) => typeof img === "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Images must be an array of strings.",
        });
      }
    }

    // 6. Find Product
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // 7. Check Duplicate Combination (case-insensitive for color, exact for size)
    const trimmedColor = color.trim().toLowerCase();
    const trimmedSize = size.trim();
    const isDuplicate = product.variants.some(
      (v) =>
        v.color.trim().toLowerCase() === trimmedColor &&
        v.size.trim() === trimmedSize
    );

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: `A variant with color '${color.trim()}' and size '${trimmedSize}' already exists for this product.`,
      });
    }

    // 8. Push Variant and Save Product
    product.variants.push({
      size: trimmedSize,
      color: color.trim(),
      stock: Number(stock),
      images: Array.isArray(images) ? images : [],
    });

    await product.save();

    const createdVariant = product.variants[product.variants.length - 1];

    return res.status(201).json({
      success: true,
      message: "Variant added successfully",
      variant: {
        id: createdVariant._id.toString(),
        size: createdVariant.size,
        color: createdVariant.color,
        images: createdVariant.images,
        stock: createdVariant.stock,
      },
    });
  } catch (error) {
    console.error("Add product variant error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while adding variant.",
    });
  }
};

/**
 * PATCH /api/admin/products/:productId/variants/:variantId
 * Edit an individual variant of a product.
 */
exports.editProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { size, color, images, stock } = req.body;

    // 1. Validate IDs
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format.",
      });
    }

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Variant ID format.",
      });
    }

    // 2. Validate at least one field provided
    if (
      size === undefined &&
      color === undefined &&
      images === undefined &&
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field to update must be provided.",
      });
    }

    // 3. Validate Individual Fields if provided
    if (size !== undefined) {
      if (
        typeof size !== "string" ||
        !ALLOWED_SIZES.includes(size.trim())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid size. Allowed values: XS, S, M, L, XL.",
        });
      }
    }

    if (color !== undefined) {
      if (typeof color !== "string" || color.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Color must be a non-empty string.",
        });
      }
    }

    if (stock !== undefined) {
      if (
        stock === null ||
        stock === "" ||
        isNaN(Number(stock)) ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Stock must be an integer greater than or equal to 0.",
        });
      }
    }

    if (images !== undefined) {
      if (
        !Array.isArray(images) ||
        !images.every((img) => typeof img === "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Images must be an array of strings.",
        });
      }
    }

    // 4. Find Product
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // 5. Find Variant subdocument
    const targetVariant = product.variants.id(variantId);
    if (!targetVariant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found.",
      });
    }

    // 6. Check Duplicate Combination against OTHER variants of this product
    const finalColor =
      color !== undefined ? color.trim() : targetVariant.color.trim();
    const finalSize =
      size !== undefined ? size.trim() : targetVariant.size.trim();

    const isDuplicateOther = product.variants.some(
      (v) =>
        v._id.toString() !== variantId.toString() &&
        v.color.trim().toLowerCase() === finalColor.toLowerCase() &&
        v.size.trim() === finalSize
    );

    if (isDuplicateOther) {
      return res.status(409).json({
        success: false,
        message: `A variant with color '${finalColor}' and size '${finalSize}' already exists for this product.`,
      });
    }

    // 7. Apply Updates & Save
    if (size !== undefined) targetVariant.size = finalSize;
    if (color !== undefined) targetVariant.color = finalColor;
    if (stock !== undefined) targetVariant.stock = Number(stock);
    if (images !== undefined) targetVariant.images = images;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      variant: {
        id: targetVariant._id.toString(),
        size: targetVariant.size,
        color: targetVariant.color,
        images: targetVariant.images,
        stock: targetVariant.stock,
      },
    });
  } catch (error) {
    console.error("Edit product variant error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while updating variant.",
    });
  }
};

/**
 * DELETE /api/admin/products/:productId/variants/:variantId
 * Delete a variant from a product, maintaining the constraint that at least one variant must remain.
 */
exports.deleteProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    // 1. Validate IDs
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format.",
      });
    }

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Variant ID format.",
      });
    }

    // 2. Find Product
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // 3. Find Variant
    const targetVariant = product.variants.id(variantId);
    if (!targetVariant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found.",
      });
    }

    // 4. Constraint Check: A product must ALWAYS retain at least one variant
    if (product.variants.length <= 1) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete the only remaining variant.",
      });
    }

    // 5. Remove Variant and Save Product
    product.variants.pull(variantId);
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Delete product variant error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while deleting variant.",
    });
  }
};
