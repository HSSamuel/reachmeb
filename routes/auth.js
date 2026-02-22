const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
require("../config/passport"); // Initialize strategies

const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// Helper function to set HttpOnly Cookie
const setTokenCookie = (res, userId) => {
  const payload = { user: { id: userId } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("reachme_token", token, {
    httpOnly: true,
    secure: true, // ✅ MUST be true for cross-origin (Render -> Netlify)
    sameSite: "none", // ✅ MUST be "none" for cross-origin (Render -> Netlify)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
  });
};

// --- SOCIAL AUTH ROUTES ---

// Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    setTokenCookie(res, req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  },
);

// GitHub
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    setTokenCookie(res, req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  },
);

// --- EXISTING EMAIL ROUTES ---

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, full_name, username } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    // Safe username generation
    const finalUsername =
      username || email.split("@")[0] + Math.floor(Math.random() * 1000);

    let existingProfile = await Profile.findOne({ username: finalUsername });
    if (existingProfile)
      return res.status(400).json({ error: "Username is already taken" });

    user = new User({ email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const profile = new Profile({
      user_id: user._id,
      username: finalUsername.toLowerCase().replace(/[^a-z0-9-]/g, ""), // Sanitize
      full_name: full_name || "",
    });
    await profile.save();

    setTokenCookie(res, user._id);
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

    setTokenCookie(res, user._id);
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("reachme_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ msg: "Logged out successfully" });
});

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
