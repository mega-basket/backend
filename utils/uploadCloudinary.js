import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) return null;

    console.log("Attempting to upload file:", localFilePath);

    // Debug: Check environment variables
    console.log("Cloudinary config check:");
    console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log(
      "CLOUDINARY_API_KEY:",
      process.env.CLOUDINARY_API_KEY ? "Present" : "Missing"
    );
    console.log(
      "CLOUDINARY_API_SECRET:",
      process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing"
    );

    // Configure cloudinary inside the function to ensure env vars are loaded
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.log("File does not exist:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath);

    console.log("File uploaded successfully", response.url);

    // Clean up the local file after successful upload
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);

    // Clean up the local file if it exists
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Local file deleted after error:", localFilePath);
    }

    return null;
  }
};

// Function to upload multiple files
const uploadMultipleCloudinary = async (localFilePaths) => {
  try {
    if (
      !localFilePaths ||
      !Array.isArray(localFilePaths) ||
      localFilePaths.length === 0
    ) {
      console.log("No files provided for upload");
      return [];
    }

    console.log("Attempting to upload multiple files:", localFilePaths);

    // Configure cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadPromises = localFilePaths.map(async (filePath) => {
      try {
        if (!filePath || !fs.existsSync(filePath)) {
          console.log("File does not exist:", filePath);
          return null;
        }

        const response = await cloudinary.uploader.upload(filePath, {
          resource_type: "auto",
        });

        console.log("File uploaded successfully:", response.url);

        // Clean up the local file after successful upload
        fs.unlinkSync(filePath);
        return response;
      } catch (error) {
        console.error("Error uploading file:", filePath, error.message);

        // Clean up the local file if it exists
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return null;
      }
    });

    const results = await Promise.all(uploadPromises);

    // Filter out null results (failed uploads)
    const successfulUploads = results.filter((result) => result !== null);

    console.log(
      `Successfully uploaded ${successfulUploads.length} out of ${localFilePaths.length} files`
    );

    return successfulUploads;
  } catch (error) {
    console.error("Multiple upload error:", error.message);

    // Clean up any remaining files
    if (localFilePaths && Array.isArray(localFilePaths)) {
      localFilePaths.forEach((filePath) => {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    return [];
  }
};

export { uploadCloudinary, uploadMultipleCloudinary };
export default uploadCloudinary;
