import express from "express";
import { login, signupUser, getUserProfile } from "../controller/Auth.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();

// Create a context-specific logger for auth routes
const logger = createLogger("AuthRoutes");

// Existing routes
router.post("/login", login);
router.post("/signup", signupUser);

// Request logging middleware for OAuth flows
const oauthLoggingMiddleware = (req, res, next) => {
  logger.debug("OAuth flow initiated", {
    path: req.path,
    correlationId: req.correlationId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
};

// Google OAuth routes. open from frontend on click
router.get(
  "/google",
  oauthLoggingMiddleware,
  passport.authenticate("google", {
    scope: ["profile", "email", "https://mail.google.com/"],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  // Google OAuth callback
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    const correlationId = req.correlationId;

    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET_KEY);

      // Audit log for OAuth login success
      logger.audit("OAUTH_LOGIN_SUCCESS", {
        userId: req.user._id,
        provider: "google",
        email: req.user.email
          ? `${req.user.email.substring(0, 3)}***`
          : undefined,
        correlationId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      // Redirect to frontend with token in URL params
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      logger.debug("Redirecting to frontend after OAuth", {
        frontendUrl,
        correlationId,
      });

      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      logger.logError(error, {
        context: "OAuthCallback",
        correlationId,
        provider: "google",
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Protected route to get user data
router.get(
  "/me",
  async (req, res, next) => {
    const correlationId = req.correlationId;

    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        logger.debug("Auth token missing in request", { correlationId });
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = { id: decoded.id };

      logger.debug("JWT token verified successfully", {
        userId: decoded.id,
        correlationId,
      });

      next();
    } catch (err) {
      logger.warn("JWT verification failed", {
        error: err.message,
        correlationId,
      });
      return res.status(401).json({ message: "Invalid token" });
    }
  },
  getUserProfile
);

export default router;
