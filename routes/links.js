// reachme-backend/routes/links.js
const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

// Prevent spamming clicks
const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 clicks per link per window
  message: { error: "Too many requests from this IP, please try again later." },
});

// Helper function to get profile_id from user_id
const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

// @route   GET /api/links
// @desc    Get all links for logged-in user (Private)
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const profileId = await getProfileId(req.user.id);
    const links = await Link.find({ profile_id: profileId }).sort({
      sort_order: 1,
    });
    res.json(links);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/links/public/:profileId
// @desc    Get all ACTIVE links for a public profile (Public - Scrubbed)
router.get("/public/:profileId", async (req, res, next) => {
  try {
    const links = await Link.find({
      profile_id: req.params.profileId,
      is_active: true,
    })
      .sort({ sort_order: 1 })
      .lean();

    // ✅ VULNERABILITY FIX: Hide URL and PIN from the public payload
    const safeLinks = links.map((link) => {
      if (link.gate_code) {
        return { ...link, url: null, gate_code: true, is_locked: true };
      }
      return { ...link, is_locked: false, gate_code: null };
    });

    res.json(safeLinks);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/links/:id/unlock
// @desc    Verify PIN to retrieve hidden URL
router.post("/:id/unlock", async (req, res, next) => {
  try {
    const { pin } = req.body;
    const link = await Link.findById(req.params.id);

    if (!link) return res.status(404).json({ error: "Link not found" });
    if (link.gate_code !== pin)
      return res.status(401).json({ error: "Invalid PIN" });

    res.json({ url: link.url });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/links
// @desc    Create a new link (Private)
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const profileId = await getProfileId(req.user.id);

    const newLink = new Link({
      ...req.body,
      profile_id: profileId,
    });

    const link = await newLink.save();
    res.json(link);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/links/reorder
// @desc    Update sort_order for multiple links (Private)
router.put("/reorder", authMiddleware, async (req, res, next) => {
  try {
    const { updates } = req.body;

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { sort_order: update.sort_order } },
      },
    }));

    await Link.bulkWrite(bulkOps);
    res.json({ msg: "Reordered successfully" });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/links/:id
// @desc    Update a specific link
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after" },
    );
    res.json(link);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/links/:id
// @desc    Delete a link (Private)
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await Link.findByIdAndDelete(req.params.id);
    res.json({ msg: "Link removed" });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/links/:id/click
// @desc    Increment click counter (Public)
router.post("/:id/click", clickLimiter, async (req, res, next) => {
  try {
    await Link.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ msg: "Click registered" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
