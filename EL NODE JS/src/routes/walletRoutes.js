const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, walletController.getWalletData);
router.post("/topup", authMiddleware, walletController.topupWallet);
router.post("/create-razorpay-topup", authMiddleware, walletController.createTopupRazorpayOrder);
router.post("/verify-topup", authMiddleware, walletController.verifyTopupPayment);

module.exports = router;