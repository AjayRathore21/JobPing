import Csv from "../model/Csv.js";
import User from "../model/User.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("SendEmailJob");

/**
 * Safely get a value from a row object ignoring case
 */
/**
 * Safely get a value from a row object ignoring case and trim
 */
function getRowValue(row, key, keyMap) {
  if (!row || !key) return undefined;

  const normalizedKey = key.trim().toLowerCase();

  // Use pre-calculated map if available
  if (keyMap && keyMap[normalizedKey]) {
    return row[keyMap[normalizedKey]];
  }

  // Fallback to searching (if map not provided)
  const foundKey = Object.keys(row).find(
    (k) => k.trim().toLowerCase() === normalizedKey,
  );
  return foundKey ? row[foundKey] : undefined;
}

/**
 * Replace template placeholders with actual values from the row data
 */
function replacePlaceholders(text, row, keyMap) {
  if (!text) return text;

  // Replace each {{key}} or {{ key }} with row-matched value
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/gi, (match, p1) => {
    const key = p1.trim();
    const value = getRowValue(row, key, keyMap);
    return value !== undefined ? value : match;
  });
}

/**
 * Sends a single email using the provided transporter.
 */
async function sendSingleEmail(
  transporter,
  row,
  from,
  subject,
  html,
  userId,
  csvId,
  keyMap,
) {
  const recipientEmail = getRowValue(row, "email", keyMap) || row.email;
  const recipientName = getRowValue(row, "name", keyMap) || row.name || "there";
  const baseUrl = process.env.BACKEND_URL || "";

  const trackingPixel = `<img src="${baseUrl}/track-email?userId=${userId}&csvId=${csvId}&rowId=${row.id}&recruiterEmail=${recipientEmail}" width="1" height="1" style="display:none;" />`;

  // Replace placeholders in subject and body
  const personalizedSubject = replacePlaceholders(subject, row, keyMap);
  const personalizedHtml = replacePlaceholders(html, row, keyMap);

  const mailOptions = {
    from,
    to: recipientEmail,
    subject: personalizedSubject || "Test Email from Cold Mailer",
    html:
      (personalizedHtml || `Hello ${recipientName}, this is a test email!`) +
      trackingPixel,
  };

  try {
    logger.debug(`Sending email to: ${recipientEmail}`);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send email to ${recipientEmail}`, {
      error: error.message,
    });
    return { success: false, email: recipientEmail };
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

  // Create header lookup map for optimization
  const keyMap = {};
  if (csvData.length > 0) {
    Object.keys(csvData[0]).forEach((originalKey) => {
      keyMap[originalKey.trim().toLowerCase()] = originalKey;
    });
  }

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
          html,
          userId,
          csvId,
          keyMap,
        );
        return { ...result, rowId: row.id };
      }),
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
