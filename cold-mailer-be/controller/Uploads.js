import cloudinary from "../configs/cloudinary.js";
import CsvUpload from "../model/Csv.js";
import User from "../model/User.js";
import fs from "fs";
import { addUuidToCsv } from "../utils/helpers.js";

export const getUserCsvs = async (req, res) => {
  try {
    const user = req.user;
    const csvs = await CsvUpload.find({ "uploadedBy.userId": user._id }).sort({
      uploadedAt: -1,
    });
    res.json({ message: "CSVs fetched successfully", data: csvs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const csvUpload = async (req, res) => {
  try {
    console.log("Uploading file:@@@@", req.file, req.user);
    const filePath = req?.file?.path;

    const user = req.user;

    console.log("User:@@@@", user);

    // Add UUID to each row in the CSV and get the temp file path
    const tempFilePath = addUuidToCsv(filePath);

    // Upload modified CSV to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "raw", // 👈 important for CSV or non-image files
      folder: "csv_files",
    });

    console.log("Cloudinary upload result:@@@@", result, user);

    // Remove local files
    fs.unlinkSync(filePath);
    fs.unlinkSync(tempFilePath);
    const csvObj = new CsvUpload({
      name: req.file.originalname,
      url: result.secure_url,
      uploadedBy: {
        userId: user._id,
        email: user.email,
      },
      totalRecords: 0,
      sent: 0,
    });

    const savedObj = await csvObj.save();

    const updatedUser = await User.findByIdAndUpdate(user._id, {
      $push: { uploadedFiles: csvObj._id },
    });

    console.log("Updated User after file upload:@@@", updatedUser);

    res.json({
      message: "File uploaded successfully",
      data: savedObj,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCsv = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const csv = await CsvUpload.findById(id);

    if (!csv) {
      return res.status(404).json({ error: "CSV file not found" });
    }

    // Verify ownership
    if (csv.uploadedBy.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this CSV" });
    }

    // Delete from Cloudinary if publicId exists
    if (csv.publicId) {
      await cloudinary.uploader.destroy(csv.publicId, { resource_type: "raw" });
    }

    // Find the user to calculate opens count for this specific CSV
    const currentUser = await User.findById(user._id);
    const opensCount = currentUser.openedEmails.filter(
      (entry) => entry.csvId && entry.csvId.toString() === id
    ).length;

    // Delete from database
    await CsvUpload.findByIdAndDelete(id);

    // Remove from User's uploadedFiles and openedEmails arrays, and update stats
    await User.findByIdAndUpdate(user._id, {
      $pull: {
        uploadedFiles: id,
        openedEmails: { csvId: id },
      },
      $inc: { "stats.totalOpens": -opensCount },
    });

    res.json({ message: "CSV file deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
