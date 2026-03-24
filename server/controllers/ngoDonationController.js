const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const PickupRequest = require("../models/PickupRequest");
const { createNotification } = require("../services/notificationService");

async function syncPickupRequestsOnAssign({ donationId, ngoId }) {
  // Keep PickupRequest docs consistent when an NGO uses direct donation endpoints.
  // This prevents the NGO dashboard from showing stale "pending" pickup requests
  // that can't be accepted once the donation is already accepted/picked/delivered.
  await PickupRequest.updateMany(
    { donationId, ngoId, status: "pending" },
    { $set: { status: "accepted" } }
  );

  await PickupRequest.updateMany(
    { donationId, ngoId: { $ne: ngoId }, status: "pending" },
    { $set: { status: "cancelled" } }
  );
}

/**
 * GET /api/ngo/donations/available
 * Returns available donations for NGOs to accept.
 */
exports.getAvailableDonations = async (req, res, next) => {
  try {
    const now = new Date();

    // Mark expired pending donations and notify providers once.
    const expiredPending = await Donation.find({
      status: "pending",
      isDeleted: false,
      expiryTime: { $lte: now },
    })
      .select("_id providerId")
      .lean();

    if (expiredPending.length > 0) {
      const expiredIds = expiredPending.map((d) => d._id);
      await Donation.updateMany(
        { _id: { $in: expiredIds }, status: "pending" },
        { $set: { status: "expired" } }
      );

      const providerIds = [
        ...new Set(expiredPending.map((d) => d.providerId?.toString()).filter(Boolean)),
      ];
      for (const providerId of providerIds) {
        await createNotification({
          userId: providerId,
          role: "provider",
          title: "Donation Expired",
          message: "Your donation expired before pickup.",
          type: "warning",
        });
      }
    }

    const donations = await Donation.find({
      status: "pending", // treated as "listed"
      isDeleted: false,
      $or: [{ expiryTime: null }, { expiryTime: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: donations,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/ngo/donations/my
 * Returns donations accepted by the current NGO.
 */
exports.getMyAcceptedDonations = async (req, res, next) => {
  try {
    const ngoId = req.user.userId;

    const donations = await Donation.find({
      assignedNgoId: ngoId,
      status: { $in: ["accepted", "picked_up", "delivered"] },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: donations,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/ngo/donations/:id
 * Returns a single donation for the current NGO.
 */
exports.getDonationById = async (req, res, next) => {
  try {
    const ngoId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      assignedNgoId: ngoId,
      isDeleted: false,
    }).lean();

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/ngo/donations/:id/accept
 * Accept a listed donation.
 */
exports.acceptDonation = async (req, res, next) => {
  try {
    const ngoId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    if (donation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only listed donations can be accepted",
      });
    }

    donation.status = "accepted";
    donation.assignedNgoId = ngoId;
    donation.acceptedAt = new Date();

    await donation.save();

    await syncPickupRequestsOnAssign({ donationId: id, ngoId });

    await createNotification({
      userId: donation.providerId,
      role: "provider",
      title: "Donation Accepted",
      message: "Your donation has been accepted by NGO.",
      type: "success",
    });

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/ngo/donations/:id/pickup
 * Mark an accepted donation as picked up.
 */
exports.markPickedUp = async (req, res, next) => {
  try {
    const ngoId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    if (!donation.assignedNgoId || donation.assignedNgoId.toString() !== ngoId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this donation" });
    }

    if (donation.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Donation must be in accepted state to mark as picked up",
      });
    }

    donation.status = "picked_up";
    donation.pickedUpAt = new Date();

    await donation.save();

    await syncPickupRequestsOnAssign({ donationId: id, ngoId });

    await createNotification({
      userId: donation.providerId,
      role: "provider",
      title: "Donation Delivered",
      message: "Your donation has been delivered successfully.",
      type: "success",
    });

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/ngo/donations/:id/deliver
 * Mark a picked up donation as delivered.
 */
exports.markDelivered = async (req, res, next) => {
  try {
    const ngoId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    if (
      !donation.assignedNgoId ||
      donation.assignedNgoId.toString() !== ngoId
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this donation" });
    }

    if (donation.status !== "picked_up") {
      return res.status(400).json({
        success: false,
        message: "Donation must be picked up before marking as delivered",
      });
    }

    donation.status = "delivered";
    donation.deliveredAt = new Date();

    const existingProofs = Array.isArray(donation.deliveryProofUrls)
      ? donation.deliveryProofUrls
      : [];
    const incomingProofs = Array.isArray(req.body.deliveryProofUrls)
      ? req.body.deliveryProofUrls.filter(Boolean)
      : [];

    if (incomingProofs.length > 0) {
      donation.deliveryProofUrls = [...existingProofs, ...incomingProofs];
    } else if (
      existingProofs.length === 0 &&
      donation.photoUrl &&
      /^https?:\/\//.test(donation.photoUrl)
    ) {
      // Fallback: treat original photo as delivery proof only if it's a real URL
      donation.deliveryProofUrls = [donation.photoUrl];
    }

    await donation.save();

    await syncPickupRequestsOnAssign({ donationId: id, ngoId });

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

