const mongoose = require("mongoose");

const { Schema } = mongoose;

const donationSchema = new Schema(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Food details
    foodName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: ["cooked", "raw", "perishable", "non_perishable"],
      required: true,
    },
    isVeg: {
      type: String,
      enum: ["veg", "non_veg", "jain"],
      required: true,
    },
    containsAllergens: {
      type: [String],
      default: [],
    },
    isSealedPack: {
      type: Boolean,
      default: false,
    },

    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityUnit: {
      type: String,
      enum: ["kg", "grams", "litres", "packets", "plates", "boxes"],
      required: true,
    },

    // Time info
    cookedTime: {
      type: Date,
      required: true,
    },
    expiryTime: {
      type: Date,
    },
    pickupStartTime: {
      type: Date,
      required: true,
    },
    pickupEndTime: {
      type: Date,
      required: true,
    },

    // Storage
    storageType: {
      type: String,
      enum: ["room_temperature", "refrigerated", "frozen"],
      required: true,
    },

    // Location
    pickupLat: { type: Number, default: null },
    pickupLng: { type: Number, default: null },
    pickupLocation: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: "pickupLocation.coordinates must be an array of [lng, lat]",
        },
      },
    },

    // Contact
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    specialInstructions: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    // Media
    photoUrl: {
      type: String,
      trim: true,
    },

    // Status workflow
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "scheduled",
        "picked_up",
        "delivered",
        "cancelled",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    // Assignment
    assignedNgoId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // AI / System fields
    mealsEquivalent: {
      type: Number,
      default: 0,
      min: 0,
    },
    predictedExpiry: {
      type: Date,
    },
    expiryRiskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    aiRecommendedNgo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    deliveryProofUrls: {
      type: [String],
      default: [],
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.pre("save", function (next) {
  if (this.pickupLocation?.coordinates?.length === 2) {
    this.pickupLat = this.pickupLocation.coordinates[1];
    this.pickupLng = this.pickupLocation.coordinates[0];
  }
  next();
});

donationSchema.index({ "pickupLocation.coordinates": "2dsphere" });
donationSchema.index({ providerId: 1, status: 1, isDeleted: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Donation", donationSchema);

