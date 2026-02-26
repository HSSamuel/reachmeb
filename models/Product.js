const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    title: { type: String, required: true },
    price: { type: String, default: "" },
    product_url: { type: String, required: true },
    image_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ✅ PERFORMANCE FIX: Included 'is_active' in the compound index for perfect index coverage on the public route
productSchema.index({ profile_id: 1, is_active: 1, sort_order: 1 });

module.exports = mongoose.model("Product", productSchema);
