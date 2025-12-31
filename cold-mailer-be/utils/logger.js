/**
 * Production-Grade Logging System
 *
 * Architecture follows Google Cloud Logging and industry best practices:
 * - Structured JSON logging for machine parsing (ELK, CloudWatch, Datadog)
 * - Human-readable console output for development
 * - Log levels: error, warn, info, http, debug
 * - Correlation ID tracking for distributed tracing
 * - Automatic error stack capture
 * - Performance metrics support
 * - Child loggers for contextual logging
 *
 * @module utils/logger
 */

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, "../logs");

// ============================================
// Custom Formats
// ============================================

/**
 * Custom format for adding consistent metadata to all logs
 */
const addMetadata = winston.format((info) => {
  info.service = process.env.SERVICE_NAME || "cold-mailer-api";
  info.environment = process.env.NODE_ENV || "development";
  info.version = process.env.npm_package_version || "1.0.0";
  info.hostname = process.env.HOSTNAME || "localhost";
  info.pid = process.pid;
  return info;
});

/**
 * Format for sanitizing sensitive data (passwords, tokens)
 */
const sanitizeSensitiveData = winston.format((info) => {
  const sensitiveFields = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
  ];

  if (typeof info.message === "object") {
    sensitiveFields.forEach((field) => {
      if (info.message[field]) {
        info.message[field] = "[REDACTED]";
      }
    });
  }

  // Also check in metadata
  if (info.metadata && typeof info.metadata === "object") {
    sensitiveFields.forEach((field) => {
      if (info.metadata[field]) {
        info.metadata[field] = "[REDACTED]";
      }
    });
  }

  return info;
});

/**
 * Error format that properly serializes Error objects
 */
const errorFormat = winston.format((info) => {
  if (info.error instanceof Error) {
    info.error = {
      message: info.error.message,
      stack: info.error.stack,
      name: info.error.name,
      ...(info.error.code && { code: info.error.code }),
    };
  }

  // Handle errors passed as the main message
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
      level: info.level || "error",
    };
  }

  return info;
});

// ============================================
// Console Format (Development - Human Readable)
// ============================================

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      correlationId,
      context,
      duration,
      ...meta
    }) => {
      // Build the log line
      let logLine = `${timestamp} [${level}]`;

      // Add correlation ID if present (for request tracing)
      if (correlationId) {
        logLine += ` [${correlationId}]`;
      }

      // Add context (e.g., controller name, method)
      if (context) {
        logLine += ` [${context}]`;
      }

      // Add the main message
      logLine += ` ${
        typeof message === "object" ? JSON.stringify(message, null, 2) : message
      }`;

      // Add duration for performance logs
      if (duration) {
        logLine += ` (${duration}ms)`;
      }

      // Add any additional metadata
      const additionalMeta = Object.keys(meta).filter(
        (key) =>
          ![
            "service",
            "environment",
            "version",
            "hostname",
            "pid",
            "error",
          ].includes(key)
      );

      if (additionalMeta.length > 0) {
        const metaObj = {};
        additionalMeta.forEach((key) => {
          metaObj[key] = meta[key];
        });
        logLine += ` ${JSON.stringify(metaObj)}`;
      }

      // Add error stack if present
      if (meta.error && meta.error.stack) {
        logLine += `\n${meta.error.stack}`;
      }

      return logLine;
    }
  )
);

// ============================================
// JSON Format (Production - Machine Readable)
// ============================================

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  addMetadata(),
  sanitizeSensitiveData(),
  errorFormat(),
  winston.format.json()
);

// ============================================
// Determine Log Level
// ============================================

const getLogLevel = () => {
  const env = process.env.NODE_ENV || "development";
  const customLevel = process.env.LOG_LEVEL;

  if (customLevel) return customLevel;

  switch (env) {
    case "production":
      return "info";
    case "test":
      return "warn";
    case "development":
    default:
      return "debug";
  }
};

