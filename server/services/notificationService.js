const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Send the same notification to every admin user (system-wide alerts).
 * @param {{ title: string, message: string, type?: 'success'|'warning'|'info' }} payload
 */
async function notifyAdmins({ title, message, type = "info" }) {
  if (!title || !message) return null;
  try {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (!admins.length) return [];
    return notifyMany(
      admins.map((a) => a._id),
      "admin",
      { title, message, type }
    );
  } catch (err) {
    console.error("[notificationService] notifyAdmins", err);
    return null;
  }
}

async function createNotification({ userId, role, title, message, type = "info" }) {
  if (!userId || !role || !title || !message) return null;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existing = await Notification.findOne({
    userId,
    title,
    createdAt: { $gte: fiveMinutesAgo },
  }).select("_id");

  if (existing) {
    return null;
  }

  return Notification.create({ userId, role, title, message, type, isRead: false });
}

async function notifyMany(userIds, role, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const docs = userIds
    .filter(Boolean)
    .map((id) => ({
      userId: id,
      role,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      isRead: false,
    }));
  if (!docs.length) return [];
  return Notification.insertMany(docs, { ordered: false });
}

module.exports = {
  createNotification,
  notifyMany,
  notifyAdmins,
};

