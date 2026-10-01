const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");

const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// Add Address
router.post("/", protect, addAddress);

// Get All Addresses
router.get("/", protect, getAddresses);

// Update Address
router.put("/:id", protect, updateAddress);

// Delete Address
router.delete("/:id", protect, deleteAddress);

// setdefault Address
router.patch("/:id/default", protect, setDefaultAddress);

module.exports = router;