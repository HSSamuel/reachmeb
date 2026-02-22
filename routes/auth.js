// reachme-backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import your models
const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST /api/auth/register
// @desc    Register a user & create their initial profile
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    // 2. Check if username is taken
    let existingProfile = await Profile.findOne({ username });
    if (existingProfile)
      return res.status(400).json({ error: "Username is already taken" });

    // 3. Create the new User
    user = new User({ email, password });

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // 4. Create their associated Profile
    const profile = new Profile({
      user_id: user._id,
      username: username || email.split("@")[0], // fallback username
      full_name: full_name || "",
    });
    await profile.save();

    // 5. Generate JWT Token
    const payload = { user: { id: user._id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user._id, email: user.email } });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid Credentials" });

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

    // 3. Generate JWT Token
    const payload = { user: { id: user._id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user._id, email: user.email } });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user (used for session validation on the frontend)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Don't return the password hash
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
