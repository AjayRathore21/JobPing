import CustomMail from "../model/CustomMail.js";
import User from "../model/User.js";
import { createGmailTransporter } from "../configs/mailService.js";

export const sendCustomMail = async (req, res) => {
  try {
    const { emails, companyName, location, subject, htmlContent } = req.body;
    const user = req.user;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Email addresses are required" });
    }

    if (!user.gmailRefreshToken) {
      return res.status(400).json({
        error: "Gmail OAuth not configured. Please sign in with Google.",
      });
    }

    const transporter = await createGmailTransporter(user);
    const sentMails = [];

    for (const emailId of emails) {
      // Create record first to get the ID for tracking
      const customMail = new CustomMail({
        emailId,
        userId: user._id,
        company: companyName || null,
        location: location || null,
      });
      await customMail.save();

      // Tracking pixel URL (Update base URL in production)
      const baseUrl = process.env.BACKEND_URL || `http://localhost:3000`;
      const trackingPixel = `<img src="${baseUrl}/track/custom?mailId=${customMail._id}" width="1" height="1" style="display:none;" />`;

      const mailOptions = {
        from: user.email,
        to: emailId,
        subject: subject || "No Subject",
        html: `${htmlContent || ""}${trackingPixel}`,
      };

      try {
        await transporter.sendMail(mailOptions);

        // Update User stats and customMailSent array
        await User.findByIdAndUpdate(user._id, {
          $inc: { "stats.totalEmailsSent": 1 },
          $push: { customMailSent: customMail._id },
        });

        sentMails.push(customMail);
      } catch (sendErr) {
        console.error(`Failed to send email to ${emailId}:`, sendErr);
        // Delete the record if sending failed?
        // Or keep it with a 'failed' status? The requirements didn't specify.
        // For now, I'll just skip and log.
      }
    }

    // Return the updated list of custom mails as requested
    const updatedUser = await User.findById(user._id).populate(
      "customMailSent"
    );
    res.status(200).json({
      message: "Emails sent successfully",
      customMails: updatedUser.customMailSent,
    });
  } catch (error) {
    console.error("Error sending custom mail:", error);
    res.status(500).json({ error: error.message });
  }
};

export const trackCustomMailOpen = async (req, res) => {
  try {
    const { mailId } = req.query;
    if (!mailId) return res.sendStatus(400);

    const mail = await CustomMail.findById(mailId);
    if (mail && !mail.openedStatus) {
      mail.openedStatus = true;
      await mail.save();

      // Update User stats
      await User.findByIdAndUpdate(mail.userId, {
        $inc: { "stats.totalOpens": 1 },
      });
    }

    // Send a 1x1 transparent GIF
    const img = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": img.length,
    });
    res.end(img);
  } catch (error) {
    console.error("Tracking error:", error);
    res.sendStatus(500);
  }
};
