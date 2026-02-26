const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
const Parser = require("rss-parser");
const { deleteCloudinaryFile } = require("../utils/cloudinaryHelper");
const parser = new Parser();

// Prevent spamming clicks
const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests from this IP, please try again later." },
});

// Prevents database race conditions during viral traffic spikes
const clickBatch = new Map();

// ✅ PERFORMANCE: Extracted flush logic to allow graceful shutdown
const flushClicks = async () => {
  if (clickBatch.size === 0) return;

  const batch = new Map(clickBatch);
  clickBatch.clear();

  for (const [id, clicks] of batch.entries()) {
    try {
      await Link.findByIdAndUpdate(id, { $inc: { clicks: clicks } });
    } catch (err) {
      console.error(`Failed to flush clicks for link ${id}:`, err);
    }
  }
};

setInterval(flushClicks, 30000);

const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

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

router.get("/public/:profileId", async (req, res, next) => {
  try {
    const links = await Link.find({
      profile_id: req.params.profileId,
      is_active: true,
    })
      .sort({ sort_order: 1 })
      .lean();

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

router.post("/:id/sync", authMiddleware, async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ error: "Link not found" });
    if (!link.is_dynamic || !link.rss_url)
      return res.status(400).json({ error: "Not a dynamic link" });

    const feed = await parser.parseURL(link.rss_url);
    if (feed.items && feed.items.length > 0) {
      const latestItem = feed.items[0];
      link.title = latestItem.title || link.title;
      link.url = latestItem.link || link.url;
      await link.save();
    }
    res.json(link);
  } catch (err) {
    console.error("RSS Sync Error:", err);
    res
      .status(500)
      .json({
        error: "Failed to sync feed. Ensure the URL is a valid RSS/XML feed.",
      });
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const profileId = await getProfileId(req.user.id);
    const newLink = new Link({ ...req.body, profile_id: profileId });
    const link = await newLink.save();
    res.json(link);
  } catch (err) {
    next(err);
  }
});

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

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    if (link.thumbnail_url) {
      await deleteCloudinaryFile(link.thumbnail_url);
    }

    await Link.findByIdAndDelete(req.params.id);
    res.json({ msg: "Link removed" });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/click", clickLimiter, async (req, res, next) => {
  try {
    const id = req.params.id;
    clickBatch.set(id, (clickBatch.get(id) || 0) + 1);
    res.json({ msg: "Click registered in queue" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// Attach to router object so it can be called from server.js
module.exports.flushClicks = flushClicks;
