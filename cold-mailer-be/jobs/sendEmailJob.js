import Csv from "../model/Csv.js";
import User from "../model/User.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("SendEmailJob");

/**
 * Sends a single email using the provided transporter.
 */
async function sendSingleEmail(transporter, row, from, subject, html) {
  const mailOptions = {
    from,
    to: row.email,
    subject: subject || "Test Email from Cold Mailer",
    html: html || `Hello ${row.name || "there"}, this is a test email!`,
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
  subject,
  html,
  onBatchProcessed,
}) {
  const csvId = csv._id;
  const userId = user._id;
  const senderEmail = email || user.email;

  // Initialize state from existing CSV record
  let totalSentCount = csv.sent || 0;
  let currentSentRowIds = [...(csv.sentEmailRowIds || [])];
  let currentFailedRowIds = [...(csv.failedEmailRowIds || [])];
  const startFrom = 0; // Always start from beginning of provided data since it's already filtered

  logger.info(`Starting email job`, {
    csvId,
    totalRows: csvData.length,
    batchSize,
  });

  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);

    // Process batch in parallel
    const results = await Promise.all(
      batch.map(async (row) => {
        const result = await sendSingleEmail(
          transporter,
          row,
          senderEmail,
          subject,
          html
        );
        return { ...result, rowId: row.id };
      })
    );

    // Analyze results
    const batchSentIds = results.filter((r) => r.success).map((r) => r.rowId);
    const batchFailedIds = results
      .filter((r) => !r.success)
      .map((r) => r.rowId);

    // Update state
    const sentSet = new Set(currentSentRowIds);
    const failedSet = new Set(currentFailedRowIds);

    batchSentIds.forEach((id) => {
      sentSet.add(id);
      failedSet.delete(id); // If it succeeded, it's no longer failed
    });
    batchFailedIds.forEach((id) => {
      if (!sentSet.has(id)) {
        failedSet.add(id); // Only add to failed if not already sent successfully
      }
    });

    currentSentRowIds = Array.from(sentSet);
    currentFailedRowIds = Array.from(failedSet);
    totalSentCount = currentSentRowIds.length;

    const currentEndIndex = i + batch.length - 1;

    // Persist progress
    await Promise.all([
      Csv.findByIdAndUpdate(csvId, {
        sent: totalSentCount,
        sentEmailRowIds: currentSentRowIds,
        failedEmailRowIds: currentFailedRowIds,
        // we'll keep startIndex/endIndex for legacy UI if needed but it's less relevant now
        startIndex: i,
        endIndex: currentEndIndex,
      }),
      User.findByIdAndUpdate(userId, {
        $inc: { "stats.totalEmailsSent": batchSentIds.length },
      }),
    ]);

    // Construct status update
    const batchStatus = {
      message: `Batch ${Math.floor(i / batchSize) + 1} processed`,
      totalSent: totalSentCount,
      batchSent: batchSentIds.length,
      batchFailed: batchFailedIds.length,
      sentEmailRowIds: [...currentSentRowIds],
      failedEmailRowIds: [...currentFailedRowIds],
    };

    // Report progress
    if (typeof onBatchProcessed === "function") {
      onBatchProcessed(batchStatus);
    }
  }

  logger.info(`Email job completed`, { csvId, totalSentCount });
}
