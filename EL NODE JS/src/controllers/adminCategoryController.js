const mongoose = require("mongoose");
const Category = require("../models/Category");

// Helper to escape regex special characters for safe regex matching
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    // 1. Category Name Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const trimmedName = name.trim();

    // 2. Status Validation
    let categoryStatus = "active";
    if (status !== undefined) {
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category status. Allowed values are 'active' or 'inactive'.",
        });
      }
      categoryStatus = status;
    }

    // 3. Duplicate Category Check (Case-insensitive & active only)
    const escapedName = escapeRegex(trimmedName);
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      isDeleted: false,
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    // 4. Create and Save Category
    const newCategory = new Category({
      name: trimmedName,
      description: typeof description === "string" ? description.trim() : "",
      image: typeof image === "string" ? image.trim() : "",
      status: categoryStatus,
      isDeleted: false,
    });

    await newCategory.save();

    // 5. Safe Response
    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: {
        id: newCategory._id.toString(),
        name: newCategory.name,
        description: newCategory.description,
        image: newCategory.image,
        status: newCategory.status,
        isDeleted: newCategory.isDeleted,
        createdAt: newCategory.createdAt,
        updatedAt: newCategory.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while creating the category.",
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

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

    // 2. Query Construction (Strictly active / non-deleted categories)
    const filter = {
      isDeleted: false,
    };

    if (search && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      filter.name = { $regex: sanitized, $options: "i" };
    }

    // 3. Database Execution: Count & Paginated Fetch
    const totalCategories = await Category.countDocuments(filter);
    const totalPages =
      totalCategories === 0 ? 0 : Math.ceil(totalCategories / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("_id name image description status isDeleted createdAt updatedAt")
      .lean();

    // 4. Safe Payload Formatting
    const safeCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      image: cat.image || "",
      description: cat.description || "",
      status: cat.status,
      isDeleted: Boolean(cat.isDeleted),
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      categories: safeCategories,
      totalCategories,
      totalPages,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while retrieving categories.",
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // 2. Find category (strictly non-deleted)
    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { name, description, image, status } = req.body;

    // 3. Name Validation & Duplicate Check
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty.",
        });
      }

      const trimmedName = name.trim();

      // Check for case-insensitive duplicate among active categories excluding current one
      const escapedName = escapeRegex(trimmedName);
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        isDeleted: false,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A category with this name already exists.",
        });
      }

      category.name = trimmedName;
    }

    // 4. Description Update
    if (description !== undefined) {
      category.description =
        typeof description === "string" ? description.trim() : "";
    }

    // 5. Image Update
    if (image !== undefined) {
      category.image = typeof image === "string" ? image.trim() : "";
    }

    // 6. Status Validation & Update
    if (status !== undefined) {
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category status. Allowed values are 'active' or 'inactive'.",
        });
      }
      category.status = status;
    }

    // 7. Save Category (automatically updates updatedAt timestamp)
    await category.save();

    // 8. Safe Response
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: {
        id: category._id.toString(),
        name: category.name,
        image: category.image || "",
        description: category.description || "",
        status: category.status,
        isDeleted: category.isDeleted,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while updating the category.",
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // 2. Find category (strictly non-deleted)
    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 3. Soft delete ONLY
    category.isDeleted = true;
    await category.save();

    // 4. Safe Response
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category: {
        id: category._id.toString(),
        name: category.name,
        image: category.image || "",
        description: category.description || "",
        status: category.status,
        isDeleted: category.isDeleted,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while deleting the category.",
    });
  }
};

