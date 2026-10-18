const express = require("express");
const router = express.Router();
const { getUsers, toggleBlockUser } = require("../controllers/adminUserController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// GET /api/admin/users - Protected admin user listing
router.get("/users", adminAuthMiddleware, getUsers);

// PATCH /api/admin/users/:id/block - Protected toggle block/unblock
router.patch("/users/:id/block", adminAuthMiddleware, toggleBlockUser);

module.exports = router;
