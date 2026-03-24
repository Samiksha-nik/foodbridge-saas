const mongoose = require("mongoose");

const { Schema } = mongoose;

const fraudAlertSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donationId: {
      type: Schema.Types.ObjectId,
      ref: "Donation",
      default: null,
      index: true,
    },
    alertType: {
      type: String,
      required: true,
      trim: true,
    },
    /** Human-readable explanation for admins (UI description). */
    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: String,
      default: "provider",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

fraudAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FraudAlert", fraudAlertSchema);

