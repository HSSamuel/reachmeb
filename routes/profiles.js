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
// @desc    Get profile by username (Public - for public page)
router.get("/:username", async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // ✅ PERFORMANCE FIX: Asynchronously update views without blocking the read request
    Profile.updateOne({ _id: profile._id }, { $inc: { views: 1 } }).catch(
      (err) => console.error("Failed to update views:", err)
    );

    // Manually increment the view count on the returned object so the frontend gets the latest number instantly
    const profileResponse = profile.toObject();
    profileResponse.views += 1;

    res.json(profileResponse);
  } catch (err) {
    next(err);
  }
});

module.exports = router;