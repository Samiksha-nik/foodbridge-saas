const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAiRecommendationForProvider } = require("../controllers/ai.controller");
const providerProfileController = require("../controllers/providerProfileController");

const router = express.Router();

router.get(
  "/ai-recommendation",
  verifyJWT,
  requireRole("provider"),
  getAiRecommendationForProvider
);

router.put(
  "/profile",
  verifyJWT,
  requireRole("provider"),
  providerProfileController.updateProfile
);

module.exports = router;
