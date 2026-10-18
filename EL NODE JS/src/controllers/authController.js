const User = require("../models/User");
const OTP = require("../models/OTP");
const PasswordResetOTP = require("../models/PasswordResetOTP");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  createOTP,
  sendOtpMail,
} = require("../services/otpService");

// REGISTER

exports.registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      referralCode,
      password,
      confirmPassword,
      agreedToTerms,
    } = req.body;

    const cleanFullName = (fullName || "").trim();
    if (!cleanFullName)
      return res.status(400).json({ success: false, message: "Please enter your full name." });

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail)
      return res.status(400).json({ success: false, message: "Please enter your email address." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail))
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });

    const cleanPhone = String(phoneNumber || "").replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10)
      return res.status(400).json({ success: false, message: "Phone number must contain exactly 10 digits." });

    if (!password)
      return res.status(400).json({ success: false, message: "Please create a password." });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match." });

    if (!agreedToTerms)
      return res.status(400).json({
        success: false,
        message: "Please accept the Terms & Privacy Policy to continue.",
      });

    const emailExist = await User.findOne({ email: cleanEmail });
    if (emailExist)
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });

    const phoneExist = await User.findOne({ phoneNumber: cleanPhone });
    if (phoneExist)
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered.",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = await createOTP({
      fullName: cleanFullName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      referralCode: referralCode ? referralCode.trim() : "",
      password: hashedPassword,
      agreedToTerms: Boolean(agreedToTerms),
    });

    try {
      const mailInfo = await sendOtpMail(cleanEmail, otp);
      if (!mailInfo || !mailInfo.accepted || !mailInfo.accepted.some((a) => a.toLowerCase() === cleanEmail)) {
        throw new Error("Recipient address was not accepted by the mail provider.");
      }
    } catch (mailError) {
      console.error("[Auth Service] Failed to dispatch signup OTP email:", mailError.message || mailError);
      await OTP.deleteMany({ email: cleanEmail });
      return res.status(500).json({
        success: false,
        message: "Unable to dispatch verification email. Please verify your email address or try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      email: cleanEmail,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Registration failed.",
    });
  }
};

// VERIFY OTP

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const record = await OTP.findOne({ email: cleanEmail });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found or expired. Please sign up again.",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    const user = await User.create({
      fullName: record.fullName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      referralCode: record.referralCode,
      password: record.password,
      agreedToTerms: record.agreedToTerms,
      isVerified: true,
    });

    await OTP.deleteMany({ email: cleanEmail });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Account verified successfully.",
      token,
      user,
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email or phone number is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Verification failed.",
    });
  }
};

// RESEND OTP

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const record = await OTP.findOne({ email: cleanEmail });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Signup session expired. Please sign up again.",
      });
    }

    // Cooldown rate limit: 60 seconds
    const COOLDOWN_SECONDS = 60;
    if (record.lastResentAt) {
      const timeSinceLast = (Date.now() - new Date(record.lastResentAt).getTime()) / 1000;
      if (timeSinceLast < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting a new code.`,
        });
      }
    }

    // Maximum resend attempts limit (5 attempts)
    const MAX_RESENDS = 5;
    if ((record.resendCount || 0) >= MAX_RESENDS) {
      return res.status(429).json({
        success: false,
        message: "Maximum resend attempts reached. Please register again.",
      });
    }

    const nextResendCount = (record.resendCount || 0) + 1;

    // Issue replacement OTP (invalidates previous OTP)
    const otp = await createOTP(
      {
        fullName: record.fullName,
        email: record.email,
        phoneNumber: record.phoneNumber,
        referralCode: record.referralCode,
        password: record.password,
        agreedToTerms: record.agreedToTerms,
      },
      nextResendCount
    );

    try {
      const mailInfo = await sendOtpMail(cleanEmail, otp);
      if (!mailInfo || !mailInfo.accepted || !mailInfo.accepted.some((a) => a.toLowerCase() === cleanEmail)) {
        throw new Error("Recipient address was not accepted by the mail provider.");
      }
    } catch (mailError) {
      console.error("[Auth Service] Failed to deliver resend OTP email:", mailError.message || mailError);
      return res.status(500).json({
        success: false,
        message: "Unable to resend verification email. Please try again shortly.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent again.",
    });
  } catch (err) {
    console.error("[Auth Service] Resend OTP error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Unable to resend verification code.",
    });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email)
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });

    if (!password)
      return res.status(400).json({
        success: false,
        message: "Please enter your password.",
      });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No account found with this email.",
      });

    if (!user.isVerified)
      return res.status(400).json({
        success: false,
        message: "Please verify your account first.",
      });

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({
        success: false,
        message: "Incorrect password.",
      });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // 3. Check registered user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email is not registered.",
      });
    }

    // 4. Delete old forgot-password OTP
    await PasswordResetOTP.deleteMany({
      email: normalizedEmail,
    });

    // 5. Generate 6-digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // 6. OTP expires after 5 minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // 7. Save OTP
    await PasswordResetOTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    // 8. Send OTP to registered email
    await sendOtpMail(
      normalizedEmail,
      otp
    );

    // 9. Success
    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code.",
    });
  }
};

exports.resendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email is not registered.",
      });
    }

    await PasswordResetOTP.deleteMany({
      email: normalizedEmail,
    });

    const otp = crypto.randomInt(100000, 1000000).toString();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await PasswordResetOTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    await sendOtpMail(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("RESEND RESET OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend verification code.",
    });
  }
};

// VERIFY RESET PASSWORD OTP

exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const resetOTP = await PasswordResetOTP.findOne({
      email: normalizedEmail,
    });

    if (!resetOTP) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found or expired.",
      });
    }

    if (resetOTP.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({
        _id: resetOTP._id,
      });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (resetOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // OTP is correct
    await PasswordResetOTP.deleteOne({
      _id: resetOTP._id,
    });

    // Create temporary token for password reset
    const resetToken = jwt.sign(
      {
        email: normalizedEmail,
        purpose: "password-reset",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Verification successful.",
      resetToken,
    });
  } catch (error) {
    console.error("VERIFY RESET OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the verification code.",
    });
  }
};

// RESET PASSWORD

exports.resetPassword = async (req, res) => {
  try {
    const {
      resetToken,
      password,
      confirmPassword,
    } = req.body;

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        message:
          "Your password reset session has expired. Please request a new code.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and confirm password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one uppercase letter.",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one number.",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one special symbol.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Your password reset session has expired. Please request a new code.",
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        success: false,
        message: "Invalid password reset request.",
      });
    }

    const user = await User.findOne({
      email: decoded.email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check old password
    const samePassword = await bcrypt.compare(
      password,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your previous password.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully. Please login.",
    });

  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update your password.",
    });
  }
};

//get_Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};