const User = require("../models/User");

const PROVIDER_PROFILE_FIELDS = [
  "organizationName",
  "profileImage",
  "organizationType",
  "licenseNumber",
  "phone",
  "address",
  "bio",
  "pickupStartTime",
  "pickupEndTime",
  "preferredContactMethod",
];

const ORG_TYPES = ["restaurant", "catering", "individual", "corporate"];
const CONTACT_METHODS = ["phone", "email"];

/**
 * PUT /api/providers/profile
 * Update provider profile. JWT + provider role required.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updates = {};

    for (const field of PROVIDER_PROFILE_FIELDS) {
      if (req.body[field] === undefined) continue;
      if (field === "organizationType" && req.body[field] !== "") {
        if (!ORG_TYPES.includes(req.body[field])) {
          return res.status(400).json({
            success: false,
            message: `organizationType must be one of: ${ORG_TYPES.join(", ")}`,
          });
        }
      }
      if (field === "preferredContactMethod" && req.body[field]) {
        if (!CONTACT_METHODS.includes(req.body[field])) {
          return res.status(400).json({
            success: false,
            message: "preferredContactMethod must be 'phone' or 'email'",
          });
        }
      }
      if (field === "pickupStartTime" || field === "pickupEndTime") {
        const val = req.body[field];
        updates[field] = val ? new Date(val) : null;
        continue;
      }
      updates[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
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

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        organizationName: user.organizationName,
        profileImage: user.profileImage,
        organizationType: user.organizationType,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        pickupStartTime: user.pickupStartTime,
        pickupEndTime: user.pickupEndTime,
        preferredContactMethod: user.preferredContactMethod,
      },
    });
  } catch (err) {
    next(err);
  }
};
