const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const providerDonationController = require("../controllers/providerDonationController");

const router = express.Router();

router.use(verifyJWT, requireRole("provider"));

router.post("/upload-photo", providerDonationController.uploadDonationPhoto);
router.post("/", providerDonationController.createDonation);
router.get("/", providerDonationController.getProviderDonations);
router.get("/stats", providerDonationController.getDashboardStats);
router.get("/:id", providerDonationController.getSingleDonation);
router.put("/:id", providerDonationController.updateDonation);
router.delete("/:id", providerDonationController.deleteDonation);

module.exports = router;

