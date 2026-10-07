const jwt = require("jsonwebtoken");

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Malformed authorization header. Bearer token required.",
      });
    }

    const token = authHeader.split(" ")[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the token contains an authorized administrator role
    const allowedRoles = ["admin", "superadmin"];

    if (!decoded.role || !allowedRoles.includes(decoded.role)) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Insufficient administrator privileges.",
      });
    }

    // Attach decoded admin identity to req.admin (strictly isolated from customer req.user)
    req.admin = {
      id: decoded.id,
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("ADMIN AUTH MIDDLEWARE ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token.",
    });
  }
};

module.exports = adminAuthMiddleware;
