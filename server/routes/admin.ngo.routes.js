const express = require("express");
const mongoose = require("mongoose");
const { verifyJWT } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const User = require("../models/User");
const { notifyAdmins } = require("../services/notificationService");

const router = express.Router();

router.use(verifyJWT, requireRole("admin"));

const NGO_SELECT =
  "email fullName organizationName phone address ngoName ngoPhone ngoAddress ngoDescription isApproved isVerified isBlocked createdAt updatedAt";

/**
 * GET /api/admin/ngos/pending
 * NGOs that finished registration but are not approved (and not blocked as rejected).
 * registrationCompleted ensures they completed the NGO profile form.
 */
router.get("/pending", async (req, res, next) => {
  try {
    const ngos = await User.find({
      role: "ngo",
      registrationCompleted: true,
      isApproved: false,
      isBlocked: { $ne: true },
    })
      .select(NGO_SELECT)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: ngos,
    });
  } catch (err) {
    return next(err);
  }
});

async function approveNgoHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid NGO id" });
    }

    const ngo = await User.findOneAndUpdate(
      { _id: id, role: "ngo", registrationCompleted: true },
      { $set: { isApproved: true, isBlocked: false } },
      { new: true }
    )
      .select(NGO_SELECT)
      .lean();

    if (!ngo) {
      return res
        .status(404)
        .json({ success: false, message: "NGO not found" });
    }

    return res.status(200).json({
      success: true,
      data: ngo,
    });
  } catch (err) {
    return next(err);
  }
}

async function rejectNgoHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid NGO id" });
    }

    const ngo = await User.findOneAndUpdate(
      { _id: id, role: "ngo" },
      { $set: { isApproved: false, isBlocked: true } },
      { new: true }
    )
      .select(NGO_SELECT)
      .lean();

    if (!ngo) {
      return res
        .status(404)
        .json({ success: false, message: "NGO not found" });
    }

    await notifyAdmins({
      title: "NGO Rejected",
      message: "An NGO has been rejected",
      type: "warning",
    });

    return res.status(200).json({
      success: true,
      data: ngo,
    });
  } catch (err) {
    return next(err);
  }
}

/** PATCH and PUT supported for clients that expect either verb */
router.patch("/:id/approve", approveNgoHandler);
router.put("/:id/approve", approveNgoHandler);
router.patch("/:id/reject", rejectNgoHandler);
router.put("/:id/reject", rejectNgoHandler);

module.exports = router;
