const express = require("express");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const ngoProfileController = require("../controllers/ngoProfileController");

const router = express.Router();

router.put("/profile", verifyJWT, requireRole("ngo"), ngoProfileController.updateProfile);
router.get("/performance", verifyJWT, requireRole("ngo"), ngoProfileController.getPerformance);

module.exports = router;

