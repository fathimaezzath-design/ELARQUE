// EL NODE JS/setupAdmin.js
// Standalone utility script to safely create or reset the administrator account.
// Supports both interactive mode (hidden password entry) and command-line arguments.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const readline = require("readline");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");

// Regular visible prompt for email / general questions
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Hidden prompt for passwords — does not echo characters to terminal
function promptHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);

    const stdin = process.stdin;

    // Check if terminal supports raw mode
    if (stdin.isTTY) {
      const wasRaw = Boolean(stdin.isRaw);
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      let input = "";

      const onData = (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          const char = chunk[i];

          if (char === "\r" || char === "\n" || char === "\u0004") {
            // Enter or EOF
            stdin.removeListener("data", onData);
            stdin.setRawMode(wasRaw);
            stdin.pause();
            process.stdout.write("\n");
            return resolve(input);
          } else if (char === "\u0003") {
            // Ctrl+C
            stdin.removeListener("data", onData);
            stdin.setRawMode(wasRaw);
            process.stdout.write("\n");
            process.exit(1);
          } else if (char === "\u0008" || char === "\x7f") {
            // Backspace / Delete
            if (input.length > 0) {
              input = input.slice(0, -1);
            }
          } else if (char >= " " || char.charCodeAt(0) > 127) {
            // Printable characters
            input += char;
          }
        }
      };

      stdin.on("data", onData);
    } else {
      // Fallback for non-interactive / redirected streams
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

async function setupAdmin() {
  const args = process.argv.slice(2);
  let email = "";
  let password = "";
  let name = "ELARQUE Superadmin";

  if (args.length === 0) {
    // 1. Interactive Setup Mode (no arguments provided)
    console.log("\n========================================");
    console.log("   ELARQUE Administrator Setup Wizard   ");
    console.log("========================================");

    const emailInput = await prompt("Admin Email [default: admin@elarque.com]: ");
    email = (emailInput || "admin@elarque.com").trim().toLowerCase();

    password = await promptHidden("Enter New Admin Password (min 8 chars): ");

    if (password.length < 8) {
      console.error("\nError: Password must be at least 8 characters long.");
      process.exit(1);
    }

    const confirmPassword = await promptHidden("Confirm Admin Password: ");

    if (password !== confirmPassword) {
      console.error("\nError: Passwords do not match. Aborting.");
      process.exit(1);
    }

    console.log(`\nPassword accepted (${password.length} characters).`);
  } else if (args.length >= 2) {
    // 2. Command-Line Argument Mode (email + password provided)
    email = args[0].trim().toLowerCase();
    password = args[1];
    if (args[2]) name = args[2];

    if (password.length < 8) {
      console.error("Error: Password must be at least 8 characters long.");
      process.exit(1);
    }
  } else {
    // Only 1 argument provided
    console.log("\nUsage:");
    console.log("  Interactive mode : node setupAdmin.js");
    console.log("  Argument mode    : node setupAdmin.js <email> <password> [name]\n");
    process.exit(1);
  }

  // Basic email validation
  if (!email || !email.includes("@")) {
    console.error("Error: Please provide a valid email address.");
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Error: MONGO_URI is missing in .env configuration.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Database connected successfully.");

    // Hash password with bcryptjs (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update existing admin or insert new one with role 'superadmin'
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          password: hashedPassword,
          role: "superadmin",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Roundtrip verification: Fetch directly from database and verify using bcrypt.compare
    const savedRecord = await Admin.findOne({ email });
    if (!savedRecord) {
      throw new Error("Verification failed: Unable to re-fetch the updated admin document.");
    }

    const isMatch = await bcrypt.compare(password, savedRecord.password);
    if (!isMatch) {
      throw new Error("Verification failed: Stored hash does not match the provided password.");
    }

    console.log("\n========================================");
    console.log(" Admin account configured & verified!   ");
    console.log("========================================");
    console.log(`- Email for Login : ${updatedAdmin.email}`);
    console.log(`- Role            : ${updatedAdmin.role}`);
    console.log(`- Password Length : ${password.length} characters`);
    console.log(`- Verification    : SUCCESS (bcrypt.compare confirmed)`);
    console.log("========================================\n");
    console.log("Next steps:");
    console.log("1. Open http://localhost:5173/admin/login in your browser.");
    console.log(`2. Enter ADMIN EMAIL: ${updatedAdmin.email}`);
    console.log("3. Enter your configured password.");
    console.log("4. Click AUTHENTICATE & ENTER to log in to the dashboard.\n");

    await mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Failed to setup admin account:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

setupAdmin();
