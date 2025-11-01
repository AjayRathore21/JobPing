import Csv from "../model/Csv.js";
import User from "../model/User.js";

export async function* sendEmailJob({
  csvData,
  csv,
  user,
  transporter,
  batchSize,
  email,
}) {
  let sentCount = csv.sent || 0;
  let startIndex = csv.startIndex || 0;
  let endIndex = csv.endIndex || 0;
  let failedEmails = [];
  for (let i = startIndex; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    const promises = batch.map((row, idx) => {
      const mailOptions = {
        from: email,
        to: "ajayrathod50000@gmail.com",
        subject: "Test Email from Cold Mailer",
        text: `Hello ${row.name || "there"}, this is a test email!`,
      };
      return transporter
        .sendMail(mailOptions)
        .then(() => ({ success: true }))
        .catch((err) => {
          console.error("Error sending email:", err);
          return { success: false, email: row.email };
        });
    });
    const results = await Promise.all(promises);

    console.log("Batch results: @@@@@", results);

    const failedEmailsArr = results
      .filter((r) => !r.success)
      .map((r) => r.email);
    failedEmails.push(...failedEmailsArr);
    sentCount += batch.length - failedEmailsArr.length;
    endIndex = i + batch.length - 1;
    await Csv.findByIdAndUpdate(csv._id, {
      sent: sentCount,
      startIndex: i,
      endIndex: endIndex,
      failedEmails,
    });
    await User.findByIdAndUpdate(user._id, {
      $inc: { "stats.totalEmailsSent": batch.length - failedEmails.length },
    });
    yield {
      message: `Batch ${i / batchSize + 1} sent`,
      sentCount,
      startIndex: i,
      endIndex,
      failedEmails: [...failedEmails],
    };
  }
}
