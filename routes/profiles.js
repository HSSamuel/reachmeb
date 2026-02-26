// reachme-backend/routes/profiles.js
const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// @route   GET /api/profiles/me
// @desc    Get current user's profile (Private - for Dashboard)
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/profiles/me
// @desc    Update current user's profile
router.put("/me", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: req.body },
      { returnDocument: "after" }, // ✅ Fixed deprecation warning
    );

    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    next(err);
  }
});

// @route   GET /api/profiles/:username
// @desc    Get profile, active links, and active products in one request
router.get("/:username", async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Asynchronously update views
    Profile.updateOne({ _id: profile._id }, { $inc: { views: 1 } }).catch(
      (err) => console.error("Failed to update views:", err)
    );

    // Fetch Links and Products in parallel on the server (much faster)
    const Link = require("../models/Link");
    const Product = require("../models/Product");

    const [links, products] = await Promise.all([
      Link.find({ profile_id: profile._id, is_active: true })
          .sort({ sort_order: 1 })
          .lean(),
      Product.find({ profile_id: profile._id, is_active: true })
             .sort({ sort_order: 1 })
             .lean()
    ]);

    // Scrub locked links (keep PIN protection safe)
    const safeLinks = links.map((link) => {
      if (link.gate_code) {
        return { ...link, url: null, gate_code: true, is_locked: true };
      }
      return { ...link, is_locked: false, gate_code: null };
    });

    const profileResponse = profile.toObject();
    profileResponse.views += 1;

    // Return everything in one single JSON payload
    res.json({
      profile: profileResponse,
      links: safeLinks,
      products: products
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;