import User from "../model/User.js";
import { loadCsvFromCloudinary } from "../utils/helpers.js";

const sendEmail = async (req, res) => {
  try {
    const user = await User.findById("6905eeab98fcf0ec0c3530b8").populate(
      "uploadedFiles"
    );

    console.log("User found:@@@@@@", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedFiles = user.uploadedFiles;

    const csv = uploadedFiles[0]; // Assuming we want to load the first uploaded CSV file
    console.log("Uploaded Files for User:", uploadedFiles);

    const csvData = await loadCsvFromCloudinary(csv.url);
    console.log("CSV Data Loaded:", csvData);

    res.status(200).json({ message: "Email sent successfully", csvData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default sendEmail;
