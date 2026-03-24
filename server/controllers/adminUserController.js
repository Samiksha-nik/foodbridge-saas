const User = require("../models/User");

function mapUserToClient(u) {
  if (!u) return null;
  const org =
    u.role === "ngo"
      ? u.ngoName || ""
      : u.organizationName || "";
  return {
    id: u._id.toString(),
    full_name: u.fullName || "",
    email: u.email,
    organization_name: org,
    created_date: u.createdAt,
    is_blocked: !!u.isBlocked,
    is_approved: !!u.isApproved,
    app_role: u.role,
  };
}

/**
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const selectFields =
      "email fullName organizationName ngoName role isBlocked isApproved createdAt";

    const [providerDocs, ngoDocs] = await Promise.all([
      User.find({ role: "provider" }).select(selectFields).sort({ createdAt: -1 }).lean(),
      User.find({ role: "ngo" }).select(selectFields).sort({ createdAt: -1 }).lean(),
    ]);

    const providers = providerDocs.map(mapUserToClient);
    const ngos = ngoDocs.map(mapUserToClient);

    return res.status(200).json({
      success: true,
      data: { providers, ngos },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/users/:id
 * Body: { is_blocked?: boolean, is_approved?: boolean }
 */
exports.patchAdminUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_blocked, is_approved } = req.body || {};

    const existing = await User.findById(id).select("role").lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (existing.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot modify admin user" });
    }

    const update = {};
    if (typeof is_blocked === "boolean") update.isBlocked = is_blocked;
    if (typeof is_approved === "boolean") update.isApproved = is_approved;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select("email fullName organizationName ngoName role isBlocked isApproved createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: mapUserToClient(user),
    });
  } catch (err) {
    return next(err);
  }
};
