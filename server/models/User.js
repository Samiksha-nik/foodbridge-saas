const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["provider", "ngo", "admin"],
      required: [true, "Role is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },
    registrationCompleted: {
      type: Boolean,
      default: false,
    },
    // Provider profile
    fullName: { type: String, default: "" },
    organizationName: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    organizationType: { type: String, enum: ["", "restaurant", "catering", "individual", "corporate"], default: "" },
    licenseNumber: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    pickupStartTime: { type: Date, default: null },
    pickupEndTime: { type: Date, default: null },
    preferredContactMethod: { type: String, enum: ["phone", "email"], default: "phone" },
    // NGO profile
    ngoName: { type: String, default: "" },
    ngoPhone: { type: String, default: "" },
    ngoAddress: { type: String, default: "" },
    ngoDescription: { type: String, default: "" },
    ngoProfileImage: { type: String, default: "" },
    registrationId: { type: String, default: "" },
    establishedYear: { type: Number, default: null },
    ngoType: {
      type: String,
      enum: ["", "orphanage", "old_age_home", "shelter", "community_kitchen", "disaster_relief", "other"],
      default: "",
    },
    mission: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: { type: [String], default: [] },
    dailyCapacity: { type: Number, default: null, min: 0 },
    capacityUtilization: { type: Number, default: null, min: 0, max: 100 },
    storageAvailable: { type: Boolean, default: false },
    coldStorageAvailable: { type: Boolean, default: false },
    pickupRadius: { type: Number, default: null, min: 0 },
    ngoPickupStartTime: { type: Date, default: null },
    ngoPickupEndTime: { type: Date, default: null },
    emergencyAvailable: { type: Boolean, default: false },
    // GeoJSON location (for NGO/Provider; used for distance-based matching)
    // Extended with convenience lat/lng fields (primarily for NGO role) without breaking existing data.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    // Admin / approval (e.g. for NGO)
    isApproved: { type: Boolean, default: false },
    // Account status
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
