const express = require("express");
const router = express.Router();
const {
  getReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
  handleQuickReturnAction,
} = require("../controllers/adminReturnController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// All admin return management routes require admin authentication
router.use(adminAuthMiddleware);

// GET /api/admin/returns - List, search, filter, sort and summary statistics
router.get("/", getReturnRequests);

// GET /api/admin/returns/:id - Single return request dossier
router.get("/:id", getReturnRequestById);

// PATCH /api/admin/returns/:id/status - Disposition update form
router.patch("/:id/status", updateReturnStatus);

// PATCH /api/admin/returns/:id/action - Quick Approve / Reject modal action
router.patch("/:id/action", handleQuickReturnAction);

module.exports = router;
