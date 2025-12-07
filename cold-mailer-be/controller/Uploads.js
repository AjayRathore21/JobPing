import cloudinary from "../configs/cloudinary.js";
import CsvUpload from "../model/Csv.js";
import User from "../model/User.js";
import fs from "fs";

export const csvUpload = async (req, res) => {
  try {
    console.log("Uploading file:@@@@", req.file, req.user);
    const filePath = req?.file?.path;
    const user = req.user;

    console.log("User:@@@@", user);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw", // 👈 important for CSV or non-image files
      folder: "csv_files",
    });

    console.log("Cloudinary upload result:@@@@", result, user);
    // Remove local file
    fs.unlinkSync(filePath);
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
