import cloudinary from "../configs/cloudinary.js";
import CsvUpload from "../model/Csv.js";
import fs from "fs";

export const csvUpload = async (req, res) => {
  try {
    console.log("Uploading file:@@@@", req.file);
    const filePath = req?.file?.path;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw", // 👈 important for CSV or non-image files
      folder: "csv_files",
    });

    // Remove local file
    fs.unlinkSync(filePath);

    //

    const csvObj = new CsvUpload({
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      uploadedBy: {
        userId: "6905eeab98fcf0ec0c3530b8", // default values for now
        email: "testing@gmail.com",
      },
      totalRecords: 0,
      sent: 0,
    });

    const savedObj = await csvObj.save();
    res.json({
      message: "File uploaded successfully",
      data: savedObj,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
