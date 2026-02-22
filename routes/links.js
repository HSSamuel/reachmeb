// reachme-backend/routes/links.js
const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");
<<<<<<< HEAD
=======
const rateLimit = require("express-rate-limit");

// Prevent spamming clicks
const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 clicks per link per window
  message: { error: "Too many requests from this IP, please try again later." },
});
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)

// Helper function to get profile_id from user_id
const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

// @route   GET /api/links
// @desc    Get all links for logged-in user (Private)
<<<<<<< HEAD
router.get("/", authMiddleware, async (req, res) => {
=======
router.get("/", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const profileId = await getProfileId(req.user.id);
    const links = await Link.find({ profile_id: profileId }).sort({
      sort_order: 1,
    });
    res.json(links);
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   GET /api/links/public/:profileId
<<<<<<< HEAD
// @desc    Get all ACTIVE links for a public profile (Public)
router.get("/public/:profileId", async (req, res) => {
=======
// @desc    Get all ACTIVE links for a public profile (Public - Scrubbed)
router.get("/public/:profileId", async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const links = await Link.find({
      profile_id: req.params.profileId,
      is_active: true,
<<<<<<< HEAD
    }).sort({ sort_order: 1 });
    res.json(links);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
=======
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
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   POST /api/links
// @desc    Create a new link (Private)
<<<<<<< HEAD
router.post("/", authMiddleware, async (req, res) => {
=======
router.post("/", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const profileId = await getProfileId(req.user.id);

    const newLink = new Link({
      ...req.body,
      profile_id: profileId,
    });

    const link = await newLink.save();
    res.json(link);
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   PUT /api/links/reorder
// @desc    Update sort_order for multiple links (Private)
<<<<<<< HEAD
router.put("/reorder", authMiddleware, async (req, res) => {
  try {
    // Expecting an array of { id, sort_order }
    const { updates } = req.body;

    // Perform bulk write for efficiency
=======
router.put("/reorder", authMiddleware, async (req, res, next) => {
  try {
    const { updates } = req.body;

>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { sort_order: update.sort_order } },
      },
    }));

    await Link.bulkWrite(bulkOps);
    res.json({ msg: "Reordered successfully" });
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   PUT /api/links/:id
// @desc    Update a specific link
<<<<<<< HEAD
router.put('/:id', authMiddleware, async (req, res) => {
=======
router.put("/:id", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
<<<<<<< HEAD
      { returnDocument: 'after' } // ✅ Fixed deprecation warning
    );
    res.json(link);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
=======
      { returnDocument: "after" },
    );
    res.json(link);
  } catch (err) {
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   DELETE /api/links/:id
// @desc    Delete a link (Private)
<<<<<<< HEAD
router.delete("/:id", authMiddleware, async (req, res) => {
=======
router.delete("/:id", authMiddleware, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    await Link.findByIdAndDelete(req.params.id);
    res.json({ msg: "Link removed" });
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

// @route   POST /api/links/:id/click
// @desc    Increment click counter (Public)
<<<<<<< HEAD
router.post("/:id/click", async (req, res) => {
=======
router.post("/:id/click", clickLimiter, async (req, res, next) => {
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  try {
    await Link.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ msg: "Click registered" });
  } catch (err) {
<<<<<<< HEAD
    console.error(err.message);
    res.status(500).send("Server Error");
=======
    next(err);
>>>>>>> 62cbcd9 (Initial backend setup for ReachMe)
  }
});

module.exports = router;
