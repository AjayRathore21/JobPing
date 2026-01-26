import Csv from "../model/Csv.js";
import User from "../model/User.js";
import { loadCsvFromCloudinary, extractVariables } from "../utils/helpers.js";
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

    const { mode, rowIds, range, subject, html } = req.body || {};

    // Validate dynamic variables
    const variables = extractVariables(`${subject || ""} ${html || ""}`);
    if (variables.length > 0 && csvData.length > 0) {
      const headers = Object.keys(csvData[0]).map((h) =>
        h.trim().toLowerCase(),
      );
      const missingVariables = variables.filter(
        (v) => !headers.includes(v.trim().toLowerCase()),
      );

      if (missingVariables.length > 0) {
        logger.warn("Email sending failed - missing dynamic variables", {
          missingVariables,
          csvId,
          userId: user?._id,
          correlationId,
        });
        return res.status(400).json({
          error: "MISSING_VARIABLES",
          missingVariables,
          message:
            "Some dynamic variables in your template do not match the CSV headers.",
        });
      }
    }

    let rowsToProcess = csvData;

    logger.info("Processing email request", {
      mode,
      csvId,
      correlationId,
    });

    if (mode === "selected" || mode === "multi") {
      if (Array.isArray(rowIds)) {
        rowsToProcess = csvData.filter((row) => rowIds.includes(row.id));
        logger.debug("Filtered for specific rows", {
          rowIdsCount: rowIds.length,
          actualCount: rowsToProcess.length,
        });
      }
    } else if (
      mode === "range" &&
      range &&
      typeof range.start === "number" &&
      typeof range.end === "number"
    ) {
      // 1-based indexing from frontend
      const start = Math.max(0, range.start - 1);
      const end = range.end;
      rowsToProcess = csvData.slice(start, end);
      logger.debug("Filtered for range", {
        start,
        end,
        count: rowsToProcess.length,
      });
    } else {
      // Default to bulk or explicitly requested bulk
      logger.debug("Processing in bulk mode", { totalRows: csvData.length });
    }

    if (rowsToProcess.length === 0) {
      logger.warn("No rows to process after filtering", {
        mode,
        csvId,
        correlationId,
      });
      return res
        .status(400)
        .json({ error: "No matching rows found to process" });
    }

    logger.info("Email processing starting", {
      rowCount: rowsToProcess.length,
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

    // Process email job with batch callback
    await sendEmailJob({
      csvData: rowsToProcess,
      csv,
      user,
      transporter,
      subject,
      html,
      batchSize,
      email,
      onBatchProcessed: (batchStatus) => {
        batchCount++;

        // Track batch metrics
        totalSent += batchStatus.batchSent || 0;
        totalFailed += batchStatus.batchFailed || 0;

        logger.debug("Email batch processed", {
          batchNumber: batchCount,
          batchStatus,
          correlationId,
        });

        res.write(JSON.stringify(batchStatus) + "\n");
      },
    });

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

export const trackEmail = async (req, res) => {
  const { userId, csvId, rowId, recruiterEmail } = req.query;

  try {
    if (!userId || !csvId || !rowId) {
      logger.warn("Tracking request missing parameters", {
        userId,
        csvId,
        rowId,
      });
      return res.status(400).send("Missing parameters");
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn("Tracking request: User not found", { userId });
      return res.status(404).send("User not found");
    }

    // Check if already tracked to avoid duplicate notifications
    const alreadyTracked = user.openedEmails.some(
      (entry) => entry.csvId.toString() === csvId && entry.rowId === rowId,
    );

    if (!alreadyTracked) {
      user.openedEmails.push({ csvId, rowId });
      user.stats.totalOpens = (user.stats.totalOpens || 0) + 1;
      await user.save();

      logger.info("Email open tracked", { userId, csvId, rowId });

      // Send notification email to the user
      try {
        const transporter = await createGmailTransporter(user);
        const mailOptions = {
          from: "ajaykumar420.ak79@gmail.com",
          to: user.email,
          subject: "Your email has been opened!",
          html: `<p>Hello ${user.name},</p><p>An email from your campaign (CSV ID: ${csvId}, Row ID: ${rowId}) has been opened by a recruiter (${recruiterEmail}).</p><p>Good luck!</p>`,
        };
        await transporter.sendMail(mailOptions);
        logger.info("Notification email sent to user", { userId: user._id });
      } catch (notifyError) {
        logger.error("Failed to send notification email", {
          userId: user._id,
          error: notifyError.message,
        });
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64",
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
    });
    res.end(pixel);
  } catch (error) {
    logger.error("Error in trackEmail controller", { error: error.message });
    res.status(500).send("Internal Server Error");
  }
};

export default sendEmail;
