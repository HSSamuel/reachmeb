// models/Profile.js
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: { type: String, required: true, unique: true, lowercase: true },
    full_name: { type: String, default: "" },
    profile_title: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar_url: { type: String, default: "" },
    story_video_url: { type: String, default: "" },

    // Theme & Appearance
    is_public: { type: Boolean, default: true },
    background_color: { type: String, default: "#f8fafc" },
    background_url: { type: String, default: "" },
    theme_color: { type: String, default: "#000000" },
    button_style: { type: String, default: "rounded-full" },
    font_family: { type: String, default: "Inter" },

    // Socials
    social_email: { type: String, default: "" },
    social_phone: { type: String, default: "" },
    social_whatsapp: { type: String, default: "" },
    social_instagram: { type: String, default: "" },
    social_tiktok: { type: String, default: "" },
    social_twitter: { type: String, default: "" },
    social_snapchat: { type: String, default: "" },
    social_facebook: { type: String, default: "" },
    social_linkedin: { type: String, default: "" },
    social_youtube: { type: String, default: "" },
    social_discord: { type: String, default: "" },
    social_spotify: { type: String, default: "" },
    social_github: { type: String, default: "" },
    social_twitch: { type: String, default: "" },

    // Features
    tipping_enabled: { type: Boolean, default: false },
    tipping_title: { type: String, default: "Support Me" },
    tipping_url: { type: String, default: "" },
    newsletter_enabled: { type: Boolean, default: false },
    newsletter_title: { type: String, default: "Join my newsletter" },

    // SEO
    meta_title: { type: String, default: "" },
    meta_description: { type: String, default: "" },

    // Analytics
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Profile", profileSchema);
