// reachme-backend/routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const authMiddleware = require("../middleware/authMiddleware");

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "reachme_uploads",
    resource_type: "auto", // ✅ CRITICAL: Allows both images and videos (mp4, webm)
    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "webp",
      "gif",
      "mp4",
      "webm",
      "mov",
    ],
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

    // Parse Cloudinary URL to extract resource_type and public_id
    // Example: https://res.cloudinary.com/<cloud_name>/video/upload/v1234/reachme_uploads/file.mp4
    const urlParts = fileUrl.split("/upload/");
    if (urlParts.length !== 2) {
      return res.status(400).json({ error: "Invalid Cloudinary URL" });
    }

    // 1. Get resource type (image or video) from the left side of "/upload/"
    const leftParts = urlParts[0].split("/");
    const resourceType = leftParts[leftParts.length - 1]; // usually "image" or "video"

    // 2. Get the public ID from the right side of "/upload/"
    let rightPart = urlParts[1];
    
    // Remove the version tag (e.g., "v1612345678/") if it exists
    if (rightPart.match(/^v\d+\//)) {
      rightPart = rightPart.split("/").slice(1).join("/");
    }
    
    // Remove the file extension (e.g., ".mp4" or ".jpg")
    const publicId = rightPart.substring(0, rightPart.lastIndexOf("."));

    if (!publicId) return res.status(400).json({ error: "Could not extract public ID" });

    // 3. Destroy the file in Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    res.json({ msg: "File deleted successfully", result });
  } catch (err) {
    console.error("Cloudinary Delete Error:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
