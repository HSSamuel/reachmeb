// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required because users logging in with Google/GitHub won't have a password
      required: false,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "github"],
      default: "email",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
