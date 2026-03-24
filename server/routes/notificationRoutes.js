const express = require("express");
const notificationController = require("../controllers/notificationController");
const { verifyJWT } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyJWT);

router.post("/", notificationController.createNotification);
router.get("/:userId", notificationController.getUserNotifications);
router.put("/read/:id", notificationController.markAsRead);

module.exports = router;

