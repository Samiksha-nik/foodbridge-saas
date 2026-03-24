const mongoose = require("mongoose");

const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      index: true,
    },
    ngoId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

ratingSchema.index({ ngoId: 1, createdAt: -1 });

module.exports = mongoose.model("Rating", ratingSchema);
