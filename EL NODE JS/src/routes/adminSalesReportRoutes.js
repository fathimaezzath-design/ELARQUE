const express = require("express");
const router = express.Router();
const {
  getSalesReport,
  downloadSalesReport,
} = require("../controllers/salesReportController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// All sales-report routes require administrative privileges
router.use(adminAuthMiddleware);

// GET /api/admin/sales-report - Main sales report with KPIs, charts, tables
router.get("/", getSalesReport);

// GET /api/admin/sales-report/download - Download-ready flat data for PDF/Excel
router.get("/download", downloadSalesReport);

module.exports = router;
