const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

// GET /api/wallet - Get Wallet Vault Data
exports.getWalletData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("fullName email phoneNumber wallet createdAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Default balance if not set
    let balance = typeof user.wallet === "number" ? user.wallet : 0;

    // Find pending returns for this user
    const ordersWithReturns = await Order.find({
      user: userId,
      returnStatus: { $in: ["Requested", "Pending", "Approved", "Picked Up"] },
    }).sort({ updatedAt: -1 });

    let pendingRefundAmount = 0;
    let activeRefundTracker = null;

    if (ordersWithReturns.length > 0) {
      // Sum up pending amounts
      for (const ord of ordersWithReturns) {
        pendingRefundAmount += Number(ord.totalAmount) || 0;
      }

      const latestOrd = ordersWithReturns[0];
      const stepMapping = {
        Requested: 1,
        Pending: 1,
        Approved: 2,
        "Picked Up": 3,
        Completed: 4,
      };
      const currentStep = stepMapping[latestOrd.returnStatus] || 3;

      activeRefundTracker = {
        orderNumber: latestOrd.orderNumber || "ELQ-2026-45821",
        orderId: latestOrd._id,
        title:
          latestOrd.items?.[0]?.productName
            ? `${latestOrd.items[0].productName} Size Adjustment Cancellation`
            : "Blazer Dress Atelier Size Adjustment Cancellation",
        expectedAmount: latestOrd.totalAmount || 4999,
        currentStep,
        steps: [
          {
            number: 1,
            label: "INITIATED & REGISTERED",
            status: currentStep >= 1 ? "COMPLETE" : "PENDING",
            date: "20 Jul 2026, 02:45 PM - Salon Support Desk",
          },
          {
            number: 2,
            label: "ATELIER VERIFIED",
            status: currentStep >= 2 ? "COMPLETE" : currentStep === 1 ? "IN PROGRESS" : "PENDING",
            date: "21 Jul 2026, 11:30 AM - Dallas Quality Intake",
          },
          {
            number: 3,
            label: "PROCESSING CLEARANCE",
            status: currentStep === 3 ? "IN PROGRESS" : currentStep > 3 ? "COMPLETE" : "PENDING",
            date: "Currently with Central Atelier Clearing Bureau",
            desc: "Authorization token dispatched to client bank network",
          },
          {
            number: 4,
            label: "WALLET REMITTANCE COMPLETED",
            status: currentStep === 4 ? "COMPLETE" : "PENDING",
            date: "Estimated Arrival: 26 Jul 2026 - Immediate usable funds",
          },
        ],
      };
    } else {
      pendingRefundAmount = 0;
      activeRefundTracker = null;
    }

    // Retrieve real transactions for this user
    const transactions = await WalletTransaction.find({ user: userId }).sort({ date: -1, createdAt: -1 });

    const vaultId = `VLT-${user._id.toString().slice(-5).toUpperCase()}-SWL`;

    const paymentMethods = [
      {
        id: "pm_1",
        type: "card",
        cardType: "Visa",
        last4: "4587",
        expiry: "08/29",
        issuer: "Private Client Bank",
        isDefault: true,
      },
      {
        id: "pm_2",
        type: "upi",
        provider: "RazorPay",
        vpa: "swaliha@okaxis",
        isVerified: true,
      },
    ];

    res.status(200).json({
      success: true,
      vault: {
        vaultId,
        balance,
        pendingRefundAmount,
        userName: user.fullName || "Swaliha Ezzath",
        userEmail: user.email || "swaliha@elarque.com",
        activeRefundTracker,
        paymentMethods,
        transactions,
      },
    });
  } catch (error) {
    console.error("Get Wallet Data Error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve wallet data" });
  }
};

// POST /api/wallet/topup - Direct / Instant Top-Up
exports.topupWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentInstrument = "Razorpay", referenceId } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum wallet top-up allocation is ₹100.",
      });
    }

    if (numAmount > 100000) {
      return res.status(400).json({
        success: false,
        message: "Maximum wallet top-up allocation is ₹1,00,000 per transaction.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const previousBalance = typeof user.wallet === "number" ? user.wallet : 0;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: numAmount } },
      { new: true }
    );
    const newBalance = updatedUser.wallet;

    const txId = referenceId || `TXN-ELQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx = await WalletTransaction.create({
      user: userId,
      transactionId: txId,
      type: "CREDIT",
      amount: numAmount,
      title: "Patron Vault Refill",
      description: `Instant Allocation via ${paymentInstrument}`,
      status: "COMPLETED",
      paymentRail: paymentInstrument,
      referenceProtocol: "ELG-VLT-RESERVE-2026",
      date: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Funds successfully allocated to your Patron Wallet Vault.",
      previousBalance,
      addedAmount: numAmount,
      newBalance,
      transaction: newTx,
      paymentRail: paymentInstrument,
      protocolTag: `ELQ-VLT-${txId}-IND`,
    });
  } catch (error) {
    console.error("Top-Up Wallet Error:", error);
    res.status(500).json({ success: false, message: "Failed to process wallet top-up" });
  }
};

// POST /api/wallet/create-razorpay-topup
exports.createTopupRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 100) {
      return res.status(400).json({ success: false, message: "Minimum allocation is ₹100." });
    }

    const amountInPaise = Math.round(numAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `wlt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: order.id,
      amount: numAmount,
      amountInPaise,
    });
  } catch (err) {
    console.error("Create Razorpay Topup Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to initialize payment gateway for wallet topup.",
    });
  }
};

// POST /api/wallet/verify-topup
exports.verifyTopupPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, paymentInstrument = "Razorpay" } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing required payment verification fields." });
    }

    // Verify signature first (cryptographic check)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not set in environment.");
      return res.status(500).json({ success: false, message: "Payment gateway not configured correctly." });
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment authorization signature." });
    }

    // --- IDEMPOTENCY GUARD ---
    // Prevent double-credit if verify is called more than once for the same payment
    const txId = `TXN-ELQ-${razorpayPaymentId.slice(-6).toUpperCase()}`;
    const existingTx = await WalletTransaction.findOne({ transactionId: txId });
    if (existingTx) {
      // Already processed — return success with current balance without crediting again
      const user = await User.findById(userId).select("wallet");
      return res.status(200).json({
        success: true,
        message: "Payment already verified and credited to your wallet.",
        previousBalance: (user?.wallet ?? 0) - Number(amount || 0),
        addedAmount: Number(amount || 0),
        newBalance: user?.wallet ?? 0,
        transaction: existingTx,
        paymentRail: paymentInstrument,
        alreadyProcessed: true,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const previousBalance = typeof user.wallet === "number" ? user.wallet : 0;
    const numAmount = Number(amount) || 0;

    if (numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: numAmount } },
      { new: true }
    );
    const newBalance = updatedUser.wallet;

    const newTx = await WalletTransaction.create({
      user: userId,
      transactionId: txId,
      type: "CREDIT",
      amount: numAmount,
      title: "Patron Vault Refill",
      description: `Razorpay Settlement (#${razorpayPaymentId})`,
      status: "COMPLETED",
      paymentRail: paymentInstrument,
      referenceProtocol: "ELG-VLT-RESERVE-2026",
      date: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Funds successfully allocated to your Patron Wallet Vault.",
      previousBalance,
      addedAmount: numAmount,
      newBalance,
      transaction: newTx,
      paymentRail: paymentInstrument,
    });
  } catch (error) {
    console.error("Verify Topup Error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};
