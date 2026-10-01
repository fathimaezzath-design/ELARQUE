const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(cookieParser());


// AUTH ROUTES
app.use("/api/auth", authRoutes);


// PROFILE ROUTES
app.use("/api/profile", profileRoutes);


app.get("/", (req, res) => {
  res.send("Elarque Backend Running");
});

module.exports = app;