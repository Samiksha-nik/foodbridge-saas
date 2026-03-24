const mongoose = require("mongoose");
const Rating = require("../models/Rating");

/**
 * POST /api/ratings
 * Body: { donationId, ngoId, providerId, rating, feedback? }
 */
exports.createRating = async (req, res) => {
  try {
    const { donationId, ngoId, providerId, rating, feedback } = req.body;

    if (!donationId || !ngoId || !providerId || rating == null) {
      return res.status(400).json({
        success: false,
        message: "donationId, ngoId, providerId, and rating are required",
      });
    }

    if (!mongoose.isValidObjectId(donationId) || !mongoose.isValidObjectId(ngoId) || !mongoose.isValidObjectId(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donationId, ngoId, or providerId",
      });
    }

    const numRating = Number(rating);
    if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    const doc = await Rating.create({
      donationId,
      ngoId,
      providerId,
      rating: numRating,
      feedback: typeof feedback === "string" ? feedback.trim() : "",
    });

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create rating",
    });
  }
};

/**
 * GET /api/ratings/ngo/:ngoId
 * Returns all ratings for the given NGO (ratings this NGO gave to providers).
 */
exports.getNgoRatings = async (req, res) => {
  try {
    const { ngoId } = req.params;

    if (!mongoose.isValidObjectId(ngoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ngoId",
      });
    }

    const ratings = await Rating.find({ ngoId })
      .sort({ createdAt: -1 })
      .populate("providerId", "fullName email")
      .lean();

    const data = ratings.map((r) => ({
      id: r._id.toString(),
      donationId: r.donationId?.toString(),
      ngoId: r.ngoId?.toString(),
      providerId: r.providerId?._id?.toString(),
      rating: r.rating,
      stars: r.rating,
      feedback: r.feedback || "",
      from_name: r.providerId?.fullName || "Provider",
      created_date: r.createdAt,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch ratings",
    });
  }
};

/**
 * GET /api/ratings/provider
 * Returns all ratings received by the logged-in provider.
 */
exports.getProviderRatings = async (req, res) => {
  try {
    const providerId = req.user?.userId;

    if (!providerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.isValidObjectId(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider id",
      });
    }

    const ratings = await Rating.find({ providerId })
      .sort({ createdAt: -1 })
      .populate("ngoId", "fullName email ngoName")
      .lean();

    const data = ratings.map((r) => ({
      id: r._id.toString(),
      donationId: r.donationId?.toString(),
      ngoId: r.ngoId?._id?.toString(),
      providerId: r.providerId?.toString?.() || providerId,
      rating: r.rating,
      stars: r.rating,
      feedback: r.feedback || "",
      from_name: r.ngoId?.ngoName || r.ngoId?.fullName || "NGO",
      created_date: r.createdAt,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch provider ratings",
    });
  }
};
