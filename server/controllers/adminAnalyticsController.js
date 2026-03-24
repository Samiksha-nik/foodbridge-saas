const Donation = require("../models/Donation");
const User = require("../models/User");
const FraudAlert = require("../models/FraudAlert");

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * GET /api/admin/analytics
 */
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      totalDonations,
      deliveredDonations,
      mealsAgg,
      monthlyVsRaw,
      statusAgg,
      providerCount,
      ngoCount,
      userGrowthRaw,
      topNgoAgg,
      fraudOpenCount,
      fraudResolvedCount,
    ] = await Promise.all([
      Donation.countDocuments({ isDeleted: false }),
      Donation.countDocuments({ isDeleted: false, status: "delivered" }),
      Donation.aggregate([
        { $match: { isDeleted: false, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      Donation.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
            delivered: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Donation.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: "provider" }),
      User.countDocuments({ role: "ngo" }),
      User.aggregate([
        { $match: { role: { $in: ["provider", "ngo"] } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Donation.aggregate([
        {
          $match: {
            isDeleted: false,
            status: "delivered",
            assignedNgoId: { $ne: null },
          },
        },
        { $group: { _id: "$assignedNgoId", deliveredCount: { $sum: 1 } } },
        { $sort: { deliveredCount: -1 } },
        { $limit: 1 },
      ]),
      FraudAlert.countDocuments({
        status: { $in: ["open", "investigating"] },
      }),
      FraudAlert.countDocuments({ status: "resolved" }),
    ]);

    const mealsSaved = mealsAgg[0]?.total ?? 0;

    const monthlyDonationTrend = (monthlyVsRaw || []).map((m) => ({
      _id: m._id,
      count: m.total,
      month: MONTH_NAMES[(m._id.month || 1) - 1],
    }));

    const monthlyDonationsVsDeliveries = (monthlyVsRaw || []).map((m) => ({
      month: MONTH_NAMES[(m._id.month || 1) - 1],
      monthLabel: `${MONTH_NAMES[(m._id.month || 1) - 1]} ${m._id.year}`,
      total: m.total,
      delivered: m.delivered,
    }));

    const statusMap = {};
    (statusAgg || []).forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const expiredCount = statusMap.expired || 0;
    const expiredPercentOfTotal =
      totalDonations > 0 ? (expiredCount / totalDonations) * 100 : 0;

    /** Pie + labels: core workflow statuses (picked = picked_up in DB) */
    const statusDistributionAll = [
      { name: "pending", value: statusMap.pending || 0 },
      { name: "accepted", value: statusMap.accepted || 0 },
      { name: "picked", value: statusMap.picked_up || 0 },
      { name: "delivered", value: statusMap.delivered || 0 },
      { name: "expired", value: statusMap.expired || 0 },
    ];

    /** For Recharts pie: only positive slices (zeros omitted) */
    const statusDistribution = statusDistributionAll.filter((x) => x.value > 0);

    /** Full breakdown for tooltips / tables */
    const statusDistributionFull = [
      ...statusDistributionAll,
      { name: "scheduled", value: statusMap.scheduled || 0 },
      { name: "cancelled", value: statusMap.cancelled || 0 },
    ];

    const totalUsers = providerCount + ngoCount;

    const userGrowthByMonth = (userGrowthRaw || []).map((m) => ({
      month: MONTH_NAMES[(m._id.month || 1) - 1],
      monthLabel: `${MONTH_NAMES[(m._id.month || 1) - 1]} ${m._id.year}`,
      users: m.users,
      year: m._id.year,
      monthIndex: m._id.month,
    }));

    const userGrowthTotal = (userGrowthRaw || []).reduce(
      (s, m) => s + (m.users || 0),
      0
    );
    const hasEnoughUserGrowthData =
      (userGrowthRaw || []).length >= 2 && userGrowthTotal > 0;

    const platformEfficiencyPercent =
      totalDonations > 0
        ? Math.round((deliveredDonations / totalDonations) * 1000) / 10
        : 0;
    const successRatePercent = platformEfficiencyPercent;

    let topNgo = null;
    if (topNgoAgg?.length && topNgoAgg[0]._id) {
      const ngoUser = await User.findById(topNgoAgg[0]._id)
        .select("ngoName fullName email")
        .lean();
      if (ngoUser) {
        topNgo = {
          name:
            ngoUser.ngoName ||
            ngoUser.fullName ||
            ngoUser.email ||
            "Unknown NGO",
          deliveredCount: topNgoAgg[0].deliveredCount,
        };
      }
    }

    const expiryInsight = {
      expiredPercent:
        Math.round(expiredPercentOfTotal * 10) / 10,
      showWarning: expiredPercentOfTotal > 30,
    };

    const fraudInsight = {
      open: fraudOpenCount,
      resolved: fraudResolvedCount,
    };

    return res.status(200).json({
      success: true,
      data: {
        monthlyDonationTrend,
        monthlyDonationsVsDeliveries,
        userGrowthByMonth,
        hasEnoughUserGrowthData,
        donationsVsDeliveries: {
          totalDonations,
          deliveredDonations,
        },
        statusDistribution,
        statusDistributionFull,
        statusDistributionAll,
        summary: {
          totalUsers,
          providers: providerCount,
          ngos: ngoCount,
          totalDonations,
          deliveredDonations,
          mealsSaved,
          platformEfficiencyPercent,
          successRatePercent,
        },
        insights: {
          topNgo,
          expiryInsight,
          fraudInsight,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};
