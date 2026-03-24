const mongoose = require("mongoose");

const { Schema } = mongoose;

const pickupRequestSchema = new Schema(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ngoId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    aiScore: {
      type: Number,
      default: null,
    },
    distance: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pickupRequestSchema.index(
  { donationId: 1, ngoId: 1 },
  { unique: true }
);

module.exports = mongoose.model("PickupRequest", pickupRequestSchema);

