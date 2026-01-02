import "dotenv/config";
import express from "express";
import connectDB from "./model/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import configurePassport from "./configs/passportConfig.js";
import logger from "./utils/logger.js";
import serverless from "serverless-http";
import {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
} from "./middleware/requestLogger.js";

const server = express();

// ============================================
// Database Connection Middleware
// Ensures DB is connected before ANY request proceeds
// ============================================
server.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(
      "CRITICAL: Database connection failed at middleware level:",
      err.message
    );
    res
      .status(503)
      .json({ error: "Database starting up... please refresh in a moment." });
  }
});

// ============================================
// STAGE 0: Diagnostic & Super-Early Health Check
// (Bypasses all other middleware to verify environment)
// ============================================
server.get("/diagnostic", (req, res) => {
  res.status(200).json({
    message: "App is alive",
    env: {
      has_db_url: !!process.env.MONGODB_URI,
      has_google_id: !!process.env.GOOGLE_CLIENT_ID,
      has_google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      has_jwt_secret: !!process.env.JWT_SECRET_KEY,
      google_callback_url: process.env.GOOGLE_CALLBACK_URL,
      region: process.env.AWS_REGION || "local",
    },
    warnings: {
      is_callback_http:
        process.env.GOOGLE_CALLBACK_URL?.startsWith("http://") &&
        !process.env.GOOGLE_CALLBACK_URL?.includes("localhost"),
      id_has_spaces:
        process.env.GOOGLE_CLIENT_ID !== process.env.GOOGLE_CLIENT_ID?.trim(),
    },
  });
});

// ============================================
// Core Middleware
// ============================================
server.use(express.json());
server.use(cookieParser());
server.use(express.urlencoded({ extended: true }));
server.use(cors());

// ============================================
// Request Logging Middleware (before routes)
// ============================================
server.use(requestLoggerMiddleware);

// ============================================
// Authentication
// ============================================
server.use(passport.initialize());
configurePassport(passport);

// ============================================
// Health Check Endpoint (for monitoring)
// ============================================
server.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// Routes
// ============================================
server.use("/", routes);

// ============================================
// Error Logging Middleware (after routes)
// ============================================
server.use(errorLoggerMiddleware);

// ============================================
// Global Error Handler
// ============================================
server.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    correlationId: req.correlationId,
  });
});

// ============================================
// Database Connection & Lambda Initialization
// ============================================
const init = async () => {
  if (!process.env.MONGODB_URI) {
    logger.error(
      "CRITICAL: MONGODB_URI is not defined in environment variables"
    );
  } else {
    logger.info("Initializing database connection...");
    await connectDB();
  }
};

// ============================================
// Export for Serverless
// ============================================
export const handler = serverless(server, {
  async onRequest(req) {
    // Ensure DB is connected on every request (reuses connection if already open)
    await connectDB();
  },
});
export default server;
