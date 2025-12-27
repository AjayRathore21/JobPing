import Csv from "../model/Csv.js";
import { loadCsvFromCloudinary } from "../utils/helpers.js";
import { sendEmailJob } from "../jobs/sendEmailJob.js";
import { createGmailTransporter } from "../configs/mailService.js";
import { createLogger } from "../utils/logger.js";

// Create a context-specific logger for this controller
const logger = createLogger("SendEmailController");

const sendEmail = async (req, res) => {
  const startTime = Date.now();
  const correlationId = req.correlationId;

  try {
    const { csvId } = req.body || {};
    const user = req.user;

    logger.info("Email sending process started", {
      userId: user?._id,
      userEmail: user?.email ? `${user.email.substring(0, 3)}***` : undefined,
      csvId,
      correlationId,
    });

    const { email } = user || {};

    // Check if user has Gmail OAuth configured
    if (!user.gmailRefreshToken) {
      logger.warn("Email sending failed - Gmail OAuth not configured", {
        userId: user?._id,
        correlationId,
      });
      return res.status(400).json({
        error:
          "Gmail OAuth not configured. Please sign in with Google to send emails from your account.",
      });
    }

    const csv = await Csv.findById(csvId);

    if (!csv) {
      logger.warn("Email sending failed - CSV not found", {
        csvId,
        userId: user?._id,
        correlationId,
      });
      return res.status(404).json({ error: "CSV file not found" });
    }

    logger.debug("CSV file retrieved for email sending", {
      csvId,
      csvUrl: csv.url,
      correlationId,
    });

    const csvData = await loadCsvFromCloudinary(csv.url);

    logger.info("CSV data loaded successfully", {
      rowCount: csvData.length,
      csvId,
      correlationId,
    });

    // Create OAuth2-authenticated transporter
    const transporter = await createGmailTransporter(user);

    logger.debug("Gmail transporter created", {
      userId: user._id,
      correlationId,
    });

    const batchSize = 5;
    let batchCount = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // Use async generator for batch processing
    for await (const batchStatus of sendEmailJob({
      csvData,
      csv,
      user,
      transporter,
      batchSize,
      email,
    })) {
      batchCount++;

      // Track batch metrics
      if (batchStatus.sent) totalSent += batchStatus.sent;
      if (batchStatus.failed) totalFailed += batchStatus.failed;

      logger.debug("Email batch processed", {
        batchNumber: batchCount,
        batchStatus,
        correlationId,
      });

      res.write(JSON.stringify(batchStatus) + "\n");
    }

    // Log completion metrics
    logger.info("Email sending completed", {
      csvId,
      userId: user._id,
      totalRows: csvData.length,
      totalBatches: batchCount,
      totalSent,
      totalFailed,
      duration: Date.now() - startTime,
      correlationId,
    });

    // Performance metric
    logger.metric("email_send_job_duration", Date.now() - startTime, {
      totalEmails: csvData.length,
      batchSize,
      successRate:
        csvData.length > 0
          ? ((totalSent / csvData.length) * 100).toFixed(2)
          : 0,
    });

    res.end();
  } catch (error) {
    logger.logError(error, {
      action: "sendEmail",
      csvId: req.body?.csvId,
      userId: req.user?._id,
      correlationId,
      duration: Date.now() - startTime,
    });
    res.status(500).json({ error: error.message });
  }
};

export default sendEmail;
