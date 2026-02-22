// reachme-backend/routes/profiles.js
const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// @route   GET /api/profiles/me
// @desc    Get current user's profile (Private - for Dashboard)
<<<<<<< HEAD
router.get("/me", authMiddleware, async (req, res) => {
=======
router.get("/me", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   PUT /api/profiles/me
// @desc    Update current user's profile
<<<<<<< HEAD
router.put('/me', authMiddleware, async (req, res) => {
=======
router.put("/me", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: req.body },
<<<<<<< HEAD
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
=======
      { returnDocument: "after" },
    );

    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   GET /api/profiles/:username
// @desc    Get profile by username (Public - for public page)
<<<<<<< HEAD
router.get("/:username", async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
=======
router.get("/:username", async (req, res, next) => {
  try {
    // ✅ Track actual views by incrementing automatically on fetch
    const profile = await Profile.findOneAndUpdate(
      { username: req.params.username },
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

module.exports = router;
