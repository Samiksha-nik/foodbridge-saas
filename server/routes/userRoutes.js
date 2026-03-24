const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyJWT } = require("../middleware/authMiddleware");

router.get("/ngo/:id", verifyJWT, userController.getNgoProfile);
router.put("/complete-profile", verifyJWT, userController.completeProfile);

module.exports = router;
