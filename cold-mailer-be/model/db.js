import mongoose from "mongoose";

console.log("MongoDB URI:", process.env.MONGODB_URI); // Debugging line

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // stop the app if DB fails
  }
};

export default connectDB;
