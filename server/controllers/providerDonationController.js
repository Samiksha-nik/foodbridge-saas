const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Donation = require("../models/Donation");
const User = require("../models/User");
const geocodeAddress = require("../utils/geocodeAddress");
const { notifyMany } = require("../services/notificationService");
const {
  runDonationFraudChecks,
  isHighVolumeDonation,
} = require("../services/fraudDetectionService");
const { notifyAdmins } = require("../services/notificationService");

const uploadDir = path.join(__dirname, "..", "uploads", "donations");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
        ? ext
        : ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

function toRad(v) {
  return (v * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

const buildProviderDonationQuery = (providerId, query) => {
  const conditions = {
    providerId: new mongoose.Types.ObjectId(providerId),
    isDeleted: false,
  };

  if (query.status) {
    conditions.status = query.status;
  }

  if (query.search) {
    conditions.foodName = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  return conditions;
};

exports.createDonation = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const {
      foodName,
      category,
      isVeg,
      containsAllergens,
      isSealedPack,
      quantity,
      quantityUnit,
      cookedTime,
      expiryTime,
      pickupStartTime,
      pickupEndTime,
      storageType,
      pickupLocation,
      contactPhone,
      specialInstructions,
      photoUrl,
    } = req.body;

    if (!pickupStartTime || !pickupEndTime) {
      return res.status(400).json({
        success: false,
        message: "pickupStartTime and pickupEndTime are required",
      });
    }

    const start = new Date(pickupStartTime);
    const end = new Date(pickupEndTime);

    if (!(end > start)) {
      return res.status(400).json({
        success: false,
        message: "pickupEndTime must be greater than pickupStartTime",
      });
    }

    const mealsEquivalent = typeof quantity === "number" ? quantity * 2 : 0;

    let pickupLat = null;
    let pickupLng = null;

    try {
      const coords = await geocodeAddress(pickupLocation?.address);
      pickupLat = coords.lat;
      pickupLng = coords.lng;
    } catch (e) {
      // Geocoding failures should not block donation creation
      pickupLat = null;
      pickupLng = null;
    }

    const donation = await Donation.create({
      providerId,
      foodName,
      category,
      isVeg,
      containsAllergens,
      isSealedPack,
      quantity,
      quantityUnit,
      cookedTime,
      expiryTime,
      pickupStartTime: start,
      pickupEndTime: end,
      storageType,
      pickupLocation,
      pickupLat,
      pickupLng,
      contactPhone,
      specialInstructions,
      photoUrl,
      mealsEquivalent,
      expiryRiskLevel: "medium",
    });

    const providerUser = await User.findById(providerId)
      .select("email fullName organizationName role")
      .lean();
    if (providerUser) {
      await runDonationFraudChecks(donation, providerUser);
    }

    if (isHighVolumeDonation(donation)) {
      try {
        await notifyAdmins({
          title: "High Volume Donation",
          message: "A large donation has been created",
          type: "info",
        });
      } catch (e) {
        console.error("[createDonation] notifyAdmins high volume", e);
      }
    }

    // Notify nearby NGOs about new available donation.
    const ngos = await User.find({ role: "ngo", isApproved: true })
      .select("_id location")
      .lean();
    const nearbyNgoIds = [];
    if (typeof pickupLat === "number" && typeof pickupLng === "number") {
      ngos.forEach((ngo) => {
        const coords = ngo.location?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) return;
        const ngoLng = coords[0];
        const ngoLat = coords[1];
        if (typeof ngoLat !== "number" || typeof ngoLng !== "number") return;
        const km = haversineDistanceKm(pickupLat, pickupLng, ngoLat, ngoLng);
        if (km <= 25) nearbyNgoIds.push(ngo._id);
      });
    }

    const targetNgoIds = nearbyNgoIds.length > 0 ? nearbyNgoIds : ngos.map((n) => n._id);
    await notifyMany(targetNgoIds, "ngo", {
      title: "New Donation Available",
      message: "New food donation available near you.",
      type: "info",
    });

    return res.status(201).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

exports.uploadDonationPhoto = [
  (req, res, next) => {
    imageUpload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/donations/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
      },
    });
  },
];

exports.getProviderDonations = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const conditions = buildProviderDonationQuery(providerId, req.query);

    const [items, total] = await Promise.all([
      Donation.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(conditions),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSingleDonation = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donationDoc = await Donation.findOne({
      _id: id,
      providerId,
      isDeleted: false,
    })
      .populate("assignedNgoId", "ngoName ngoPhone fullName phone email")
      .lean();

    if (!donationDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    const ngo = donationDoc.assignedNgoId || {};
    const donation = {
      ...donationDoc,
      assignedNgoName: ngo.ngoName || ngo.fullName || undefined,
      assignedNgoEmail: ngo.email || undefined,
      assignedNgoPhone: ngo.ngoPhone || ngo.phone || undefined,
    };

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateDonation = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      providerId,
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
        message: "Only pending donations can be updated",
      });
    }

    const updatableFields = [
      "foodName",
      "category",
      "isVeg",
      "containsAllergens",
      "isSealedPack",
      "quantity",
      "quantityUnit",
      "cookedTime",
      "expiryTime",
      "pickupStartTime",
      "pickupEndTime",
      "storageType",
      "pickupLocation",
      "contactPhone",
      "specialInstructions",
      "photoUrl",
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        donation[field] = req.body[field];
      }
    });

    const start =
      req.body.pickupStartTime !== undefined
        ? new Date(req.body.pickupStartTime)
        : donation.pickupStartTime;
    const end =
      req.body.pickupEndTime !== undefined
        ? new Date(req.body.pickupEndTime)
        : donation.pickupEndTime;

    if (!(end > start)) {
      return res.status(400).json({
        success: false,
        message: "pickupEndTime must be greater than pickupStartTime",
      });
    }

    donation.pickupStartTime = start;
    donation.pickupEndTime = end;

    if (typeof donation.quantity === "number") {
      donation.mealsEquivalent = donation.quantity * 2;
    }

    await donation.save();

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteDonation = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation id" });
    }

    const donation = await Donation.findOne({
      _id: id,
      providerId,
      isDeleted: false,
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    donation.isDeleted = true;
    await donation.save();

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const providerId = req.user?.userId;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized provider" });
    }

    const matchStage = {
      providerId: new mongoose.Types.ObjectId(providerId),
      isDeleted: false,
    };

    const [result] = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          activeDonations: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["pending", "accepted", "scheduled"]],
                },
                1,
                0,
              ],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          totalMealsEquivalent: { $sum: "$mealsEquivalent" },
        },
      },
    ]);

    const stats = result || {
      totalDonations: 0,
      activeDonations: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      totalMealsEquivalent: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        totalDonations: stats.totalDonations,
        activeDonations: stats.activeDonations,
        deliveredCount: stats.deliveredCount,
        cancelledCount: stats.cancelledCount,
        totalMealsEquivalent: stats.totalMealsEquivalent,
      },
    });
  } catch (err) {
    return next(err);
  }
};

