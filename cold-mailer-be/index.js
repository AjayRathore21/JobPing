import "dotenv/config"; // Must be first - loads env vars before other imports
import express from "express";
import connectDB from "./model/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import configurePassport from "./configs/passportConfig.js";
import logger from "./utils/logger.js";
import {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
} from "./middleware/requestLogger.js";

// ============================================
// Error Handling (Early Catch)
// ============================================
process.on("uncaughtException", (error) => {
  logger.logError(error, {
    context: "UncaughtException",
    fatal: true,
  });
  // Give logger a moment to flush if it's async, then exit
  setTimeout(() => process.exit(1), 100);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection", {
    context: "UnhandledRejection",
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

const server = express();
const port = process.env.PORT || 3000;

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
// Database Connection
// ============================================
connectDB();

// ============================================
// Server Startup
// ============================================
const startServer = () => {
  server.listen(port, () => {
    logger.info("🚀 Server started successfully", {
      context: "Startup",
      port,
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      pid: process.pid,
    });

    // Log configuration summary (development only)
    if (process.env.NODE_ENV !== "production") {
      logger.debug("Server configuration", {
        context: "Startup",
        logLevel: process.env.LOG_LEVEL || "debug",
        cors: "enabled",
        authentication: "passport-jwt + google-oauth",
      });
    }
  });
};

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`, {
    context: "Shutdown",
  });

  server.close(() => {
    logger.info("HTTP server closed", { context: "Shutdown" });
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout", { context: "Shutdown" });
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
