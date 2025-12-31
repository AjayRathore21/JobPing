import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("=> Using existing database connection");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);

    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    // In Lambda, we shouldn't обязательно process.exit(1),
    // but throwing the error will help with retries
    throw error;
  }
};

export default connectDB;
