const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const path = require("path");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const addressRoutes = require("./routes/addressRoutes");

const app = express();

app.use(cors());

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


app.get("/", (req, res) => {
  res.send("Elarque Backend Running");
});

module.exports = app;