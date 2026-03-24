const User = require("../models/User");

/**
 * GET /api/users/ngo/:id
 * Returns public NGO profile info by id. JWT required.
 */
exports.getNgoProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: "ngo", isApproved: true })
      .select("ngoName fullName email ngoPhone ngoAddress ngoDescription")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "NGO not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.ngoName || user.fullName || "NGO",
        email: user.email,
        phone: user.ngoPhone,
        address: user.ngoAddress,
        description: user.ngoDescription,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/complete-profile
 * JWT required. Body depends on role (provider vs ngo).
 */
exports.completeProfile = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    const providerFields = ["fullName", "organizationName", "phone", "address", "bio"];
    const ngoFields = ["ngoName", "ngoPhone", "ngoAddress", "ngoDescription", "location"];

    const updates = {};

    if (role === "provider") {
      for (const field of providerFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }
    } else if (role === "ngo") {
      for (const field of ngoFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }
      // Normalize location to GeoJSON Point [lng, lat]
      if (req.body.location && Array.isArray(req.body.location.coordinates) && req.body.location.coordinates.length === 2) {
        updates.location = {
          type: "Point",
          coordinates: req.body.location.coordinates,
        };
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Complete profile is only for provider or ngo role",
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    updates.registrationCompleted = true;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -otpCode -otpExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      data: {
        email: user.email,
        role: user.role,
        registrationCompleted: user.registrationCompleted,
        fullName: user.fullName,
        organizationName: user.organizationName,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        ngoName: user.ngoName,
        ngoPhone: user.ngoPhone,
        ngoAddress: user.ngoAddress,
        ngoDescription: user.ngoDescription,
      },
    });
  } catch (err) {
    next(err);
  }
};
