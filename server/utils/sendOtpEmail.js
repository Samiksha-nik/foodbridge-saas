/**
 * Optional OTP email sender via Nodemailer.
 * If EMAIL_USER / EMAIL_PASS are not set, logs OTP to console (dev mode).
 */

let transporter = null;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    transporter = null;
    return null;
  }
  try {
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  } catch (err) {
    console.warn("Nodemailer not installed or config invalid:", err.message);
    transporter = null;
  }
  return transporter;
}

/**
 * Send OTP to email. Resolves when sent or skipped (no env).
 * @param {string} email - Recipient
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<void>}
 */
async function sendOtpEmail(email, otp) {
  const trans = getTransporter();
  if (!trans) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }
  try {
    await trans.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your FoodBridge verification code",
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error("Send OTP email failed:", err.message);
    throw err;
  }
}

/**
 * Send password reset email with link.
 * @param {string} email - Recipient
 * @param {string} resetUrl - Full URL to reset password page
 * @returns {Promise<void>}
 */
async function sendResetPasswordEmail(email, resetUrl) {
  const trans = getTransporter();
  if (!trans) {
    console.log(`[DEV] Reset link for ${email}: ${resetUrl}`);
    return;
  }
  try {
    await trans.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "FoodBridge - Reset your password",
      text: `You requested a password reset. Click this link to reset your password (expires in 15 minutes): ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 15 minutes.</p>`,
    });
  } catch (err) {
    console.error("Send reset password email failed:", err.message);
    throw err;
  }
}

module.exports = { sendOtpEmail, sendResetPasswordEmail };
