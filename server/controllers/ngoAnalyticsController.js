const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const PickupRequest = require("../models/PickupRequest");
const Rating = require("../models/Rating");
const FraudAlert = require("../models/FraudAlert");

function dayLabel(d) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday as start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(d) {
  const start = startOfWeek(d);
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function safeNumber(n, fallback = 0) {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

exports.getNgoAnalytics = async (req, res, next) => {
  try {
    const ngoId = req.user?.userId;
    if (!ngoId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const days = (() => {
      const raw = req.query?.days;
      const n = raw ? Number(raw) : 30;
      return n === 7 || n === 30 ? n : 30;
    })();

    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Acceptance rate from PickupRequest statuses
    const reqFilter = {
      ngoId: new mongoose.Types.ObjectId(ngoId),
      createdAt: { $gte: from },
    };

    const [requestsTotal, requestsAccepted] = await Promise.all([
      PickupRequest.countDocuments({
        ...reqFilter,
        status: { $in: ["pending", "accepted", "rejected", "cancelled"] },
      }),
      PickupRequest.countDocuments({
        ...reqFilter,
        status: "accepted",
      }),
    ]);

    const acceptanceRate =
      requestsTotal > 0 ? Math.round((requestsAccepted / requestsTotal) * 100) : 0;

    // Donations in the selected window
    const donationFilter = {
      assignedNgoId: new mongoose.Types.ObjectId(ngoId),
      isDeleted: false,
      updatedAt: { $gte: from },
      status: { $in: ["accepted", "picked_up", "delivered"] },
    };

    const donationsForWindow = await Donation.find(donationFilter)
      .select("status category mealsEquivalent createdAt updatedAt foodName")
      .lean();

    const deliveredDonations = donationsForWindow.filter(
      (d) => d.status === "delivered"
    );

    const completionRate =
      requestsAccepted > 0
        ? Math.round((deliveredDonations.length / requestsAccepted) * 100)
        : 0;

    // Avg pickup time (proxy): use delivered donation updatedAt - createdAt if accepted/delivered timestamps aren't guaranteed.
    const pickupTimesHours = deliveredDonations
      .map((d) => {
        const a = d.createdAt ? new Date(d.createdAt).getTime() : null;
        const b = d.updatedAt ? new Date(d.updatedAt).getTime() : null;
        if (!a || !b) return null;
        const diff = b - a;
        return diff > 0 ? diff / (1000 * 60 * 60) : null;
      })
      .filter((x) => typeof x === "number" && Number.isFinite(x));

    const avgPickupTime =
      pickupTimesHours.length > 0
        ? Number(
            (
              pickupTimesHours.reduce((s, x) => s + x, 0) / pickupTimesHours.length
            ).toFixed(2)
          )
        : null;

    // Pickups trend: group by day for 7d, week for 30d
    const trendGrouping =
      days === 7
        ? {
            keyFn: (d) => new Date(d).toISOString().slice(0, 10),
            labelFn: (d) => dayLabel(d),
          }
        : {
            keyFn: (d) => startOfWeek(d).toISOString().slice(0, 10),
            labelFn: (d) => weekLabel(d),
          };

    const pickupsTrendMap = new Map(); // key -> { label, pickups, sortTs }
    donationsForWindow.forEach((d) => {
      const ts = new Date(d.updatedAt || d.createdAt);
      const key = trendGrouping.keyFn(ts);
      const label = trendGrouping.labelFn(ts);
      const cur = pickupsTrendMap.get(key) || { label, pickups: 0, sortTs: ts.getTime() };
      cur.pickups += 1;
      pickupsTrendMap.set(key, cur);
    });

    const pickupsTrend = Array.from(pickupsTrendMap.values())
      .sort((a, b) => a.sortTs - b.sortTs)
      .map(({ label, pickups }) => ({ label, pickups }));

    // Category distribution (dynamic)
    const categoryMap = new Map();
    donationsForWindow.forEach((d) => {
      const key = d.category || "other";
      categoryMap.set(key, safeNumber(categoryMap.get(key), 0) + 1);
    });
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Impact stats from delivered donations
    const mealsSaved = deliveredDonations.reduce(
      (s, d) => s + safeNumber(d.mealsEquivalent, 0),
      0
    );

    // Since the backend doesn't track "wasteSaved" explicitly, we reuse mealsEquivalent as an operational proxy.
    const foodWasteReduced = mealsSaved;
    const peopleServed = mealsSaved;

    // Recent activity
    const recentActivityRaw = await Donation.find({
      assignedNgoId: new mongoose.Types.ObjectId(ngoId),
      isDeleted: false,
      status: { $in: ["accepted", "picked_up", "delivered"] },
      updatedAt: { $gte: from },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("status foodName updatedAt")
      .lean();

    const recentActivity = recentActivityRaw.map((d) => {
      let actionType = d.status;
      if (d.status === "picked_up") actionType = "picked_up";
      if (d.status === "delivered") actionType = "delivered";
      if (d.status === "accepted") actionType = "accepted";
      return {
        actionType,
        text: d.foodName || actionType.replace("_", " "),
        timestamp: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      };
    });

    // Trust score proxy for backend metrics box (same idea as AI: fraud open count)
    const [fraudOpenCount, ratingAgg] = await Promise.all([
      FraudAlert.countDocuments({ userId: ngoId, status: "open" }),
      Rating.aggregate([
        { $match: { ngoId: new mongoose.Types.ObjectId(ngoId) } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
    ]);
    const avgRating = ratingAgg?.[0]?.count ? ratingAgg[0].avg : null;
    const aiTrustScore = Math.round((1 / (fraudOpenCount + 1)) * 100);

    return res.status(200).json({
      success: true,
      metrics: {
        acceptanceRate,
        completionRate,
        avgPickupTime,
        avgRating,
        aiTrustScore,
      },
      pickupsTrend,
      categoryDistribution,
      impactStats: {
        mealsSaved,
        foodWasteReduced,
        peopleServed,
      },
      recentActivity,
    });
  } catch (err) {
    return next(err);
  }
};

