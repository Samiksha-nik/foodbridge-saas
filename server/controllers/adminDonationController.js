const Donation = require("../models/Donation");

function mapDonationToClient(doc) {
  const p = doc.providerId;
  const n = doc.assignedNgoId;
  const providerName =
    (p && (p.fullName || p.organizationName || p.email)) || "—";
  const ngoName =
    n && (n.ngoName || n.fullName || n.email)
      ? n.ngoName || n.fullName || n.email
      : null;

  const statusUi = doc.status === "picked_up" ? "picked" : doc.status;

  return {
    id: doc._id.toString(),
    food_name: doc.foodName,
    quantity: doc.quantity,
    quantity_unit: doc.quantityUnit,
    quantity_kg: doc.quantityUnit === "kg" ? doc.quantity : null,
    meals_equivalent: doc.mealsEquivalent || 0,
    provider_name: providerName,
    assigned_ngo_name: ngoName,
    urgency: doc.expiryRiskLevel || "medium",
    status: statusUi,
    created_date: doc.createdAt,
  };
}

/**
 * GET /api/admin/donations
 */
exports.getAllDonations = async (req, res, next) => {
  try {
    const docs = await Donation.find({ isDeleted: false })
      .populate("providerId", "fullName organizationName email")
      .populate("assignedNgoId", "ngoName fullName email")
      .sort({ createdAt: -1 })
      .lean();

    const donations = docs.map(mapDonationToClient);

    return res.status(200).json({
      success: true,
      data: { donations },
    });
  } catch (err) {
    return next(err);
  }
};
