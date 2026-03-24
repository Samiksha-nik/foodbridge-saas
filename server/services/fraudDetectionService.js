const Donation = require("../models/Donation");
const FraudAlert = require("../models/FraudAlert");
const { notifyAdmins } = require("./notificationService");

const HIGH_QTY_KG = 120;
const HIGH_QTY_GRAMS = 150000;
const HIGH_QTY_PLATES = 250;
const HIGH_QTY_BOXES = 200;
const MAX_DONATIONS_24H = 8;
/** For cooked/perishable: expiry more than this many hours after cooked time is suspicious */
const MAX_EXPIRY_HOURS_PERISHABLE = 72;

async function notifyAdminsFraudTriggered() {
  try {
    await notifyAdmins({
      title: "Fraud Alert Triggered",
      message: "Suspicious activity detected for a donation",
      type: "warning",
    });
  } catch (e) {
    console.error("[fraudDetectionService] notifyAdminsFraudTriggered", e);
  }
}

/**
 * True if donation quantity crosses high-volume thresholds (same rules as fraud high_quantity).
 * Used for optional admin notifications without duplicating logic strings.
 */
function isHighVolumeDonation(donation) {
  if (!donation) return false;
  const q = Number(donation.quantity) || 0;
  const unit = donation.quantityUnit;
  if (unit === "kg" && q >= HIGH_QTY_KG) return true;
  if (unit === "grams" && q >= HIGH_QTY_GRAMS) return true;
  if (unit === "plates" && q >= HIGH_QTY_PLATES) return true;
  if (unit === "boxes" && q >= HIGH_QTY_BOXES) return true;
  return false;
}

/**
 * Avoid duplicate open alerts for the same donation + rule.
 */
async function createAlertIfNeeded(payload) {
  const { userId, donationId, alertType } = payload;
  const existing = await FraudAlert.findOne({
    userId,
    donationId,
    alertType,
    status: { $in: ["open", "investigating"] },
  })
    .select("_id")
    .lean();
  if (existing) return null;
  const doc = await FraudAlert.create(payload);
  await notifyAdminsFraudTriggered();
  return doc;
}

/**
 * At most one "repeated donations" open alert per user per 24h window.
 */
async function createRepeatedDonationsAlertIfNeeded(payload) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await FraudAlert.findOne({
    userId: payload.userId,
    alertType: "repeated_donations",
    status: { $in: ["open", "investigating"] },
    createdAt: { $gte: since },
  })
    .select("_id")
    .lean();
  if (existing) return null;
  const doc = await FraudAlert.create(payload);
  await notifyAdminsFraudTriggered();
  return doc;
}

function baseUserFields(provider) {
  return {
    userEmail: provider.email,
    userName: provider.fullName || provider.organizationName || provider.email || "Unknown",
    userRole: provider.role || "provider",
  };
}

/**
 * Run heuristics after a donation is created. Never throws to caller.
 * @param {import('mongoose').Document} donation - saved Donation doc
 * @param {object} provider - lean user with email, fullName, organizationName, role
 */
async function runDonationFraudChecks(donation, provider) {
  if (!donation || !provider) return;

  const userId = donation.providerId;
  const donationId = donation._id;
  const common = { userId, donationId, ...baseUserFields(provider) };

  try {
    // --- Very high quantity ---
    let highQty = false;
    let qtyReason = "";
    const q = Number(donation.quantity) || 0;
    const unit = donation.quantityUnit;
    if (unit === "kg" && q >= HIGH_QTY_KG) {
      highQty = true;
      qtyReason = `Quantity ${q} kg exceeds threshold (${HIGH_QTY_KG} kg).`;
    } else if (unit === "grams" && q >= HIGH_QTY_GRAMS) {
      highQty = true;
      qtyReason = `Quantity ${q} g exceeds threshold.`;
    } else if (unit === "plates" && q >= HIGH_QTY_PLATES) {
      highQty = true;
      qtyReason = `Quantity ${q} plates exceeds threshold (${HIGH_QTY_PLATES}).`;
    } else if (unit === "boxes" && q >= HIGH_QTY_BOXES) {
      highQty = true;
      qtyReason = `Quantity ${q} boxes exceeds threshold (${HIGH_QTY_BOXES}).`;
    }

    if (highQty) {
      await createAlertIfNeeded({
        ...common,
        alertType: "high_quantity",
        severity: "high",
        reason: qtyReason,
        status: "open",
      });
    }

    // --- Suspicious repeated donations (same provider, 24h) ---
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Donation.countDocuments({
      providerId: userId,
      isDeleted: false,
      createdAt: { $gte: since },
    });
    if (recentCount > MAX_DONATIONS_24H) {
      await createRepeatedDonationsAlertIfNeeded({
        ...common,
        alertType: "repeated_donations",
        severity: "medium",
        reason: `${recentCount} donations created in the last 24 hours (threshold ${MAX_DONATIONS_24H}).`,
        status: "open",
      });
    }

    // --- Unrealistic expiry vs cooked time ---
    if (donation.expiryTime && donation.cookedTime) {
      const cooked = new Date(donation.cookedTime).getTime();
      const expiry = new Date(donation.expiryTime).getTime();
      const hours = (expiry - cooked) / (1000 * 60 * 60);
      const cat = donation.category;

      if (hours < 0) {
        await createAlertIfNeeded({
          ...common,
          alertType: "invalid_expiry",
          severity: "high",
          reason: "Expiry time is before cooked time.",
          status: "open",
        });
      } else if (
        (cat === "cooked" || cat === "perishable") &&
        hours > MAX_EXPIRY_HOURS_PERISHABLE
      ) {
        await createAlertIfNeeded({
          ...common,
          alertType: "unrealistic_expiry",
          severity: "medium",
          reason: `Expiry is ${Math.round(hours)}h after cook for ${cat} food (threshold ${MAX_EXPIRY_HOURS_PERISHABLE}h).`,
          status: "open",
        });
      }
    }
  } catch (err) {
    console.error("[fraudDetectionService] runDonationFraudChecks", err);
  }
}

module.exports = {
  runDonationFraudChecks,
  isHighVolumeDonation,
};
