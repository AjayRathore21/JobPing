import mongoose from "mongoose";

const csvUploadSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true },
  },
  totalRecords: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Csv", csvUploadSchema);
