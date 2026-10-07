const express = require("express");
const router = express.Router();
const { getUsers } = require("../controllers/adminUserController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// GET /api/admin/users - Protected admin user listing
router.get("/users", adminAuthMiddleware, getUsers);

module.exports = router;
