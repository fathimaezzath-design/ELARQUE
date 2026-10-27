const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");

/**
 * Optional auth middleware:
 * Populates req.user if a valid token is provided, but allows guest access.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("isBlocked");
    if (user && !user.isBlocked) {
      req.user = {
        ...decoded,
        id: decoded.id,
        _id: decoded.id,
        userId: decoded.id,
      };
    }
  } catch (err) {
    // Ignore invalid/expired tokens for optional check
  }
  next();
};

// Public: Get all approved reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Eligibility check: checks whether the current client is eligible to review
router.get(
  "/product/:productId/eligibility",
  optionalAuth,
  reviewController.checkReviewEligibility
);

// Protected: Create a customer review (enforced by authMiddleware)
router.post(
  "/product/:productId",
  authMiddleware,
  reviewController.createProductReview
);

module.exports = router;
