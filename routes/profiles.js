// reachme-backend/routes/profiles.js
const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// @route   GET /api/profiles/me
// @desc    Get current user's profile (Private - for Dashboard)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/profiles/me
// @desc    Update current user's profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: req.body },
      { returnDocument: 'after' } // ✅ Fixed deprecation warning
    );
    
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profiles/:username
// @desc    Get profile by username (Public - for public page)
router.get("/:username", async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
