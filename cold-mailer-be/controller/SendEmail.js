import User from "../model/User.js";
import { loadCsvFromCloudinary } from "../utils/helpers.js";
import nodemailer from "nodemailer";
import { sendEmailJob } from "../jobs/sendEmailJob.js";

const configNodemailer = (email, pass) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email || process.env.EMAIL_USER,
      pass: pass || process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendEmail = async (req, res) => {
  try {
    const { email, pass } = req.body || {};

    console.log(
      "Send Email Request Body:@@@",
      process.env.EMAIL_USER,
      process.env.EMAIL_PASS
    );

    if (!email || !pass) {
      return res.status(400).json({
        message: "Account email and password are required to send emails.",
      });
    }

    const user = await User.findById("6905eeab98fcf0ec0c3530b8").populate(
      "uploadedFiles"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedFiles = user.uploadedFiles;

    const csv = uploadedFiles[1]; // Assuming we want to load the first uploaded CSV file

    console.log("CSV File to be used for sending emails:@@@", csv);

    const csvData = await loadCsvFromCloudinary(csv.url);

    const transporter = configNodemailer(email, pass);

    const batchSize = 5;
    // Use async generator for batch processing
    for await (const batchStatus of sendEmailJob({
      csvData,
      csv,
      user,
      transporter,
      batchSize,
      email,
    })) {
      res.write(JSON.stringify(batchStatus) + "\n");
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default sendEmail;
