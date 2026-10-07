const User = require("../models/User");

// Helper to escape regex special characters for safe MongoDB searches
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.getUsers = async (req, res) => {
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

    // 2. Build MongoDB Search Filter
    let filter = {};

    if (search && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      filter = {
        $or: [
          { fullName: { $regex: sanitized, $options: "i" } },
          { email: { $regex: sanitized, $options: "i" } },
          { phoneNumber: { $regex: sanitized, $options: "i" } },
        ],
      };
    }

    // 3. Database Queries: Count & Paginated Fetch
    const totalUsers = await User.countDocuments(filter);
    const totalPages = totalUsers === 0 ? 0 : Math.ceil(totalUsers / limitNumber);
    const skip = (pageNumber - 1) * limitNumber;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("_id fullName email phoneNumber createdAt isVerified isBlocked")
      .lean();

    // 4. Transform to Safe Public Representation
    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName || "",
      email: u.email || "",
      phoneNumber: u.phoneNumber || "",
      createdAt: u.createdAt,
      isVerified: Boolean(u.isVerified),
      isBlocked: Boolean(u.isBlocked),
    }));

    return res.status(200).json({
      users: safeUsers,
      totalUsers,
      totalPages,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Admin user listing error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving users.",
    });
  }
};
