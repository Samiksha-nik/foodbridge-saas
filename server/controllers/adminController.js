const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");
const FraudAlert = require("../models/FraudAlert");

const FRAUD_ACTIVE_STATUSES = ["open", "investigating"];

function mapFraudAlertRow(a) {
  if (!a) return null;
  return {
    id: a._id.toString(),
    alert_type: a.alertType,
    severity: a.severity,
    status: a.status,
    user_email: a.userEmail,
    user_name: a.userName,
    user_role: a.userRole || "provider",
    description:
      a.reason ||
      (a.alertType ? String(a.alertType).replace(/_/g, " ") : ""),
    donation_id: a.donationId ? a.donationId.toString() : null,
    created_date: a.createdAt,
  };
}

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
 * GET /api/admin/dashboard
 * Aggregated stats + monthly trend + recent open fraud alerts (single payload for admin home).
 */
exports.getAdminDashboardStats = async (req, res, next) => {
  try {
    const roleMatch = { role: { $in: ["provider", "ngo"] } };

    const [
      totalUsers,
      activeUsers,
      totalDonations,
      delivered,
      mealsAgg,
      openAlerts,
      monthlyRaw,
      recentAlertsDocs,
    ] = await Promise.all([
      User.countDocuments(roleMatch),
      User.countDocuments({ ...roleMatch, isBlocked: { $ne: true } }),
      Donation.countDocuments({ isDeleted: false }),
      Donation.countDocuments({ isDeleted: false, status: "delivered" }),
      Donation.aggregate([
        { $match: { isDeleted: false, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      FraudAlert.countDocuments({ status: { $in: FRAUD_ACTIVE_STATUSES } }),
      Donation.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            donations: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      FraudAlert.find({ status: { $in: FRAUD_ACTIVE_STATUSES } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const mealsSaved = mealsAgg[0]?.total ?? 0;

    const monthlyDonationTrend = (monthlyRaw || []).map((m) => ({
      month: MONTH_NAMES[(m._id.month || 1) - 1],
      donations: m.donations,
    }));

    const recentAlerts = (recentAlertsDocs || []).map((a) => ({
      id: a._id.toString(),
      alert_type: a.alertType,
      severity: a.severity,
      user_email: a.userEmail,
      user_name: a.userName,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDonations,
        delivered,
        mealsSaved,
        openAlerts,
        monthlyDonationTrend,
        recentAlerts,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/donations-summary
 */
exports.getDonationsSummary = async (req, res, next) => {
  try {
    const [summary] = await Donation.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalDonations: { $sum: 1 },
                totalMealsSaved: {
                  $sum: {
                    $cond: [
                      { $gt: ["$mealsEquivalent", 0] },
                      "$mealsEquivalent",
                      { $multiply: ["$quantity", 2] },
                    ],
                  },
                },
              },
            },
          ],
          monthly: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                donations: { $sum: 1 },
              },
            },
            {
              $sort: {
                "_id.year": 1,
                "_id.month": 1,
              },
            },
          ],
        },
      },
    ]);

    const totals = summary?.totals?.[0] || {
      totalDonations: 0,
      totalMealsSaved: 0,
    };

    const monthNames = [
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

    const monthlyData = (summary?.monthly || []).map((m) => ({
      month: monthNames[(m._id.month || 1) - 1],
      donations: m.donations,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalDonations: totals.totalDonations || 0,
        totalMealsSaved: totals.totalMealsSaved || 0,
        monthlyData,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/users-summary
 */
exports.getUsersSummary = async (req, res, next) => {
  try {
    const [summary] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $ne: ["$isBlocked", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totals = summary || { totalUsers: 0, activeUsers: 0 };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: totals.totalUsers || 0,
        activeUsers: totals.activeUsers || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/fraud-alerts
 * Query: status=all|open|investigating|resolved|dismissed (default all), limit (default 200, max 500)
 */
exports.getFraudAlerts = async (req, res, next) => {
  try {
    const scope = (req.query.status || "all").toLowerCase();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 200, 1),
      500
    );

    let filter = {};
    if (scope === "open") {
      filter = { status: { $in: FRAUD_ACTIVE_STATUSES } };
    } else if (scope === "resolved") {
      filter = { status: { $in: ["resolved", "dismissed"] } };
    } else if (
      ["investigating", "resolved", "dismissed", "open"].includes(scope)
    ) {
      filter = { status: scope };
    }

    const alerts = await FraudAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = alerts.map(mapFraudAlertRow);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/fraud-alerts/:id
 * Body: { status: "open" | "investigating" | "resolved" | "dismissed" }
 */
exports.patchFraudAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid alert id" });
    }

    const allowed = ["open", "investigating", "resolved", "dismissed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const alert = await FraudAlert.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();

    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    return res.status(200).json({
      success: true,
      data: mapFraudAlertRow(alert),
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/fraud-alerts/:id/resolve
 */
exports.putResolveFraudAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid alert id" });
    }

    const alert = await FraudAlert.findByIdAndUpdate(
      id,
      { $set: { status: "resolved" } },
      { new: true }
    ).lean();

    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    return res.status(200).json({
      success: true,
      data: mapFraudAlertRow(alert),
    });
  } catch (err) {
    return next(err);
  }
};

