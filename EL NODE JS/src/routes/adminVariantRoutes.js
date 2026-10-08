const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const {
  getAllVariants,
  getProductVariants,
  addProductVariant,
  editProductVariant,
  deleteProductVariant,
} = require("../controllers/adminVariantController");

// All-products variant listing: GET /api/admin/variants
router.get("/", adminAuthMiddleware, (req, res, next) => {
  if (req.baseUrl.endsWith("/products")) {
    return next();
  }
  return getAllVariants(req, res, next);
});
router.get("/variants", adminAuthMiddleware, getAllVariants);

// Nested product-scoped routes: /api/admin/products/:productId/variants
router.get("/:productId/variants", adminAuthMiddleware, getProductVariants);
router.post("/:productId/variants", adminAuthMiddleware, addProductVariant);
router.patch(
  "/:productId/variants/:variantId",
  adminAuthMiddleware,
  editProductVariant
);
router.delete(
  "/:productId/variants/:variantId",
  adminAuthMiddleware,
  deleteProductVariant
);

// Direct variant routes: /api/admin/variants/:productId
router.get("/:productId", adminAuthMiddleware, getProductVariants);
router.post("/:productId", adminAuthMiddleware, addProductVariant);
router.patch("/:productId/:variantId", adminAuthMiddleware, editProductVariant);
router.delete(
  "/:productId/:variantId",
  adminAuthMiddleware,
  deleteProductVariant
);

module.exports = router;