// ============================================
// Create Transports
// ============================================

const transports = [];

// Console transport - always enabled
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? jsonFormat : consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  })
);

// File transports - enabled in production or when LOG_TO_FILE is set, but ONLY if not in Lambda
if (
  (process.env.NODE_ENV === "production" ||
    process.env.LOG_TO_FILE === "true") &&
  !process.env.LAMBDA_TASK_ROOT
) {
  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Combined logs (all levels)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    })
  );

  // HTTP request logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "http.log"),
      level: "http",
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

// ============================================
// Create Main Logger Instance
// ============================================

const logger = winston.createLogger({
  level: getLogLevel(),
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  defaultMeta: {},
  transports,
  exitOnError: false,
});

// Add colors for custom levels
winston.addColors({
  error: "red bold",
  warn: "yellow bold",
  info: "green",
  http: "magenta",
  debug: "blue",
});

// ============================================
// Logger Utility Methods
// ============================================

/**
 * Create a child logger with additional context
 * Useful for adding controller/service name to all logs
 *
 * @example
 * const authLogger = logger.child({ context: 'AuthController' });
 * authLogger.info('User logged in', { userId: '123' });
 */
logger.child = (defaultMeta) => {
  const childLogger = winston.createLogger({
    level: logger.level,
    levels: logger.levels,
    transports: logger.transports,
    defaultMeta: { ...logger.defaultMeta, ...defaultMeta },
    exitOnError: false,
  });

  // Add ALL utility methods to child logger
  childLogger.startTimer = logger.startTimer.bind(logger);
  childLogger.httpRequest = logger.httpRequest.bind(logger);
  childLogger.logError = logger.logError.bind(logger);
  childLogger.audit = logger.audit.bind(logger);
  childLogger.metric = logger.metric.bind(logger);

  return childLogger;
};

/**
 * Performance timing utility
 *
 * @example
 * const end = logger.startTimer();
 * await someOperation();
 * end.done({ message: 'Operation completed', context: 'DatabaseQuery' });
 */
logger.startTimer = () => {
  const start = Date.now();
  return {
    done: (info = {}) => {
      const duration = Date.now() - start;
      logger.info(info.message || "Timer completed", {
        ...info,
        duration,
      });
    },
  };
};

/**
 * Log HTTP request (used by middleware)
 */
logger.httpRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    contentLength: res.get("content-length") || 0,
    userAgent: req.get("user-agent"),
    ip: req.ip || req.connection?.remoteAddress,
    correlationId: req.correlationId,
  };

  // Log level based on status code
  if (res.statusCode >= 500) {
    logger.error("HTTP Request Error", logData);
  } else if (res.statusCode >= 400) {
    logger.warn("HTTP Request Client Error", logData);
  } else {
    logger.http("HTTP Request", logData);
  }
};

/**
 * Structured error logging with full context
 *
 * @example
 * logger.logError(error, {
 *   context: 'AuthController.login',
 *   userId: req.user?.id,
 *   action: 'user_login'
 * });
 */
logger.logError = (error, meta = {}) => {
  logger.error(error.message || "Unknown error", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    ...meta,
  });
};

/**
 * Audit log for security-sensitive operations
 *
 * @example
 * logger.audit('USER_LOGIN', { userId: '123', ip: '192.168.1.1' });
 */
logger.audit = (action, meta = {}) => {
  logger.info(`AUDIT: ${action}`, {
    type: "audit",
    action,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

/**
 * Performance metric logging
 *
 * @example
 * logger.metric('database_query', 150, { query: 'findUser' });
 */
logger.metric = (name, value, meta = {}) => {
  logger.info(`METRIC: ${name}`, {
    type: "metric",
    metricName: name,
    metricValue: value,
    ...meta,
  });
};

// ============================================
// Export
// ============================================

export default logger;

/**
 * Export child logger factory for controller/service-specific loggers
 */
export const createLogger = (context) => {
  return logger.child({ context });
};
