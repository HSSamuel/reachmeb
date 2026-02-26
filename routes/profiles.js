const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.put("/me", authMiddleware, async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: req.body },
      { returnDocument: "after" },
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

router.get("/:username", async (req, res, next) => {
  try {
    // ✅ SECURITY FIX: Strip out 'user_id' so it's not exposed to the public
    const profile = await Profile.findOne({
      username: req.params.username,
    }).select("-user_id");

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    Profile.updateOne({ _id: profile._id }, { $inc: { views: 1 } }).catch(
      (err) => console.error("Failed to update views:", err),
    );

    const Link = require("../models/Link");
    const Product = require("../models/Product");

    const [links, products] = await Promise.all([
      Link.find({ profile_id: profile._id, is_active: true })
        .sort({ sort_order: 1 })
        .lean(),
      Product.find({ profile_id: profile._id, is_active: true })
        .sort({ sort_order: 1 })
        .lean(),
    ]);

    const safeLinks = links.map((link) => {
      if (link.gate_code) {
        return { ...link, url: null, gate_code: true, is_locked: true };
      }
      return { ...link, is_locked: false, gate_code: null };
    });

    const profileResponse = profile.toObject();
    profileResponse.views += 1;

    res.json({
      profile: profileResponse,
      links: safeLinks,
      products: products,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
