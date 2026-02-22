// reachme-backend/routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");

// Helper to get profileId
const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

// @route   GET /api/products
// @desc    Get all products for logged-in user (Private)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const profileId = await getProfileId(req.user.id);
    const products = await Product.find({ profile_id: profileId }).sort({
      sort_order: 1,
    });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/products/public/:profileId
// @desc    Get active products for public profile (Public)
router.get("/public/:profileId", async (req, res) => {
  try {
    const products = await Product.find({
      profile_id: req.params.profileId,
      is_active: true,
    }).sort({ sort_order: 1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/products
// @desc    Create a new product (Private)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const profileId = await getProfileId(req.user.id);
    const newProduct = new Product({
      ...req.body,
      profile_id: profileId,
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after' } // ✅ Fixed deprecation warning
    );
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Private)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
