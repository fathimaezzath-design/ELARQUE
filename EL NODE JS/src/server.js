
const dns = require("dns");

// Fix MongoDB SRV DNS resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("SERVER FILE LOADED");

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

console.log("about to connect DB");
connectDB();

const PORT = process.env.PORT || 5000;
console.log("about to listen on port", PORT);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
