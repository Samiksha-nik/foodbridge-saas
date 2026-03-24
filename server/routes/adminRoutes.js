const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/requireAdmin");
const adminController = require("../controllers/adminController");
const adminUserController = require("../controllers/adminUserController");
const adminDonationController = require("../controllers/adminDonationController");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.use(verifyJWT, requireAdmin);

router.get("/dashboard", adminController.getAdminDashboardStats);
router.get("/users", adminUserController.getAllUsers);
router.patch("/users/:id", adminUserController.patchAdminUser);
router.get("/donations", adminDonationController.getAllDonations);
router.get("/analytics", adminAnalyticsController.getAdminAnalytics);

router.get("/donations-summary", adminController.getDonationsSummary);
router.get("/users-summary", adminController.getUsersSummary);
router.get("/fraud-alerts", adminController.getFraudAlerts);
router.put(
  "/fraud-alerts/:id/resolve",
  adminController.putResolveFraudAlert
);
router.patch("/fraud-alerts/:id", adminController.patchFraudAlert);

module.exports = router;

