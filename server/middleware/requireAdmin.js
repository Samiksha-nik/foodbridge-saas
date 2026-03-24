const { verifyJWT } = require("./authMiddleware");

/**
 * Middleware chain that ensures the current user is an authenticated admin.
 * Use together with routes: router.use(verifyJWT, requireAdmin)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access only" });
  }
  next();
};

module.exports = {
  verifyJWT,
  requireAdmin,
};

