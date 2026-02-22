const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
require("../config/passport"); // Initialize strategies

const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

<<<<<<< HEAD
=======
// Helper function to set HttpOnly Cookie
const setTokenCookie = (res, userId) => {
  const payload = { user: { id: userId } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("reachme_token", token, {
    httpOnly: true,
    secure: true,    // ✅ MUST be true for Render -> Netlify
    sameSite: "none", // ✅ MUST be "none" for Render -> Netlify
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
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
<<<<<<< HEAD
    const payload = { user: { id: req.user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
=======
    setTokenCookie(res, req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
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
<<<<<<< HEAD
    const payload = { user: { id: req.user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
=======
    setTokenCookie(res, req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  },
);

// --- EXISTING EMAIL ROUTES ---

<<<<<<< HEAD
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });
    let existingProfile = await Profile.findOne({ username });
=======
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
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
    if (existingProfile)
      return res.status(400).json({ error: "Username is already taken" });

    user = new User({ email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const profile = new Profile({
      user_id: user._id,
<<<<<<< HEAD
      username: username || email.split("@")[0],
=======
      username: finalUsername.toLowerCase().replace(/[^a-z0-9-]/g, ""), // Sanitize
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
      full_name: full_name || "",
    });
    await profile.save();

<<<<<<< HEAD
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
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
=======
    setTokenCookie(res, user._id);
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid Credentials" });
<<<<<<< HEAD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

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
    res.status(500).send("Server error");
  }
});

router.get("/me", authMiddleware, async (req, res) => {
=======

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

    setTokenCookie(res, user._id);
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("reachme_token");
  res.json({ msg: "Logged out successfully" });
});

router.get("/me", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
<<<<<<< HEAD
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

module.exports = router;
