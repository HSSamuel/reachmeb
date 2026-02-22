// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    title: { type: String, required: true },
    price: { type: String, default: "" }, // String to handle currencies like "$10.00"
    product_url: { type: String, required: true },
    image_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
