const express = require("express");
const router = express.Router();
const {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getOfferTargets,
} = require("../controllers/adminOfferController");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

// All admin offer routes require admin authentication
router.use(adminAuthMiddleware);

router.get("/targets", getOfferTargets);
router.get("/", getOffers);
router.get("/:id", getOfferById);
router.post("/", createOffer);
router.put("/:id", updateOffer);
router.delete("/:id", deleteOffer);
router.patch("/:id/toggle", toggleOfferStatus);

module.exports = router;
