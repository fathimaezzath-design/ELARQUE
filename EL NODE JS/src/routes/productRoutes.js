const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductFacets,
  getProductById,
} = require("../controllers/productController");

// GET /api/products/facets - Available filter facets and counts (Registered before /:id to prevent route conflict)
router.get("/facets", getProductFacets);

// GET /api/products - Search, filter, sort & paginate customer-visible products
router.get("/", getProducts);

// GET /api/products/:id - Single customer-visible product by ID with related products
router.get("/:id", getProductById);

module.exports = router;
