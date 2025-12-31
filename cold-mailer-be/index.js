import "dotenv/config"; // Must be first - loads env vars before other imports
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
// Server Startup (Only if not running in Lambda)
// ============================================
if (process.env.NODE_ENV !== "production" || !process.env.LAMBDA_TASK_ROOT) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    logger.info("🚀 Server started successfully", {
      context: "Startup",
      port,
      environment: process.env.NODE_ENV || "development",
    });
  });
}

// ============================================
// Export for Serverless
// ============================================
export const handler = serverless(server);
export default server;
