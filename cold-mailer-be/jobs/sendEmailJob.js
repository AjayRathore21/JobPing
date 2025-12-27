import Csv from "../model/Csv.js";
import User from "../model/User.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("SendEmailJob");

/**
 * Sends a single email using the provided transporter.
 */
async function sendSingleEmail(transporter, row, from) {
  const mailOptions = {
    from,
    to: row.email,
    subject: "Test Email from Cold Mailer",
    text: `Hello ${row.name || "there"}, this is a test email!`,
  };

  try {
    logger.debug(`Sending email to: ${row.email}`);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send email to ${row.email}`, {
      error: error.message,
    });
    return { success: false, email: row.email };
  }
}

/**
 * Processes email sending in batches.
 * Updates database records and invokes a progress callback.
 */
export async function sendEmailJob({
  csvData,
  csv,
  user,
  transporter,
  batchSize = 5,
  email,
  onBatchProcessed,
}) {
  const csvId = csv._id;
  const userId = user._id;
  const senderEmail = email || user.email;

  // Initialize state from existing CSV record
  let totalSentCount = csv.sent || 0;
  let currentFailedEmails = [...(csv.failedEmailsRowId || [])];
  const startFrom = csv.startIndex || 0;

  logger.info(`Starting email job`, {
    csvId,
    totalRows: csvData.length,
    startIndex: startFrom,
    batchSize,
  });

  for (let i = startFrom; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);

    // Process batch in parallel
    const results = await Promise.all(
      batch.map((row) => sendSingleEmail(transporter, row, senderEmail))
    );

    // Analyze results
    const failedThisBatch = results
      .filter((r) => !r.success)
      .map((r) => r.email);

    const successCountThisBatch = batch.length - failedThisBatch.length;
    const failedCountThisBatch = failedThisBatch.length;

    // Update state
    totalSentCount += successCountThisBatch;
    currentFailedEmails.push(...failedThisBatch);
    const currentEndIndex = i + batch.length - 1;

    // Persist progress
    await Promise.all([
      Csv.findByIdAndUpdate(csvId, {
        sent: totalSentCount,
        startIndex: i,
        endIndex: currentEndIndex,
        failedEmailsRowId: currentFailedEmails,
      }),
      User.findByIdAndUpdate(userId, {
        $inc: { "stats.totalEmailsSent": successCountThisBatch },
      }),
    ]);

    // Construct status update
    const batchStatus = {
      message: `Batch ${Math.floor(i / batchSize) + 1} processed`,
      totalSent: totalSentCount,
      sentCount: totalSentCount, // For backward compatibility
      batchSent: successCountThisBatch,
      batchFailed: failedCountThisBatch,
      startIndex: i,
      endIndex: currentEndIndex,
      failedEmailsRowId: [...currentFailedEmails],
    };

    // Report progress
    if (typeof onBatchProcessed === "function") {
      onBatchProcessed(batchStatus);
    }
  }

  logger.info(`Email job completed`, { csvId, totalSentCount });
}
