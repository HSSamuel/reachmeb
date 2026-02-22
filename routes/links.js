// reachme-backend/routes/links.js
const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// Helper function to get profile_id from user_id
const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

// @route   GET /api/links
// @desc    Get all links for logged-in user (Private)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const profileId = await getProfileId(req.user.id);
    const links = await Link.find({ profile_id: profileId }).sort({
      sort_order: 1,
    });
    res.json(links);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/links/public/:profileId
// @desc    Get all ACTIVE links for a public profile (Public)
router.get("/public/:profileId", async (req, res) => {
  try {
    const links = await Link.find({
      profile_id: req.params.profileId,
      is_active: true,
    }).sort({ sort_order: 1 });
    res.json(links);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/links
// @desc    Create a new link (Private)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const profileId = await getProfileId(req.user.id);

    const newLink = new Link({
      ...req.body,
      profile_id: profileId,
    });

    const link = await newLink.save();
    res.json(link);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/links/reorder
// @desc    Update sort_order for multiple links (Private)
router.put("/reorder", authMiddleware, async (req, res) => {
  try {
    // Expecting an array of { id, sort_order }
    const { updates } = req.body;

    // Perform bulk write for efficiency
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { sort_order: update.sort_order } },
      },
    }));

    await Link.bulkWrite(bulkOps);
    res.json({ msg: "Reordered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/links/:id
// @desc    Update a specific link
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after' } // ✅ Fixed deprecation warning
    );
    res.json(link);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/links/:id
// @desc    Delete a link (Private)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Link.findByIdAndDelete(req.params.id);
    res.json({ msg: "Link removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/links/:id/click
// @desc    Increment click counter (Public)
router.post("/:id/click", async (req, res) => {
  try {
    await Link.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ msg: "Click registered" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
