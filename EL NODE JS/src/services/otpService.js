const OTP = require("../models/OTP");
const generateOTP = require("../utils/generateOTP");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Signup OTP

const createOTP = async (userData) => {
  await OTP.deleteMany({
    email: userData.email,
  });

  const otp = generateOTP();

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await OTP.create({
    ...userData,
    otp,
    expiresAt,
  });

  return otp;
};


// Signup OTP Email

const sendOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: `ELARQUE <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "ELARQUE - Verify Your Account",

    html: `
      <div>
        <h2>ELARQUE</h2>

        <h3>Verify Your Account</h3>

        <p>Hello,</p>

        <p>
          Please use the following OTP to verify your ELARQUE account:
        </p>

        <h2>${otp}</h2>

        <p>
          This OTP will expire in 10 minutes.
        </p>

        <p>
          Thank you,<br />
          ELARQUE Team
        </p>
      </div>
    `,
  });
};


// Forgot Password OTP Email

const sendPasswordResetOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: `ELARQUE <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "ELARQUE - Password Reset OTP",

    html: `
      <div>
        <h2>ELARQUE</h2>

        <h3>Reset Your Password</h3>

        <p>Hello,</p>

        <p>
          We received a request to reset your ELARQUE account password.
        </p>

        <p>
          Your password reset OTP is:
        </p>

        <h2>${otp}</h2>

        <p>
          This OTP will expire in 10 minutes.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
        </p>

        <p>
          Thank you,<br />
          ELARQUE Team
        </p>
      </div>
    `,
  });
};

const sendEmailChangeOtpMail = async (
  email,
  otp
) => {
  await transporter.sendMail({
    from: `ELARQUE <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "ELARQUE - Verify Your New Email",

    html: `
      <div>
        <h2>ELARQUE</h2>

        <h3>Verify Your New Email Address</h3>

        <p>Hello,</p>

        <p>
          You requested to change the email address
          connected to your ELARQUE account.
        </p>

        <p>
          Your verification code is:
        </p>

        <h2>${otp}</h2>

        <p>
          This code will expire in 5 minutes.
        </p>

        <p>
          If you did not request this change,
          please ignore this email.
        </p>

        <p>
          Thank you,<br />
          ELARQUE Team
        </p>
      </div>
    `,
  });
};





module.exports = {
  createOTP,
  sendOtpMail,
  sendPasswordResetOtpMail,
  sendEmailChangeOtpMail,
};