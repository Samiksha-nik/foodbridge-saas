const User = require("../models/User");
const Donation = require("../models/Donation");
const PickupRequest = require("../models/PickupRequest");
const Rating = require("../models/Rating");
const FraudAlert = require("../models/FraudAlert");
const geocodeAddress = require("../utils/geocodeAddress");

const NGO_PROFILE_FIELDS = [
  "ngoName",
  "ngoPhone",
  "ngoAddress",
  "ngoDescription",
  "ngoProfileImage",
  "registrationId",
  "establishedYear",
  "ngoType",
  "mission",
  "website",
  "socialLinks",
  "dailyCapacity",
  "capacityUtilization",
  "storageAvailable",
  "coldStorageAvailable",
  "pickupRadius",
  "ngoPickupStartTime",
  "ngoPickupEndTime",
  "emergencyAvailable",
  "location",
];

const NGO_TYPES = [
  "orphanage",
  "old_age_home",
  "shelter",
  "community_kitchen",
  "disaster_relief",
  "other",
];

/**
 * PUT /api/ngos/profile
 * Update NGO profile. JWT + ngo role required.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updates = {};

    for (const field of NGO_PROFILE_FIELDS) {
      if (req.body[field] === undefined) continue;

      if (field === "ngoType" && req.body[field] !== "") {
        if (!NGO_TYPES.includes(req.body[field])) {
          return res.status(400).json({
            success: false,
            message: `ngoType must be one of: ${NGO_TYPES.join(", ")}`,
          });
        }
      }

      if (field === "establishedYear") {
        const year = Number(req.body[field]);
        if (!Number.isFinite(year) || year < 1800 || year > new Date().getFullYear()) {
          return res.status(400).json({
            success: false,
            message: "establishedYear must be a valid year",
          });
        }
        updates.establishedYear = year;
        continue;
      }

      if (field === "dailyCapacity" || field === "capacityUtilization" || field === "pickupRadius") {
        const num = req.body[field] === "" || req.body[field] == null ? null : Number(req.body[field]);
        if (num != null && !Number.isFinite(num)) {
          return res.status(400).json({ success: false, message: `${field} must be a number` });
        }
        updates[field] = num;
        continue;
      }

      if (field === "ngoPickupStartTime" || field === "ngoPickupEndTime") {
        const val = req.body[field];
        updates[field] = val ? new Date(val) : null;
        continue;
      }

      if (field === "socialLinks") {
        const links = Array.isArray(req.body[field]) ? req.body[field] : [];
        updates.socialLinks = links
          .filter((x) => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 6);
        continue;
      }

      if (field === "location") {
        // Expect GeoJSON: { type: "Point", coordinates: [lng, lat] }
        const loc = req.body.location;
        if (
          loc &&
          loc.type === "Point" &&
          Array.isArray(loc.coordinates) &&
          loc.coordinates.length === 2
        ) {
          updates.location = { type: "Point", coordinates: loc.coordinates };
        }
        continue;
      }

      updates[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }

    // registrationId required (for production readiness)
    if (updates.registrationId !== undefined && !updates.registrationId) {
      return res.status(400).json({
        success: false,
        message: "registrationId is required",
      });
    }

    // Geocode address if location not provided and address exists
    if (!updates.location && updates.ngoAddress) {
      const coords = await geocodeAddress(updates.ngoAddress);
      if (coords.lat != null && coords.lng != null) {
        updates.location = {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        };
        updates["location.lat"] = coords.lat;
        updates["location.lng"] = coords.lng;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("-password -otpCode -otpExpiry -resetPasswordToken -resetPasswordExpire")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ngos/performance
 * Read-only operational metrics for NGO profile.
 */
exports.getPerformance = async (req, res, next) => {
  try {
    const ngoId = req.user?.userId;
    if (!ngoId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [totalReceived, acceptanceAgg, speedAgg, ratingAgg, fraudOpen] =
      await Promise.all([
        Donation.countDocuments({ assignedNgoId: ngoId, isDeleted: false }),
        PickupRequest.aggregate([
          { $match: { ngoId: new (require("mongoose").Types.ObjectId)(ngoId) } },
          {
            $group: {
              _id: null,
              accepted: {
                $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
              },
              total: { $sum: 1 },
            },
          },
        ]),
        Donation.aggregate([
          {
            $match: {
              assignedNgoId: new (require("mongoose").Types.ObjectId)(ngoId),
              status: "delivered",
              acceptedAt: { $type: "date" },
              deliveredAt: { $type: "date" },
              isDeleted: false,
            },
          },
          {
            $project: {
              diffHours: {
                $divide: [
                  { $subtract: ["$deliveredAt", "$acceptedAt"] },
                  1000 * 60 * 60,
                ],
              },
            },
          },
          { $group: { _id: null, avgHours: { $avg: "$diffHours" } } },
        ]),
        Rating.aggregate([
          {
            $match: {
              ngoId: new (require("mongoose").Types.ObjectId)(ngoId),
            },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              count: { $sum: 1 },
            },
          },
        ]),
        FraudAlert.countDocuments({ userId: ngoId, status: "open" }),
      ]);

    const acc = acceptanceAgg?.[0];
    const acceptanceRate =
      acc && acc.total > 0 ? Math.round((acc.accepted / acc.total) * 100) : 0;
    const speed = speedAgg?.[0];
    const avgPickupHours =
      speed && typeof speed.avgHours === "number"
        ? Number(speed.avgHours.toFixed(2))
        : null;
    const rating = ratingAgg?.[0];
    const avgRating =
      rating && typeof rating.avgRating === "number"
        ? Number(rating.avgRating.toFixed(2))
        : null;

    const trustScore = Math.round((1 / (fraudOpen + 1)) * 100);

    return res.status(200).json({
      success: true,
      data: {
        totalDonationsReceived: totalReceived,
        acceptanceRate,
        averagePickupTimeHours: avgPickupHours,
        averageRating: avgRating,
        aiTrustScore: trustScore,
      },
    });
  } catch (err) {
    next(err);
  }
};

