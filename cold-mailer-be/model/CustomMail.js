import mongoose from "mongoose";

const customMailSchema = new mongoose.Schema(
  {
    emailId: {
      type: String,
      required: true,
      trim: true,
    },
    openedStatus: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CustomMail", customMailSchema);
