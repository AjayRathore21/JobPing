/**
 * Request Logger Middleware
 *
 * This middleware provides:
 * - Correlation ID generation/propagation for distributed tracing
 * - Request/Response timing
 * - Automatic HTTP request logging
 * - Request context injection for downstream logging
 *
 * Industry Standard: This follows the OpenTelemetry pattern for trace propagation
 * and is similar to what Google Cloud Run, AWS X-Ray, and Datadog use.
 *
 * @module middleware/requestLogger
 */

import { randomUUID } from "crypto";
import logger from "../utils/logger.js";

/**
 * Generates or extracts correlation ID from request headers
 * Supports common header patterns:
 * - X-Correlation-ID (most common)
 * - X-Request-ID (AWS, Azure)
 * - X-Trace-ID (custom)
 */
const getCorrelationId = (req) => {
  return (
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"] ||
    req.headers["x-trace-id"] ||
    randomUUID()
  );
};

/**
 * Paths to exclude from detailed logging (health checks, metrics endpoints)
 */
const EXCLUDED_PATHS = [
  "/health",
  "/healthz",
  "/ready",
  "/readyz",
  "/metrics",
  "/favicon.ico",
];

/**
 * Request Logger Middleware
 *
 * Attaches correlation ID to request and logs HTTP request/response details
 */
export const requestLoggerMiddleware = (req, res, next) => {
  // Skip logging for excluded paths
  if (EXCLUDED_PATHS.some((path) => req.path.startsWith(path))) {
    return next();
  }

  console.log("Request Logger Middleware", {
    method: req.method,
    url: req.originalUrl || req.url,
    correlationId: req.correlationId,
  });

  const startTime = Date.now();
  const correlationId = getCorrelationId(req);

  // Attach correlation ID to request for use in downstream logging
  req.correlationId = correlationId;

  // Set correlation ID in response header for client-side debugging
  res.setHeader("X-Correlation-ID", correlationId);

  // Create request-scoped logger
  req.logger = logger.child({
    correlationId,
    context: "HTTP",
  });

  // Log incoming request (debug level to avoid noise)
  if (logger.level === "debug") {
    req.logger.debug("Incoming request", {
      method: req.method,
      url: req.originalUrl || req.url,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.get("user-agent"),
      ip: req.ip || req.connection?.remoteAddress,
      contentType: req.get("content-type"),
    });
  }

  // Capture response finish
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    logger.httpRequest(req, res, responseTime);
  });

  // Handle response close (client disconnected)
  res.on("close", () => {
    if (!res.finished) {
      const responseTime = Date.now() - startTime;
      logger.warn("Request aborted by client", {
        correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        responseTime: `${responseTime}ms`,
      });
    }
  });

  next();
};

/**
 * Error Logger Middleware
 *
 * Should be placed AFTER all routes to catch unhandled errors
 * Provides structured error logging with full context
 */
export const errorLoggerMiddleware = (err, req, res, next) => {
  const correlationId = req.correlationId || "unknown";

  // Determine error severity
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  // Build error context
  const errorContext = {
    correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    userId: req.user?.id || req.user?._id,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("user-agent"),
    requestBody: isServerError && req.body ? sanitizeBody(req.body) : undefined,
  };

  // Log with appropriate level
  if (isServerError) {
    logger.logError(err, {
      context: "ErrorHandler",
      ...errorContext,
    });
  } else {
    logger.warn(err.message || "Client error", {
      context: "ErrorHandler",
      ...errorContext,
    });
  }

  // Pass to next error handler
  next(err);
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "creditCard",
    "ssn",
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Morgan-style token generator for custom formats
 * Use this if you prefer morgan-style logging
 */
export const morganTokens = {
  correlationId: (req) => req.correlationId,
  userId: (req) => req.user?.id || req.user?._id || "-",
};

export default requestLoggerMiddleware;
