const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Address = require("../models/Address");

/**
 * Helper to query a customer's valid, qualifying purchase for a specific product.
 * A qualifying order must:
 *  1. Belong to the user
 *  2. Not be cancelled or returned at the order level
 *  3. Contain the specific product with an item status that is not cancelled or returned
 *  4. Not be an unpaid/failed transaction (paymentStatus cannot be Failed or Refunded)
 *  5. Be Paid, Delivered, or an active COD order (Placed, Confirmed, Processing, Shipped, Delivered)
 */
async function findQualifyingOrder(userId, productId) {
  return await Order.findOne({
    user: userId,
    orderStatus: { $nin: ["Cancelled", "Returned"] },
    paymentStatus: { $nin: ["Failed", "Refunded"] },
    items: {
      $elemMatch: {
        product: productId,
        itemStatus: { $nin: ["Cancelled", "Returned"] },
      },
    },
    $or: [
      { paymentStatus: "Paid" },
      { orderStatus: "Delivered" },
      {
        paymentMethod: "COD",
        orderStatus: { $in: ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"] },
      },
    ],
  }).sort({ createdAt: -1 });
}

/**
 * GET /api/reviews/product/:productId
 * Fetch all approved customer reviews for a given product
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product identifier.",
      });
    }

    const reviews = await Review.find({
      product: productId,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email");

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
            totalReviews
          ).toFixed(1)
        : "5.0";

    return res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalReviews,
        averageRating: Number(averageRating),
      },
    });
  } catch (error) {
    console.error("GET PRODUCT REVIEWS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reviews.",
      error: error.message,
    });
  }
};

/**
 * GET /api/reviews/product/:productId/eligibility
 * Check if the currently viewing client is eligible to review this product
 */
exports.checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product identifier.",
      });
    }

    // Verify product exists in salon catalog
    const product = await Product.findById(productId).select("_id name");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable in the salon catalog.",
      });
    }

    // Unauthenticated guest visitor
    if (!userId) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        canReview: false,
        hasPurchased: false,
        alreadyReviewed: false,
        message: "Please log in to your atelier account to share a review.",
      });
    }

    // Check if customer already submitted a review
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    // Check if customer has a valid qualifying purchase
    const qualifyingOrder = await findQualifyingOrder(userId, productId);

    const hasPurchased = Boolean(qualifyingOrder);
    const alreadyReviewed = Boolean(existingReview);
    const canReview = hasPurchased && !alreadyReviewed;

    let message = "";
    if (!hasPurchased) {
      message = "Purchase this product to share your review.";
    } else if (alreadyReviewed) {
      message = "You have already reviewed this silhouette. Thank you for your feedback.";
    } else {
      message = "You are eligible to review this verified purchase.";
    }

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      canReview,
      hasPurchased,
      alreadyReviewed,
      existingReview: existingReview || null,
      orderId: qualifyingOrder ? qualifyingOrder._id : null,
      message,
    });
  } catch (error) {
    console.error("CHECK REVIEW ELIGIBILITY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify review eligibility.",
      error: error.message,
    });
  }
};

/**
 * POST /api/reviews/product/:productId
 * Submit a customer review (Protected by authMiddleware)
 * Strictly enforces that only patrons with a verified purchase can review.
 */
exports.createProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // 1. Authentication Check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be authenticated to submit a review.",
      });
    }

    // 2. Validate Product Identifier & Product Existence
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product identifier.",
      });
    }

    const product = await Product.findById(productId).select("_id name");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable in the salon catalog.",
      });
    }

    const { rating, title, comment, impressions, size, fit } = req.body;

    // 3. Validation: Rating & Comment
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide an experiential rating between 1 and 5 stars.",
      });
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Please provide your atelier impression text (minimum 3 characters).",
      });
    }

    // 4. Duplicate Prevention: 1 review per customer per product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already shared a review for this silhouette.",
      });
    }

    // 5. Strict Purchase Eligibility Enforcement
    const qualifyingOrder = await findQualifyingOrder(userId, productId);

    if (!qualifyingOrder) {
      return res.status(403).json({
        success: false,
        message: "You can only write a review for products you have purchased.",
      });
    }

    // 6. User details & location resolution
    const userDoc = await User.findById(userId).select("fullName email");
    const userName = userDoc?.fullName || "Salon Patron";

    let userLocation = "Paris, France";
    if (qualifyingOrder?.shippingAddress?.city) {
      userLocation = `${qualifyingOrder.shippingAddress.city}, ${
        qualifyingOrder.shippingAddress.country || "France"
      }`;
    } else {
      const userAddr = await Address.findOne({ user: userId, isDefault: true });
      if (userAddr?.city) {
        userLocation = `${userAddr.city}, ${userAddr.country || "France"}`;
      }
    }

    // 7. Extract size/variant from customer's order if not passed
    let purchasedSize = size || "";
    if (!purchasedSize && qualifyingOrder) {
      const matchedItem = qualifyingOrder.items?.find(
        (i) => String(i.product) === String(productId)
      );
      if (matchedItem?.variant?.size) {
        purchasedSize = matchedItem.variant.size;
      }
    }

    const selectedImpressions = Array.isArray(impressions) ? impressions : [];
    const derivedFit =
      fit ||
      (selectedImpressions.includes("Perfect Fit")
        ? "True to Size"
        : selectedImpressions.includes("Comfortable")
        ? "Relaxed Fit"
        : "Atelier Fit");

    const derivedTitle =
      (title && title.trim()) ||
      (selectedImpressions.length > 0 ? selectedImpressions[0] : "Exceptional Sartorial Craft");

    // 8. Create and persist review in MongoDB
    const newReview = await Review.create({
      product: productId,
      user: userId,
      order: qualifyingOrder._id,
      rating: numRating,
      title: derivedTitle,
      comment: comment.trim(),
      impressions: selectedImpressions,
      userName,
      userLocation,
      size: purchasedSize,
      fit: derivedFit,
      isVerifiedPurchase: true,
      status: "approved",
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your verified patron review has been recorded.",
      review: newReview,
    });
  } catch (error) {
    console.error("CREATE PRODUCT REVIEW ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already shared a review for this silhouette.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to record your review. Please try again.",
      error: error.message,
    });
  }
};
