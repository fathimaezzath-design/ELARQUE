const OTP = require("../models/OTP");
const generateOTP = require("../utils/generateOTP");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
  },
});

// Signup OTP
const createOTP = async (userData, resendCount = 0) => {
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
    resendCount,
    lastResentAt: new Date(),
  });

  return otp;
};

// Signup OTP Email
const sendOtpMail = async (email, otp) => {
  const fromAddress = process.env.EMAIL_FROM || `"ELARQUE" <${process.env.EMAIL_USER}>`;
  
  const textContent = `ELARQUE HAUTE COUTURE\n\nATELIER VERIFICATION CODE\n\nYour 6-digit verification code is: ${otp}\n\nThis single-use code is valid for 10 minutes.\n\nIf you did not request this invitation, please disregard this communication.\n\nELARQUE Atelier • Paris • Dallas\nTIMELESS ELEGANCE • MODERN CONFIDENCE`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ELARQUE Atelier Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #120806; font-family: 'Georgia', 'Times New Roman', serif; color: #2C2C2C;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #120806; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #F8F3EC; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid #E7D8BF;">
                
                <!-- Crest & Header -->
                <tr>
                  <td align="center" style="padding: 36px 30px 20px; background-color: #F8F3EC;">
                    <div style="width: 10px; height: 10px; background-color: #C9A25E; transform: rotate(45deg); margin: 0 auto 14px;"></div>
                    <h1 style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-size: 34px; letter-spacing: 7px; color: #7B1E2B; text-transform: uppercase; font-weight: 700;">ELARQUE</h1>
                    <p style="margin: 6px 0 0; font-size: 13px; font-style: italic; color: #8A6A3E; letter-spacing: 1.5px;">Haute Couture &amp; Western Silhouettes</p>
                    <p style="margin: 8px 0 0; font-size: 9px; letter-spacing: 4px; color: #C09A56; text-transform: uppercase;">TIMELESS ELEGANCE &bull; MODERN CONFIDENCE</p>
                    <div style="height: 1px; background-color: #E7D8BF; margin: 24px auto 0; width: 85%;"></div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 10px 40px 30px; text-align: center;">
                    <h2 style="font-size: 22px; color: #3A0C13; margin: 0 0 12px; font-weight: 600; letter-spacing: 1px;">Client Verification Dossier</h2>
                    <p style="font-family: 'Arial', sans-serif; font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 24px;">
                      Welcome to the world of bespoke luxury. Please enter the following 6-digit atelier code to verify your private patron profile:
                    </p>

                    <!-- Code Box -->
                    <div style="background: linear-gradient(135deg, #FAF6F0 0%, #F1E5D5 100%); border: 1.5px solid #DFC28D; border-radius: 12px; padding: 20px 30px; display: inline-block; margin: 0 auto 24px; box-shadow: 0 4px 15px rgba(123, 30, 43, 0.08);">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #650D20; display: inline-block; padding-left: 10px;">${otp}</span>
                    </div>

                    <p style="font-family: 'Arial', sans-serif; font-size: 12px; color: #8B7355; margin: 0 0 8px; font-weight: 600; letter-spacing: 0.5px;">
                      &bull; VALID FOR 10 MINUTES &bull;
                    </p>
                    <p style="font-family: 'Arial', sans-serif; font-size: 11px; color: #999999; margin: 0; line-height: 1.5;">
                      If you did not initiate this registration request with ELARQUE, please disregard this email. Your privacy and credentials remain fully protected.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px 30px; background-color: #3C0D11; border-top: 1px solid rgba(212, 173, 104, 0.25);">
                    <p style="margin: 0; font-family: 'Georgia', serif; font-size: 10px; letter-spacing: 3px; color: #E8C98C; text-transform: uppercase;">
                      ELARQUE ATELIER &bull; PARIS &bull; DALLAS
                    </p>
                    <p style="margin: 6px 0 0; font-family: 'Arial', sans-serif; font-size: 10px; color: #B38F70;">
                      &copy; 2026 ELARQUE. All Rights Reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: email,
    replyTo: process.env.EMAIL_USER,
    subject: `ELARQUE Verification Code: ${otp}`,
    text: textContent,
    html: htmlContent,
  });

  if (!info || !info.accepted || !info.accepted.some((addr) => addr.toLowerCase() === email.toLowerCase())) {
    throw new Error(`Email provider did not accept delivery to ${email}`);
  }

  return info;
};

