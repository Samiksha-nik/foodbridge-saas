const jwt = require("jsonwebtoken");

const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const JWT_COOKIE_NAME = "fb_jwt";

function parseExpiryToMs(expiry) {
  if (!expiry) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  if (typeof expiry === "number") return expiry * 1000;
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] || multipliers.d);
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: parseExpiryToMs(JWT_EXPIRY),
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

module.exports = {
  JWT_EXPIRY,
  JWT_COOKIE_NAME,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
};

