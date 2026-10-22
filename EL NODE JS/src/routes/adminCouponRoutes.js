const express = require("express");
const router = express.Router();
const adminProtect = require("../middlewares/adminAuthMiddleware");

const {
  getAllCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} = require("../controllers/adminCouponController");

router.get("/", adminProtect, getAllCoupons);
router.post("/", adminProtect, createCoupon);
router.get("/:id", adminProtect, getCouponById);
router.put("/:id", adminProtect, updateCoupon);
router.patch("/:id/toggle", adminProtect, toggleCouponStatus);
router.delete("/:id", adminProtect, deleteCoupon);

module.exports = router;
