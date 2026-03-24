const express = require("express");
const {
  createPickupRequest,
  getProviderPickupRequests,
  getNgoPickupRequests,
  respondToPickupRequest,
} = require("../controllers/pickupRequestController");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  verifyJWT,
  requireRole("provider"),
  createPickupRequest
);

router.get(
  "/provider",
  verifyJWT,
  requireRole("provider"),
  getProviderPickupRequests
);

router.get(
  "/ngo",
  verifyJWT,
  requireRole("ngo"),
  getNgoPickupRequests
);

router.patch(
  "/:id/respond",
  verifyJWT,
  requireRole("ngo"),
  respondToPickupRequest
);

module.exports = router;

