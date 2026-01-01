import mongoose from "mongoose";

let isConnected = false;

// Disable buffering so that commands fail immediately if not connected
// This prevents the "Operation buffering timed out" errors in Lambda
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("=> Using existing database connection");
    return;
  }

  console.log("=> Creating new database connection...");

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of waiting 30s
      socketTimeoutMS: 45000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isConnected = false;
    throw error;
  }
};

export default connectDB;
