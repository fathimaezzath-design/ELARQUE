const express = require("express");
const router = express.Router();
const { adminLogin, getDashboardStats } = require("../controllers/adminController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// Admin Login
router.post("/login", adminLogin);

// Admin Dashboard Stats (Protected)
router.get("/dashboard/stats", adminAuthMiddleware, getDashboardStats);

module.exports = router;