// Forgot Password OTP Email
const sendPasswordResetOtpMail = async (email, otp) => {
  const fromAddress = process.env.EMAIL_FROM || `"ELARQUE" <${process.env.EMAIL_USER}>`;

  const textContent = `ELARQUE HAUTE COUTURE\n\nPASSWORD RESET ATELIER CODE\n\nYour password reset code is: ${otp}\n\nThis single-use code is valid for 10 minutes.\n\nIf you did not request a password reset, please disregard this communication.\n\nELARQUE Atelier\nTIMELESS ELEGANCE • MODERN CONFIDENCE`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background-color: #120806; font-family: 'Georgia', serif; color: #2C2C2C;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #120806; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #F8F3EC; border-radius: 20px; overflow: hidden; border: 1px solid #E7D8BF;">
                <tr>
                  <td align="center" style="padding: 36px 30px 20px;">
                    <div style="width: 10px; height: 10px; background-color: #C9A25E; transform: rotate(45deg); margin: 0 auto 14px;"></div>
                    <h1 style="margin: 0; font-size: 34px; letter-spacing: 7px; color: #7B1E2B; text-transform: uppercase;">ELARQUE</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 40px 30px; text-align: center;">
                    <h2 style="font-size: 20px; color: #3A0C13; margin: 0 0 12px;">Reset Your Password</h2>
                    <p style="font-family: 'Arial', sans-serif; font-size: 14px; color: #555; margin: 0 0 20px;">
                      We received a request to reset your ELARQUE account password. Use this code:
                    </p>
                    <div style="background: #F1E5D5; border: 1.5px solid #DFC28D; border-radius: 12px; padding: 18px 30px; display: inline-block; margin: 0 auto 20px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #650D20; padding-left: 8px;">${otp}</span>
                    </div>
                    <p style="font-family: 'Arial', sans-serif; font-size: 12px; color: #8B7355; margin: 0;">Valid for 10 minutes.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: email,
    replyTo: process.env.EMAIL_USER,
    subject: `ELARQUE Password Reset Code: ${otp}`,
    text: textContent,
    html: htmlContent,
  });

  if (!info || !info.accepted || !info.accepted.some((addr) => addr.toLowerCase() === email.toLowerCase())) {
    throw new Error(`Email provider did not accept delivery to ${email}`);
  }

  return info;
};

const sendEmailChangeOtpMail = async (email, otp) => {
  const fromAddress = process.env.EMAIL_FROM || `"ELARQUE" <${process.env.EMAIL_USER}>`;

  const textContent = `ELARQUE HAUTE COUTURE\n\nEMAIL CHANGE VERIFICATION\n\nYour verification code is: ${otp}\n\nThis single-use code is valid for 5 minutes.\n\nELARQUE Atelier`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background-color: #120806; font-family: 'Georgia', serif; color: #2C2C2C;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #120806; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #F8F3EC; border-radius: 20px; overflow: hidden; border: 1px solid #E7D8BF;">
                <tr>
                  <td align="center" style="padding: 36px 30px 20px;">
                    <div style="width: 10px; height: 10px; background-color: #C9A25E; transform: rotate(45deg); margin: 0 auto 14px;"></div>
                    <h1 style="margin: 0; font-size: 34px; letter-spacing: 7px; color: #7B1E2B; text-transform: uppercase;">ELARQUE</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 40px 30px; text-align: center;">
                    <h2 style="font-size: 20px; color: #3A0C13; margin: 0 0 12px;">Verify Your New Email</h2>
                    <div style="background: #F1E5D5; border: 1.5px solid #DFC28D; border-radius: 12px; padding: 18px 30px; display: inline-block; margin: 15px auto 20px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #650D20; padding-left: 8px;">${otp}</span>
                    </div>
                    <p style="font-family: 'Arial', sans-serif; font-size: 12px; color: #8B7355; margin: 0;">Valid for 5 minutes.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: email,
    replyTo: process.env.EMAIL_USER,
    subject: `ELARQUE Email Change Code: ${otp}`,
    text: textContent,
    html: htmlContent,
  });

  if (!info || !info.accepted || !info.accepted.some((addr) => addr.toLowerCase() === email.toLowerCase())) {
    throw new Error(`Email provider did not accept delivery to ${email}`);
  }

  return info;
};

module.exports = {
  createOTP,
  sendOtpMail,
  sendPasswordResetOtpMail,
  sendEmailChangeOtpMail,
};