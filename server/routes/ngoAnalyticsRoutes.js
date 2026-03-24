const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const ngoAnalyticsController = require("../controllers/ngoAnalyticsController");

const router = express.Router();

router.get("/analytics", verifyJWT, requireRole("ngo"), ngoAnalyticsController.getNgoAnalytics);

module.exports = router;

