console.log("SERVER FILE LOADED");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("./app");
const connectDB = require("./config/db");

console.log("about to connect DB");
connectDB();

const PORT = process.env.PORT || 5000;
console.log("about to listen on port", PORT);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});