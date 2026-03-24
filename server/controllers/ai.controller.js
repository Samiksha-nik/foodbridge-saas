const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");
const Rating = require("../models/Rating");
const FraudAlert = require("../models/FraudAlert");
const PickupRequest = require("../models/PickupRequest");

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Shared ranking logic: returns ranked NGOs for a donation.
 * Reused by recommendNgos (Add Donation) and getAiRecommendationForProvider (Provider Dashboard).
 * @param {Object} donation - Donation document (lean)
 * @returns {Promise<Array>} Ranked NGOs with ngoId, name, distance, trustScore, acceptanceRate, aiScore, reason
 */
async function getRankedNgosForDonation(donation) {
  let donationLat = null;
  let donationLng = null;
  if (
    donation.pickupLocation &&
    Array.isArray(donation.pickupLocation.coordinates) &&
    donation.pickupLocation.coordinates.length === 2
  ) {
    const [lng, lat] = donation.pickupLocation.coordinates;
    donationLat = lat;
    donationLng = lng;
  } else if (
    typeof donation.pickupLat === "number" &&
    typeof donation.pickupLng === "number"
  ) {
    donationLat = donation.pickupLat;
    donationLng = donation.pickupLng;
  }

  if (donationLat == null || donationLng == null) return [];

  const ngos = await User.find({ role: "ngo", isApproved: true })
    .select(
      "ngoName fullName location pickupRadius dailyCapacity capacityUtilization storageAvailable coldStorageAvailable emergencyAvailable"
    )
    .lean();
  if (!ngos.length) return [];

  const ngoIds = ngos.map((n) => n._id);

  const [ratingStats, speedStats, fraudStats, acceptanceStats] =
    await Promise.all([
      Rating.aggregate([
        { $match: { ngoId: { $in: ngoIds } } },
        { $group: { _id: "$ngoId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        {
          $match: {
            assignedNgoId: { $in: ngoIds },
            status: "delivered",
            acceptedAt: { $type: "date" },
            deliveredAt: { $type: "date" },
          },
        },
        {
          $project: {
            assignedNgoId: 1,
            diffHours: {
              $divide: [
                { $subtract: ["$deliveredAt", "$acceptedAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        { $group: { _id: "$assignedNgoId", avgHours: { $avg: "$diffHours" } } },
      ]),
      FraudAlert.aggregate([
        { $match: { userId: { $in: ngoIds }, status: "open" } },
        { $group: { _id: "$userId", fraudCount: { $sum: 1 } } },
      ]),
      PickupRequest.aggregate([
        { $match: { ngoId: { $in: ngoIds } } },
        {
          $group: {
            _id: "$ngoId",
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

  const ratingMap = new Map(
    ratingStats.map((r) => [r._id.toString(), { avgRating: r.avgRating, count: r.count }])
  );
  const speedMap = new Map(speedStats.map((s) => [s._id.toString(), s.avgHours]));
  const fraudMap = new Map(
    fraudStats.map((f) => [f._id.toString(), f.fraudCount])
  );
  const acceptanceMap = new Map(
    acceptanceStats.map((a) => [
      a._id.toString(),
      a.total > 0 ? (a.accepted / a.total) * 100 : 0,
    ])
  );

  let urgencyScore = 0.4;
  if (donation.expiryTime) {
    const diffHours =
      (new Date(donation.expiryTime).getTime() - Date.now()) / (1000 * 60 * 60);
    urgencyScore = diffHours <= 4 ? 1 : diffHours <= 8 ? 0.7 : 0.4;
  }

  const results = ngos
    .map((ngo) => {
      const ngoIdStr = ngo._id.toString();
      let ngoLat = null;
      let ngoLng = null;
      if (
        ngo.location &&
        Array.isArray(ngo.location.coordinates) &&
        ngo.location.coordinates.length === 2
      ) {
        const [lng, lat] = ngo.location.coordinates;
        ngoLat = lat;
        ngoLng = lng;
      } else if (
        typeof ngo.location?.lat === "number" &&
        typeof ngo.location?.lng === "number"
      ) {
        ngoLat = ngo.location.lat;
        ngoLng = ngo.location.lng;
      }

      let distanceKm = Number.POSITIVE_INFINITY;
      let distanceScore = 0;
      if (ngoLat != null && ngoLng != null) {
        distanceKm = haversineDistanceKm(
          donationLat,
          donationLng,
          ngoLat,
          ngoLng
        );
        distanceScore = 1 / (distanceKm + 1);
      }

      // Capability modifiers (logistics/capacity). These use profile fields; no new ranking pipeline.
      let capabilityMultiplier = 1;
      if (typeof ngo.pickupRadius === "number" && Number.isFinite(distanceKm)) {
        if (distanceKm > ngo.pickupRadius) capabilityMultiplier *= 0.25;
      }
      if (
        typeof ngo.dailyCapacity === "number" &&
        typeof ngo.capacityUtilization === "number" &&
        typeof donation.mealsEquivalent === "number"
      ) {
        const available =
          ngo.dailyCapacity * Math.max(0, 1 - ngo.capacityUtilization / 100);
        if (available > 0 && donation.mealsEquivalent > available) {
          capabilityMultiplier *= 0.4;
        }
      }
      if (
        donation.storageType === "refrigerated" ||
        donation.storageType === "frozen"
      ) {
        if (!ngo.coldStorageAvailable) capabilityMultiplier *= 0.6;
      }
      if (donation.category === "perishable" && !ngo.storageAvailable) {
        capabilityMultiplier *= 0.7;
      }

      const rStats = ratingMap.get(ngoIdStr);
      const averageRating = rStats && rStats.count > 0 ? rStats.avgRating : 0;
      const ratingScore = rStats && rStats.count > 0 ? averageRating / 5 : 0.5;
      const avgHours = speedMap.get(ngoIdStr);
      const speedScore =
        typeof avgHours === "number" ? 1 / (avgHours + 1) : 0.5;
      const fraudCount = fraudMap.get(ngoIdStr) || 0;
      const trustScore = 1 / (fraudCount + 1);
      const acceptanceRate = acceptanceMap.get(ngoIdStr) ?? 0;

      const score =
        capabilityMultiplier *
        distanceScore * 0.35 +
        ratingScore * 0.25 +
        speedScore * 0.2 +
        trustScore * 0.1 +
        (acceptanceRate / 100) * 0.05 +
        urgencyScore * 0.05;

      const aiScore = Math.round(Math.min(100, Math.max(0, score * 100)));
      const reasons = [];
      if (Number.isFinite(distanceKm) && distanceKm < 10)
        reasons.push("nearby");
      if (typeof ngo.pickupRadius === "number" && Number.isFinite(distanceKm) && distanceKm <= ngo.pickupRadius)
        reasons.push("within pickup radius");
      if (typeof ngo.dailyCapacity === "number") reasons.push("capacity matched");
      if (ngo.coldStorageAvailable && (donation.storageType === "refrigerated" || donation.storageType === "frozen"))
        reasons.push("cold storage");
      if (ngo.emergencyAvailable && urgencyScore >= 0.7) reasons.push("emergency ready");
      if (averageRating >= 4) reasons.push("high rated");
      if (trustScore >= 0.8) reasons.push("trusted");
      if (acceptanceRate >= 50) reasons.push("responsive");
      const reason =
        reasons.length > 0
          ? reasons.join(", ")
          : "Best match based on location and capacity";

      return {
        ngoId: ngoIdStr,
        name: ngo.ngoName || ngo.fullName || "NGO",
        distance: Number.isFinite(distanceKm)
          ? Number(distanceKm.toFixed(2))
          : null,
        averageRating: rStats && rStats.count > 0 ? averageRating : null,
        score,
        trustScore: Math.round(trustScore * 100),
        acceptanceRate: Math.round(acceptanceRate),
        aiScore,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);

  return results;
}

exports.recommendNgos = async (req, res) => {
  try {
    const { donationId } = req.body || {};

    if (!donationId || !mongoose.isValidObjectId(donationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid donationId is required",
      });
    }

    const donation = await Donation.findById(donationId).lean();
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    const ranked = await getRankedNgosForDonation(donation);
    const data = ranked.slice(0, 3).map((r) => ({
      ngoId: r.ngoId,
      ngoName: r.name,
      distance: r.distance,
      averageRating: r.averageRating,
      score: r.score,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to recommend NGOs",
    });
  }
};

/**
 * GET /api/providers/ai-recommendation
 * Returns top AI-recommended NGO for provider's latest pending donation.
 */
exports.getAiRecommendationForProvider = async (req, res) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const donation = await Donation.findOne({
      providerId,
      status: "pending",
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!donation) {
      return res.status(200).json({
        success: true,
        recommendation: null,
      });
    }

    const ranked = await getRankedNgosForDonation(donation);
    const top = ranked[0];

    if (!top) {
      return res.status(200).json({
        success: true,
        donationId: donation._id.toString(),
        recommendation: null,
      });
    }

    return res.status(200).json({
      success: true,
      donationId: donation._id.toString(),
      recommendation: {
        ngoId: top.ngoId,
        name: top.name,
        distance: top.distance,
        trustScore: top.trustScore,
        acceptanceRate: top.acceptanceRate,
        aiScore: top.aiScore,
        reason: top.reason,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to get AI recommendation",
    });
  }
};

/**
 * POST /api/ai/predict-expiry
 * Rule-based expiry prediction for a donation.
 */
exports.predictExpiry = async (req, res) => {
  try {
    const { foodType, quantity, storageType, cookedAt } = req.body || {};

    if (!foodType || !storageType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let baseHours = 0;

    // Rule-based AI logic
    if (foodType === "cooked") baseHours = 6;
    else if (foodType === "raw") baseHours = 24;
    else baseHours = 12;

    if (storageType === "refrigerated") baseHours += 12;
    if (storageType === "frozen") baseHours += 24;

    // Optional: adjust based on quantity
    const q = typeof quantity === "number" ? quantity : Number(quantity);
    if (Number.isFinite(q) && q > 10) baseHours -= 1;

    // Optional cookedAt in future iterations (kept for API shape).
    void cookedAt;

    const now = new Date();
    const expiryTime = new Date(now.getTime() + baseHours * 60 * 60 * 1000);

    return res.status(200).json({
      estimatedHours: baseHours,
      expiresAt: expiryTime,
      message: "AI prediction successful",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

