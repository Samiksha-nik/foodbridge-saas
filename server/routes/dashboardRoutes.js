const express = require("express");
const router = express.Router();
const { verifyJWT, requireRole } = require("../middleware/authMiddleware");

/**
 * GET /api/provider/dashboard
 * JWT required, role = provider
 */
router.get(
  "/provider/dashboard",
  verifyJWT,
  requireRole("provider"),
  (req, res, next) => {
    res.status(200).json({
      success: true,
      data: {
        message: "Provider dashboard",
        user: {
          email: req.user.email,
          fullName: req.user.fullName,
          role: req.user.role,
        },
      },
    });
  }
);

/**
 * GET /api/ngo/dashboard
 * JWT required, role = ngo
 */
router.get(
  "/ngo/dashboard",
  verifyJWT,
  requireRole("ngo"),
  (req, res, next) => {
    res.status(200).json({
      success: true,
      data: {
        message: "NGO dashboard",
        user: {
          email: req.user.email,
          ngoName: req.user.ngoName,
          role: req.user.role,
          isApproved: req.user.isApproved,
        },
      },
    });
  }
);

/**
 * Admin dashboard stats live at GET /api/admin/dashboard (see adminRoutes).
 * This stub was removed — it shadowed the real handler because /api is mounted before /api/admin.
 */

module.exports = router;
