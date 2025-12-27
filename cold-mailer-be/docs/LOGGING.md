# Production-Grade Logging System

This document describes the enterprise-grade logging system implemented for the Cold Mailer API.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                            │
├─────────────────────────────────────────────────────────────────────┤
│  Request → requestLoggerMiddleware (Correlation ID + Context)       │
│      ↓                                                              │
│  Controllers/Services use createLogger() for contextual logging     │
│      ↓                                                              │
│  Logger outputs structured JSON with full metadata                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Transport Layer (Winston)                    |
├─────────────────────────────────────────────────────────────────────┤
│  Development:                                                       |
│    └── Console → Pretty formatted, colorized output                 │
│                                                                     │
│  Production (LOG_TO_FILE=true or NODE_ENV=production):              │
│    ├── Console → JSON format                                        │
│    ├── logs/error.log → Errors only (10MB rotation, 5 files)        │
│    ├── logs/combined.log → All levels (10MB rotation, 10 files)     │
│    └── logs/http.log → HTTP requests only (10MB rotation, 5 files)  │ 
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Log Levels

| Level   | Usage                          | Examples                                     |
| ------- | ------------------------------ | -------------------------------------------- |
| `error` | Application errors, exceptions | Database failures, unhandled exceptions      |
| `warn`  | Warning conditions             | Invalid login attempts, deprecated API usage |
| `info`  | Normal operational messages    | Server startup, user actions completed       |
| `http`  | HTTP request logging           | Request/response timing, status codes        |
| `debug` | Detailed debugging info        | Variable values, flow tracing                |

## 🔧 Environment Configuration

Add these to your `.env` file:

```bash
# Node environment (development, production, test)
NODE_ENV=development

# Log level override (error, warn, info, http, debug)
LOG_LEVEL=debug

# Enable file logging in development
LOG_TO_FILE=true

# Service identification for distributed systems
SERVICE_NAME=cold-mailer-api
```

## 💻 Usage Examples

### Basic Logging

```javascript
import logger from "./utils/logger.js";

logger.info("Server started");
logger.warn("Rate limit approaching");
logger.error("Database connection failed");
logger.debug("Processing user data", { userId: "123" });
```

### Contextual Child Loggers

```javascript
import { createLogger } from "./utils/logger.js";

// Create a logger with automatic context
const logger = createLogger("AuthController");

// All logs will include context: "AuthController"
logger.info("User logged in", { userId: user._id });
// Output: [2024-12-26 22:30:00.000] [info] [AuthController] User logged in {"userId":"123"}
```

### Error Logging with Full Context

```javascript
try {
  await someDatabaseOperation();
} catch (error) {
  logger.logError(error, {
    action: "createUser",
    userId: req.user?.id,
    correlationId: req.correlationId,
  });
}
```

### Audit Logging (Security Events)

```javascript
logger.audit("USER_LOGIN_SUCCESS", {
  userId: user._id,
  ip: req.ip,
  userAgent: req.get("user-agent"),
});
```

### Performance Metrics

```javascript
const startTime = Date.now();
await expensiveOperation();

logger.metric("database_query", Date.now() - startTime, {
  query: "findUserById",
  collection: "users",
});
```

### Timer Utility

```javascript
const timer = logger.startTimer();
await someAsyncOperation();
timer.done({ message: "Operation completed", context: "DatabaseQuery" });
```

## 🔍 Correlation ID Tracking

Every request automatically gets a correlation ID that propagates through all logs:

```javascript
// Incoming request header: X-Correlation-ID: my-trace-id
// Or auto-generated UUID if not provided

// In your controller:
export const myController = async (req, res) => {
  const correlationId = req.correlationId;

  logger.info("Processing request", { correlationId });
  // All logs with same correlationId can be traced together
};
```

## 📁 Log File Structure

When file logging is enabled:

```
logs/
├── error.log      # Only ERROR level logs
├── combined.log   # All log levels
├── http.log       # HTTP request logs
└── .gitkeep       # Keeps directory in git
```

### Log Rotation

- **Max file size**: 10MB
- **Max files**: 5-10 (depending on log type)
- **Newest logs**: At end of file (tailable)

## 🎨 Output Formats

### Development (Console)

```
2024-12-26 22:30:00.123 [info] [abc-123-def] [AuthController] User logged in {"userId":"507f1f77bcf86cd799439011"}
```

### Production (JSON)

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2024-12-26T17:00:00.123Z",
  "service": "cold-mailer-api",
  "environment": "production",
  "context": "AuthController",
  "correlationId": "abc-123-def",
  "userId": "507f1f77bcf86cd799439011"
}
```

## 🔒 Security Features

### Automatic Sensitive Data Redaction

The logger automatically redacts sensitive fields:

- `password`
- `token`
- `accessToken`
- `refreshToken`
- `secret`
- `apiKey`
- `creditCard`
- `ssn`

### Email Masking

User emails are logged in masked format: `tes***@***.com`

## 🚀 Best Practices

1. **Use contextual loggers**: Always use `createLogger("ControllerName")` for controllers/services
2. **Include correlation IDs**: Always pass `req.correlationId` in log metadata
3. **Use appropriate levels**: Don't log debug info at info level
4. **Structure your data**: Pass objects as metadata, not concatenated strings
5. **Log security events**: Use `logger.audit()` for authentication/authorization
6. **Track performance**: Use `logger.metric()` for timing-sensitive operations

## 📈 Monitoring Integration

The structured JSON format is compatible with:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **AWS CloudWatch**
- **Google Cloud Logging**
- **Datadog**
- **Splunk**
- **Grafana Loki**

Simply configure the appropriate transport or use a log shipper like Filebeat.

## 🛠️ Extending the Logger

### Adding Custom Transports

```javascript
// In utils/logger.js, add to transports array:

// Example: HTTP transport for log aggregation service
new winston.transports.Http({
  host: "log-aggregator.example.com",
  port: 443,
  path: "/logs",
  ssl: true,
});
```

### Adding Custom Formats

```javascript
const customFormat = winston.format((info) => {
  // Add custom processing
  info.customField = "value";
  return info;
});
```
