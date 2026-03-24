const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_COOKIE_NAME } = require("../utils/generateToken");

/**
 * Verify JWT and attach req.user (id, email, role).
 * Use on routes that require authentication.
 */
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    const cookieToken =
      req.cookies && req.cookies[JWT_COOKIE_NAME]
        ? req.cookies[JWT_COOKIE_NAME]
        : null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("email role isVerified registrationCompleted fullName ngoName isApproved");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      registrationCompleted: user.registrationCompleted,
      fullName: user.fullName,
      ngoName: user.ngoName,
      isApproved: user.isApproved,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    next(err);
  }
};

/**
 * Restrict access to one or more roles.
 * Use after verifyJWT.
 * @param  {...string} allowedRoles - e.g. 'provider', 'ngo', 'admin'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
};

module.exports = {
  verifyJWT,
  requireRole,
};
