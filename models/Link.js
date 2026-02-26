const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    gate_code: { type: String, default: null },
    is_dynamic: { type: Boolean, default: false },
    rss_url: { type: String, default: "" },
  },
  { timestamps: true },
);

// ✅ PERFORMANCE FIX: Included 'is_active' in the compound index for perfect index coverage on the public route
linkSchema.index({ profile_id: 1, is_active: 1, sort_order: 1 });

module.exports = mongoose.model("Link", linkSchema);
