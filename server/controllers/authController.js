const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOtp, getOtpExpiry } = require("../utils/generateOtp");
const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/sendOtpEmail");
const {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../utils/generateToken");
const { notifyAdmins } = require("../services/notificationService");

/**
 * POST /api/auth/register
 * Body: { email, password, role }
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    const validRoles = ["provider", "ngo"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'provider' or 'ngo'",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otpCode = generateOtp();
    const otpExpiry = getOtpExpiry();

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: false,
      otpCode,
      otpExpiry,
      registrationCompleted: false,
    });

    await sendOtpEmail(user.email, otpCode);

    await notifyAdmins({
      title: "New User Registered",
      message: `A new ${user.role} has joined the platform`,
      type: "info",
    });
    if (user.role === "ngo") {
      await notifyAdmins({
        title: "New NGO Pending Approval",
        message: "A new NGO is waiting for approval",
        type: "warning",
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      data: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+otpCode +otpExpiry");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "No pending OTP. Request a new one.",
      });
    }

    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > user.otpExpiry) {
      user.otpCode = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Request a new one.",
      });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        role: user.role,
        registrationCompleted: user.registrationCompleted,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        role: user.role,
        registrationCompleted: user.registrationCompleted,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me (requires verifyJWT)
 * Returns current user profile from JWT.
 */
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password -otpCode -otpExpiry")
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        registrationCompleted: user.registrationCompleted,
        fullName: user.fullName,
        organizationName: user.organizationName,
        profileImage: user.profileImage,
        organizationType: user.organizationType,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        pickupStartTime: user.pickupStartTime,
        pickupEndTime: user.pickupEndTime,
        preferredContactMethod: user.preferredContactMethod,
        ngoName: user.ngoName,
        ngoPhone: user.ngoPhone,
        ngoAddress: user.ngoAddress,
        ngoDescription: user.ngoDescription,
        ngoProfileImage: user.ngoProfileImage,
        registrationId: user.registrationId,
        establishedYear: user.establishedYear,
        ngoType: user.ngoType,
        mission: user.mission,
        website: user.website,
        socialLinks: user.socialLinks,
        dailyCapacity: user.dailyCapacity,
        capacityUtilization: user.capacityUtilization,
        storageAvailable: user.storageAvailable,
        coldStorageAvailable: user.coldStorageAvailable,
        pickupRadius: user.pickupRadius,
        ngoPickupStartTime: user.ngoPickupStartTime,
        ngoPickupEndTime: user.ngoPickupEndTime,
        emergencyAvailable: user.emergencyAvailable,
        location: user.location,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/admin-login
 * Body: { email, password }
 * Dedicated admin authentication endpoint.
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }

    if (!user.isVerified || !user.registrationCompleted) {
      return res.status(403).json({
        success: false,
        message: "Admin account is not fully activated",
      });
    }

    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/send-otp
 * Body: { email }
 * Allows resending OTP for existing, not-yet-verified users.
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    const otpCode = generateOtp();
    const otpExpiry = getOtpExpiry();
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(user.email, otpCode);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears auth cookie.
 */
exports.logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Returns generic success message regardless of email existence.
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const frontendUrl =
        process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password/${rawToken}`;

      await sendResetPasswordEmail(user.email, resetUrl);
    }

    res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/reset-password/:token
 * Body: { password }
 * Resets password using token from URL.
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * JWT required.
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/auth/account
 * Delete current user account. JWT required.
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await User.findByIdAndDelete(userId);
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/check-user?email=
 * Lightweight existence/verification check used by frontend.
 */
exports.checkUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "email role isVerified registrationCompleted"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        registrationCompleted: user.registrationCompleted,
      },
    });
  } catch (err) {
    next(err);
  }
};
