import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // For integrating Gmail / Outlook / SMTP
    emailConfig: {
      service: {
        type: String,
        enum: ["gmail", "outlook", "custom"],
        default: "gmail",
      },
      smtpHost: { type: String },
      smtpPort: { type: Number },
      smtpUser: { type: String },
      smtpPassword: { type: String },
      fromName: { type: String },
      fromEmail: { type: String },
    },

    // Analytics summary (optional)
    stats: {
      totalCampaigns: { type: Number, default: 0 },
      totalEmailsSent: { type: Number, default: 0 },
      totalOpens: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
    },

    // For password reset / verification
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },

    // For verification
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
