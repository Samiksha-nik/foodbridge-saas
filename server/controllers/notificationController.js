const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { createNotification } = require("../services/notificationService");

// POST /api/notifications
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, role, title, message, type } = req.body || {};
    if (!userId || !role || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, role, title, and message are required",
      });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const created = await createNotification({
      userId,
      role,
      title,
      message,
      type: type || "info",
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
};

// GET /api/notifications/:userId?limit=20
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    // user can fetch only own notifications (admin can fetch any)
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    if (!requesterId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (requesterRole !== "admin" && requesterId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const limit = Math.min(Math.max(Number(req.query?.limit) || 20, 1), 50);
    const items = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/notifications/read/:id
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }

    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    if (!requesterId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (requesterRole !== "admin" && notif.userId.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    notif.isRead = true;
    await notif.save();

    return res.status(200).json({ success: true, data: notif });
  } catch (err) {
    return next(err);
  }
};

