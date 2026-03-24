const express = require("express");
const { recommendNgos, predictExpiry } = require("../controllers/ai.controller");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Recommend NGOs for a given donation
router.post(
  "/recommend-ngos",
  verifyJWT,
  requireRole("provider"),
  recommendNgos
);

// Rule-based expiry prediction (used in Add Donation flow)
router.post(
  "/predict-expiry",
  verifyJWT,
  requireRole("provider"),
  predictExpiry
);

module.exports = router;

