const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const ngoDonationController = require("../controllers/ngoDonationController");

const router = express.Router();

// All NGO donation routes require authenticated NGO user
router.use(verifyJWT, requireRole("ngo"));

router.get("/available", ngoDonationController.getAvailableDonations);
router.get("/my", ngoDonationController.getMyAcceptedDonations);
router.get("/:id", ngoDonationController.getDonationById);
router.put("/:id/accept", ngoDonationController.acceptDonation);
router.put("/:id/pickup", ngoDonationController.markPickedUp);
router.put("/:id/deliver", ngoDonationController.markDelivered);

module.exports = router;

