const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
require("../config/passport");

const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ SECURITY: Rate limiter for registration and login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: "Too many attempts, please try again after 15 minutes." },
});

// Helper function to set HttpOnly Cookie
const setTokenCookie = (res, userId) => {
  const payload = { user: { id: userId } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  
  // ✅ FIX: Allow cookies over HTTP for local development, enforce secure over HTTPS for prod
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("reachme_token", token, {
    httpOnly: true,
    secure: isProduction, 
    sameSite: isProduction ? "none" : "lax", 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
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

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password, full_name, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

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
      username: finalUsername.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      full_name: full_name || "",
    });
    await profile.save();

    setTokenCookie(res, user._id);
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
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
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("reachme_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
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