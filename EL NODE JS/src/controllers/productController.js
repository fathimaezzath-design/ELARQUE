const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL"];
const SIZE_ORDER = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };

const ALLOWED_SORT_MAP = {
  newest: { createdAt: -1 },
  "newest-first": { createdAt: -1 },
  "created-desc": { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-low": { price: 1 },
  "price-low-to-high": { price: 1 },
  "price-desc": { price: -1 },
  "price-high": { price: -1 },
  "price-high-to-low": { price: -1 },
  "name-asc": { name: 1 },
  "a-z": { name: 1 },
  "name-desc": { name: -1 },
  "z-a": { name: -1 },
};

/**
 * Utility to escape regex special characters for safe MongoDB pattern matching
 */
function escapeRegex(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Format a lean product document into a safe customer-facing representation
 */
function formatCustomerProduct(prod) {
  const variants = Array.isArray(prod.variants) ? prod.variants : [];
  const totalStock = variants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

  // Collect all unique images across variants
  const allImages = [];
  variants.forEach((v) => {
    if (Array.isArray(v.images)) {
      v.images.forEach((img) => {
        if (img && typeof img === "string" && !allImages.includes(img)) {
          allImages.push(img);
        }
      });
    }
  });

  const coverImage = allImages.length > 0 ? allImages[0] : null;

  // Calculate discount percentage if sale price is valid and lower than regular price
  let discountPercentage = null;
  if (
    prod.salePrice !== undefined &&
    prod.salePrice !== null &&
    Number(prod.salePrice) < Number(prod.price) &&
    Number(prod.price) > 0
  ) {
    discountPercentage = Math.round(
      ((Number(prod.price) - Number(prod.salePrice)) / Number(prod.price)) * 100
    );
  }

  // Collect available unique sizes & colors
  const availableSizes = [
    ...new Set(
      variants
        .map((v) => (v.size || "").trim().toUpperCase())
        .filter((s) => ALLOWED_SIZES.includes(s))
    ),
  ].sort((a, b) => (SIZE_ORDER[a] || 99) - (SIZE_ORDER[b] || 99));

  const availableColors = [
    ...new Set(
      variants.map((v) => (v.color || "").trim()).filter(Boolean)
    ),
  ];

  let categoryData = null;
  if (prod.categoryId && !prod.categoryId.isDeleted && prod.categoryId.status === "active") {
    categoryData = {
      id: prod.categoryId._id ? prod.categoryId._id.toString() : prod.categoryId.toString(),
      _id: prod.categoryId._id ? prod.categoryId._id.toString() : prod.categoryId.toString(),
      name: prod.categoryId.name || "",
    };
  }

  return {
    id: prod._id.toString(),
    _id: prod._id.toString(),
    name: prod.name || "",
    description: prod.description || "",
    brand: prod.brand || "",
    category: categoryData,
    categoryId: categoryData ? categoryData.id : null,
    price: Number(prod.price) || 0,
    salePrice:
      prod.salePrice !== undefined && prod.salePrice !== null
        ? Number(prod.salePrice)
        : null,
    discountPercentage,
    isFeatured: Boolean(prod.isFeatured),
    isBestSeller: Boolean(prod.isBestSeller),
    coverImage,
    images: allImages,
    stock: totalStock,
    inStock: totalStock > 0,
    sizes: availableSizes,
    colors: availableColors,
    variants: variants.map((v) => ({
      id: v._id ? v._id.toString() : undefined,
      _id: v._id ? v._id.toString() : undefined,
      size: (v.size || "").trim().toUpperCase(),
      color: (v.color || "").trim(),
      stock: Number(v.stock) || 0,
      images: Array.isArray(v.images) ? v.images : [],
    })),
    createdAt: prod.createdAt,
    updatedAt: prod.updatedAt,
  };
}

/**
 * GET /api/products
 * Public endpoint to retrieve customer-visible products with search, multi-faceted filtering, sorting & pagination.
 * Excludes soft-deleted products, inactive products, and products belonging to deleted or inactive categories.
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      size,
      brand,
      sort,
      page,
      limit,
    } = req.query;

    // 1. Validate Pagination
    const pageNumber = page !== undefined ? Number(page) : 1;
    const limitNumber = limit !== undefined ? Number(limit) : 12;

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

    // 2. Fetch all active, non-deleted categories to guarantee category integrity
    const activeCategories = await Category.find({
      isDeleted: false,
      status: "active",
    })
      .select("_id name")
      .lean();

    if (!activeCategories || activeCategories.length === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        pagination: {
          currentPage: pageNumber,
          totalPages: 0,
          totalProducts: 0,
          limit: limitNumber,
        },
      });
    }

    const activeCategoryIds = activeCategories.map((c) => c._id);
    let targetCategoryIds = [...activeCategoryIds];

    // 3. Category Filter Validation & Mapping
    if (category !== undefined && typeof category === "string" && category.trim().length > 0) {
      const categoryInputs = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const matchedIds = [];
      for (const input of categoryInputs) {
        if (mongoose.Types.ObjectId.isValid(input)) {
          const match = activeCategories.find(
            (c) => c._id.toString() === input
          );
          if (match) matchedIds.push(match._id);
        } else {
          // Match by name case-insensitively
          const match = activeCategories.find(
            (c) => c.name.toLowerCase() === input.toLowerCase()
          );
          if (match) matchedIds.push(match._id);
        }
      }

      // If user specified categories that do not exist or are inactive, return empty results immediately
      if (matchedIds.length === 0) {
        return res.status(200).json({
          success: true,
          products: [],
          pagination: {
            currentPage: pageNumber,
            totalPages: 0,
            totalProducts: 0,
            limit: limitNumber,
          },
        });
      }

      targetCategoryIds = matchedIds;
    }

    // 4. Construct Core Filter
    const filter = {
      isDeleted: false,
      status: "active",
      categoryId: { $in: targetCategoryIds },
    };

    // 5. Search Filter (Safe case-insensitive partial match on name or brand)
    if (search !== undefined && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = { $regex: sanitized, $options: "i" };
      filter.$or = [{ name: searchRegex }, { brand: searchRegex }];
    }

    // 6. Price Bounds Validation & Filtering
    const priceFilter = {};
    if (minPrice !== undefined && minPrice !== "") {
      const numMin = Number(minPrice);
      if (isNaN(numMin) || numMin < 0) {
        return res.status(400).json({
          success: false,
          message: "minPrice must be a valid number greater than or equal to 0.",
        });
      }
      priceFilter.$gte = numMin;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const numMax = Number(maxPrice);
      if (isNaN(numMax) || numMax < 0) {
        return res.status(400).json({
          success: false,
          message: "maxPrice must be a valid number greater than or equal to 0.",
        });
      }
      if (priceFilter.$gte !== undefined && numMax < priceFilter.$gte) {
        return res.status(400).json({
          success: false,
          message: "maxPrice cannot be less than minPrice.",
        });
      }
      priceFilter.$lte = numMax;
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    // 7. Size Filter Validation & Filtering
    if (size !== undefined && typeof size === "string" && size.trim().length > 0) {
      const requestedSizes = size
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const invalidSizes = requestedSizes.filter(
        (s) => !ALLOWED_SIZES.includes(s)
      );
      if (invalidSizes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid size filter: ${invalidSizes.join(
            ", "
          )}. Allowed sizes: ${ALLOWED_SIZES.join(", ")}.`,
        });
      }

      filter["variants.size"] = { $in: requestedSizes };
    }

    // 8. Brand Filter Validation & Filtering
    if (brand !== undefined && typeof brand === "string" && brand.trim().length > 0) {
      const brandsList = brand
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);

      if (brandsList.length === 1) {
        const escapedBrand = escapeRegex(brandsList[0]);
        filter.brand = { $regex: new RegExp(`^${escapedBrand}$`, "i") };
      } else if (brandsList.length > 1) {
        filter.brand = {
          $in: brandsList.map((b) => new RegExp(`^${escapeRegex(b)}$`, "i")),
        };
      }
    }

    // 9. Sort Validation & Option Mapping
    let sortOption = { createdAt: -1 };
    if (sort !== undefined && typeof sort === "string" && sort.trim().length > 0) {
      const normalizedSort = sort.trim().toLowerCase();
      if (!ALLOWED_SORT_MAP[normalizedSort]) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sort option. Allowed values: newest, price-asc, price-desc, name-asc, name-desc.",
        });
      }
      sortOption = ALLOWED_SORT_MAP[normalizedSort];
    }

    // 10. Execute Query with Count & Pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages =
      totalProducts === 0 ? 0 : Math.ceil(totalProducts / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filter)
      .populate({
        path: "categoryId",
        select: "_id name isDeleted status",
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const formattedProducts = products.map(formatCustomerProduct);

    return res.status(200).json({
      success: true,
      products: formattedProducts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Public getProducts error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving products.",
    });
  }
};

/**
 * GET /api/products/facets
 * Public endpoint to retrieve dynamic customer filter options and accurate product counts.
 * Returns active non-deleted categories with product counts, available price bounds, sizes, and brands.
 */
exports.getProductFacets = async (req, res) => {
  try {
    // 1. Fetch active, non-deleted categories
    const activeCategories = await Category.find({
      isDeleted: false,
      status: "active",
    })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    const activeCategoryIds = activeCategories.map((c) => c._id);

    // Core match strictly for customer-eligible products
    const baseMatch = {
      isDeleted: false,
      status: "active",
      categoryId: { $in: activeCategoryIds },
    };

    const totalEligibleProducts = await Product.countDocuments(baseMatch);

    // 2. Aggregate Product counts by Category
    const categoryCountsAgg = await Product.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    categoryCountsAgg.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const categoryFacets = activeCategories.map((cat) => ({
      id: cat._id.toString(),
      _id: cat._id.toString(),
      name: cat.name,
      count: countMap.get(cat._id.toString()) || 0,
    }));

    // 3. Aggregate Price Bounds (min & max price among eligible products)
    const priceStats = await Product.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    const minPrice =
      priceStats.length > 0 && priceStats[0].minPrice !== null
        ? priceStats[0].minPrice
        : 0;
    const maxPrice =
      priceStats.length > 0 && priceStats[0].maxPrice !== null
        ? priceStats[0].maxPrice
        : 0;

    // 4. Aggregate Available Sizes across variants with product counts
    const sizeStats = await Product.aggregate([
      { $match: baseMatch },
      { $unwind: "$variants" },
      {
        $group: {
          _id: "$variants.size",
          productIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          size: "$_id",
          count: { $size: "$productIds" },
        },
      },
    ]);

    const sizeFacets = sizeStats
      .filter((s) => s.size && ALLOWED_SIZES.includes(s.size.trim().toUpperCase()))
      .map((s) => ({
        size: s.size.trim().toUpperCase(),
        count: s.count,
      }))
      .sort((a, b) => (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99));

    // Ensure all standard sizes are represented in facets for clean UI filters
    const finalSizes = ALLOWED_SIZES.map((sizeName) => {
      const match = sizeFacets.find((sf) => sf.size === sizeName);
      return {
        size: sizeName,
        count: match ? match.count : 0,
      };
    });

    // 5. Aggregate Available Brands with product counts
    const brandStats = await Product.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const brandFacets = brandStats
      .filter((b) => b._id && typeof b._id === "string" && b._id.trim().length > 0)
      .map((b) => ({
        name: b._id.trim(),
        count: b.count,
      }));

    return res.status(200).json({
      success: true,
      facets: {
        totalProducts: totalEligibleProducts,
        categories: categoryFacets,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        sizes: finalSizes,
        brands: brandFacets,
      },
    });
  } catch (error) {
    console.error("Public getProductFacets error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while retrieving product facets.",
    });
  }
};

/**
 * GET /api/products/:id
 * Public endpoint to retrieve single product details and related silhouettes.
 * Excludes soft-deleted products, inactive products, or products with inactive/deleted categories.
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate MongoDB ObjectId format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID format.",
      });
    }

    // 2. Find eligible product with populated category
    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
      status: "active",
    })
      .populate({
        path: "categoryId",
        select: "_id name isDeleted status",
      })
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently unavailable.",
      });
    }

    // 3. Exclude if parent category is deleted, inactive, or missing
    if (
      !product.categoryId ||
      product.categoryId.isDeleted ||
      product.categoryId.status !== "active"
    ) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently unavailable.",
      });
    }

    const formattedProduct = formatCustomerProduct(product);

    // 4. Fetch related eligible products (prefer same category, excluding self)
    let relatedProducts = await Product.find({
      _id: { $ne: product._id },
      categoryId: product.categoryId._id,
      isDeleted: false,
      status: "active",
    })
      .populate({
        path: "categoryId",
        select: "_id name isDeleted status",
      })
      .sort({ isFeatured: -1, isBestSeller: -1, createdAt: -1 })
      .limit(4)
      .lean();

    // If fewer than 4 in same category, supplement with other active products in active categories
    if (relatedProducts.length < 4) {
      const activeCategories = await Category.find({
        isDeleted: false,
        status: "active",
      })
        .select("_id")
        .lean();
      const activeCatIds = activeCategories.map((c) => c._id);

      const excludeIds = [product._id, ...relatedProducts.map((p) => p._id)];
      const supplement = await Product.find({
        _id: { $nin: excludeIds },
        categoryId: { $in: activeCatIds },
        isDeleted: false,
        status: "active",
      })
        .populate({
          path: "categoryId",
          select: "_id name isDeleted status",
        })
        .sort({ isFeatured: -1, isBestSeller: -1, createdAt: -1 })
        .limit(4 - relatedProducts.length)
        .lean();

      relatedProducts = [...relatedProducts, ...supplement];
    }

    const formattedRelated = relatedProducts.map(formatCustomerProduct);

    return res.status(200).json({
      success: true,
      product: formattedProduct,
      relatedProducts: formattedRelated,
    });
  } catch (error) {
    console.error("Public getProductById error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while retrieving product details.",
    });
  }
};
