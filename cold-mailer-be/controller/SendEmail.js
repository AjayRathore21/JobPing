import Csv from "../model/Csv.js";
import { loadCsvFromCloudinary } from "../utils/helpers.js";
import { sendEmailJob } from "../jobs/sendEmailJob.js";
import { createGmailTransporter } from "../configs/mailService.js";

const sendEmail = async (req, res) => {
  try {
    const { csvId } = req.body || {};
    const user = req.user;

    console.log("Sending emails for user:", user.email);
    const { email } = user || {};

    // Check if user has Gmail OAuth configured
    if (!user.gmailRefreshToken) {
      return res.status(400).json({
        error:
          "Gmail OAuth not configured. Please sign in with Google to send emails from your account.",
      });
    }

    const csv = await Csv.findById(csvId);

    if (!csv) {
      return res.status(404).json({ error: "CSV file not found" });
    }

    console.log("CSV File to be used for sending emails:", csv.url);

    const csvData = await loadCsvFromCloudinary(csv.url);

    console.log("CSV data loaded, rows:@@@@@@@", user, csvData.length);

    // Create OAuth2-authenticated transporter
    const transporter = await createGmailTransporter(user);

    // return;

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
    console.error("Error sending emails:", error);
    res.status(500).json({ error: error.message });
  }
};

export default sendEmail;
