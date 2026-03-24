const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const PickupRequest = require("../models/PickupRequest");
const { createNotification } = require("../services/notificationService");

/**
 * POST /api/pickup-requests
 * Body: { donationId, ngoId, aiScore?, distance? }
 * Role: provider
 */
exports.createPickupRequest = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { donationId, ngoId, aiScore, distance } = req.body || {};

    if (!donationId || !ngoId) {
      return res.status(400).json({
        success: false,
        message: "donationId and ngoId are required",
      });
    }

    if (
      !mongoose.isValidObjectId(donationId) ||
      !mongoose.isValidObjectId(ngoId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid donationId or ngoId",
      });
    }

    const donation = await Donation.findOne({
      _id: donationId,
      isDeleted: false,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    if (donation.providerId.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: "You can only create requests for your own donations",
      });
    }

    if (donation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only available donations can be requested",
      });
    }

    const existing = await PickupRequest.findOne({
      donationId,
      ngoId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Request already exists for this NGO and donation",
      });
    }

    const request = await PickupRequest.create({
      donationId,
      providerId,
      ngoId,
      aiScore: typeof aiScore === "number" ? aiScore : null,
      distance: typeof distance === "number" ? distance : null,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/pickup-requests/provider
 * Role: provider
 */
exports.getProviderPickupRequests = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const requests = await PickupRequest.find({ providerId })
      .sort({ createdAt: -1 })
      .populate("ngoId", "ngoName fullName email ngoAddress")
      .populate("donationId", "foodName quantity quantityUnit pickupLocation status")
      .lean();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/pickup-requests/ngo
 * Role: ngo
 */
exports.getNgoPickupRequests = async (req, res, next) => {
  try {
    const ngoId = req.user?.userId;
    if (!ngoId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const requests = await PickupRequest.find({ ngoId })
      .sort({ createdAt: -1 })
      .populate("providerId", "fullName organizationName email address")
      .populate("donationId", "foodName quantity quantityUnit pickupLocation status expiryTime")
      .lean();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/pickup-requests/:id/respond
 * Body: { action: "accept" | "reject" }
 * Role: ngo
 */
exports.respondToPickupRequest = async (req, res, next) => {
  try {
    const ngoId = req.user?.userId;
    if (!ngoId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;
    const { action } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickup request id" });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'accept' or 'reject'",
      });
    }

    const request = await PickupRequest.findById(id);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Pickup request not found" });
    }

    if (request.ngoId.toString() !== ngoId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to respond to this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be responded to",
      });
    }

    if (action === "reject") {
      request.status = "rejected";
      await request.save();

      await createNotification({
        userId: request.providerId,
        role: "provider",
        title: "Donation Request Rejected",
        message: "Your donation request was rejected by the NGO.",
        type: "warning",
      });

      return res.status(200).json({
        success: true,
        data: request,
      });
    }

    // Accept flow — atomic conditional update to prevent race when two NGOs accept at once
    const donationId = request.donationId;
    const updatedDonation = await Donation.findOneAndUpdate(
      { _id: donationId, status: "pending", isDeleted: false },
      {
        $set: {
          status: "accepted",
          assignedNgoId: ngoId,
          acceptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedDonation) {
      // Another NGO already accepted; donation no longer pending
      await PickupRequest.findByIdAndUpdate(id, {
        $set: { status: "cancelled" },
      });
      return res.status(409).json({
        success: false,
        message: "Donation has already been assigned to another NGO.",
      });
    }

    request.status = "accepted";
    await request.save();

    await PickupRequest.updateMany(
      {
        donationId,
        _id: { $ne: request._id },
        status: "pending",
      },
      { $set: { status: "cancelled" } }
    );

    await createNotification({
      userId: request.providerId,
      role: "provider",
      title: "Donation Accepted",
      message: "Your donation has been accepted by an NGO.",
      type: "success",
    });

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (err) {
    return next(err);
  }
};

