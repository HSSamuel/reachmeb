const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const { cloudinary, deleteCloudinaryFile } = require("../utils/cloudinaryHelper");

// Set up Multer Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "reachme_uploads",
    resource_type: "auto", // Allows both images and videos (mp4, webm)
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "mp4", "webm", "mov"],
  },
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary (Private)
router.post("/", authMiddleware, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    // Return the URL of the uploaded image
    res.json({ url: req.file.path });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/upload
// @desc    Delete a file from Cloudinary using its URL (Private)
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "No file URL provided" });

    await deleteCloudinaryFile(fileUrl);

    res.json({ msg: "File deleted successfully" });
  } catch (err) {
    console.error("Cloudinary Delete Route Error:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;