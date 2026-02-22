// models/Subscriber.js
const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

// Prevent a user from subscribing to the same profile twice
subscriberSchema.index({ profile_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Subscriber", subscriberSchema);
