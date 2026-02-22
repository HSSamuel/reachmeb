// reachme-backend/routes/subscribers.js
const express = require("express");
const router = express.Router();
const Subscriber = require("../models/Subscriber");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST /api/subscribers
// @desc    Add a new subscriber (Public)
router.post("/", async (req, res) => {
  try {
    const { email, profile_id } = req.body;

    const newSubscriber = new Subscriber({ email, profile_id });
    await newSubscriber.save();

    res.json({ msg: "Subscribed successfully" });
  } catch (err) {
    console.error(err.message);
    // Handle duplicate emails (Mongoose error code 11000)
    if (err.code === 11000) {
      return res.status(400).json({ error: "You are already subscribed!" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/subscribers
// @desc    Get all subscribers for the logged-in user (Private)
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Find the current user's profile ID
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Fetch subscribers for that profile
    const subscribers = await Subscriber.find({ profile_id: profile._id }).sort(
      { created_at: -1 },
    );
    res.json(subscribers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
