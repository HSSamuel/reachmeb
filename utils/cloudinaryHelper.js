const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const extractPublicId = (fileUrl) => {
  try {
    const urlParts = fileUrl.split("/upload/");
    if (urlParts.length !== 2) return { publicId: null, resourceType: null };

    const leftParts = urlParts[0].split("/");
    const resourceType = leftParts[leftParts.length - 1]; // "image" or "video"

    let rightPart = urlParts[1];
    if (rightPart.match(/^v\d+\//)) {
      rightPart = rightPart.split("/").slice(1).join("/");
    }
    const publicId = rightPart.substring(0, rightPart.lastIndexOf("."));

    return { publicId, resourceType };
  } catch (err) {
    return { publicId: null, resourceType: null };
  }
};

const deleteCloudinaryFile = async (fileUrl) => {
  if (!fileUrl) return false;
  const { publicId, resourceType } = extractPublicId(fileUrl);
  if (!publicId) return false;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return true;
  } catch (err) {
    console.error("Cloudinary Cleanup Error:", err.message);
    return false;
  }
};

module.exports = { cloudinary, deleteCloudinaryFile, extractPublicId };
