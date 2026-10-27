const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const addressRoutes = require("./routes/addressRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const adminVariantRoutes = require("./routes/adminVariantRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminReturnRoutes = require("./routes/adminReturnRoutes");
const adminCouponRoutes = require("./routes/adminCouponRoutes");
const adminSalesReportRoutes = require("./routes/adminSalesReportRoutes");
const offerRoutes = require("./routes/offerRoutes");
const adminOfferRoutes = require("./routes/adminOfferRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from all origins (localhost, 127.0.0.1, mobile, tools)
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.use(express.json());
app.use(cookieParser());

// SERVE UPLOADS STATICALLY
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// AUTH ROUTES
app.use("/api/auth", authRoutes);

// PROFILE ROUTES
app.use("/api/profile", profileRoutes);

// ADDRESS ROUTES
app.use("/api/address", addressRoutes);
app.use("/api/addresses", addressRoutes);

// CUSTOMER PRODUCT ROUTES (PUBLIC)
app.use("/api/products", productRoutes);

// CLIENT REVIEW ROUTES (PUBLIC & PROTECTED)
app.use("/api/reviews", reviewRoutes);

// CART ROUTES (PROTECTED)
app.use("/api/cart", cartRoutes);

// ORDER ROUTES (PROTECTED)
app.use("/api/orders", orderRoutes);

// COUPON & OFFER ROUTES (PUBLIC / PROTECTED)
app.use("/api/coupons", couponRoutes);
app.use("/api/offers", offerRoutes);

// PAYMENT GATEWAY ROUTES (PROTECTED)
app.use("/api/payment", paymentRoutes);

// WALLET VAULT ROUTES (PROTECTED)
const walletRoutes = require("./routes/walletRoutes");
app.use("/api/wallet", walletRoutes);

// ADMIN ROUTES
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api/admin/products", adminVariantRoutes);
app.use("/api/admin/variants", adminVariantRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/returns", adminReturnRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/offers", adminOfferRoutes);
app.use("/api/admin/sales-report", adminSalesReportRoutes);

app.get("/", (req, res) => {
  res.send("Elarque Backend Running");
});

module.exports = app;