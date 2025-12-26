import express from "express";
import { login, signupUser, getUserProfile } from "../controller/Auth.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../model/User.js";

const router = express.Router();

// Existing routes
router.post("/login", login);
router.post("/signup", signupUser);

const middleware = (req, res, next) => {
  console.log("are you running@@@@@@@");
  next();
};

// Google OAuth routes. open from frontend on click
router.get(
  "/google",
  middleware,
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/gmail.send"],
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
    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET_KEY);

      // Redirect to frontend with token in URL params
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// Protected route to get user data
router.get(
  "/me",
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = { id: decoded.id };
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  },
  getUserProfile
);

export default router;
