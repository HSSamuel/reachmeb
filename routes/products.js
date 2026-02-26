const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/authMiddleware");
const { deleteCloudinaryFile } = require("../utils/cloudinaryHelper");

// Helper to get profileId
const getProfileId = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile ? profile._id : null;
};

// @route   GET /api/products
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
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after" },
    );
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/products/:id
// ✨ FIX: Delete orphaned product images from Cloudinary
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Cleanup Cloudinary file if it exists
    if (product.image_url) {
      await deleteCloudinaryFile(product.image_url);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
