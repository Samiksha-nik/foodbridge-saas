const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyJWT } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.post("/admin-login", authController.adminLogin);
router.post("/send-otp", authController.sendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.put("/reset-password/:token", authController.resetPassword);
router.post("/logout", authController.logout);
router.get("/me", verifyJWT, authController.me);
router.put("/change-password", verifyJWT, authController.changePassword);
router.delete("/account", verifyJWT, authController.deleteAccount);
router.get("/check-user", authController.checkUser);

module.exports = router;
