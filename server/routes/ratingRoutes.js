const express = require("express");
const ratingController = require("../controllers/ratingController");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", ratingController.createRating);
router.get(
  "/ngo/:ngoId",
  ratingController.getNgoRatings
);
router.get(
  "/provider",
  verifyJWT,
  requireRole("provider"),
  ratingController.getProviderRatings
);

module.exports = router;
