import mongoose from "mongoose";

const csvUploadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true },
  },
  totalRecords: { type: Number, default: 0 },
  startIndex: { type: Number, default: 0 },
  endIndex: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  sentEmailRowIds: { type: [String], default: [] },
  failedEmailRowIds: { type: [String], default: [] },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Csv", csvUploadSchema);
