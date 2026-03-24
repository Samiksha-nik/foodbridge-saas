/**
 * Generates a 6-digit numeric OTP.
 * @returns {string} 6-digit OTP string
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * OTP validity in milliseconds (10 minutes).
 */
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Returns expiry date for OTP (now + 10 min).
 * @returns {Date}
 */
function getOtpExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

module.exports = {
  generateOtp,
  getOtpExpiry,
  OTP_EXPIRY_MS,
};
