// fixUser.js
// Run once from your project root: node fixUser.js
// Then delete this file.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

console.log("MONGODB_URI is:", process.env.MONGODB_URI);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "fathimaezzath@gmail.com";

  const result = await User.updateOne(
    { email },
    { $set: { isVerified: true } }
  );

  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
  console.log("MONGO_URI is:", process.env.MONGO_URI);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});