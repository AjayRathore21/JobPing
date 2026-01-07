import bcrypt from "bcrypt";
import User from "../model/User.js";
import { createLogger } from "../utils/logger.js";
import jwt from "jsonwebtoken";

// Create a context-specific logger for this controller
const logger = createLogger("AuthController");

export const login = async (req, res) => {
  const startTime = Date.now();

  console.log("Login attempt initiated", {
    email: req.body.email,
    correlationId: req.correlationId,
  });

  try {
    const { email, password } = req.body;
    const correlationId = req.correlationId;

    logger.debug("Login attempt initiated", {
      email: email ? `${email.substring(0, 3)}***` : undefined,
      correlationId,
    });

    if (!email || !password) {
      logger.warn("Login failed - missing credentials", {
        hasEmail: !!email,
        hasPassword: !!password,
        correlationId,
      });
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }

    const user = await User.findOne({ email }).populate("customMailSent");

    if (!user) {
      logger.info("Login failed - user not found", {
        email: `${email.substring(0, 3)}***`,
        correlationId,
      });
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Handle OAuth users or users without a password
    if (!user.password) {
      logger.info("Login failed - OAuth user attempted password login", {
        userId: user._id,
        correlationId,
      });
      return res.status(400).json({
        message: "This account uses Google Login. Please sign in with Google.",
      });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn("Login failed - invalid password", {
        userId: user._id,
        correlationId,
      });
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Create JWT (minimal payload)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);

    // Audit log for successful login
    logger.audit("USER_LOGIN_SUCCESS", {
      userId: user._id,
      email: `${email.substring(0, 3)}***`,
      correlationId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    // Performance metric
    logger.metric("auth_login_duration", Date.now() - startTime, {
      success: true,
    });

    res.json({ msg: "Logged in", user, token });
  } catch (error) {
    logger.logError(error, {
      action: "login",
      correlationId: req.correlationId,
      duration: Date.now() - startTime,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Register (Sign up) a new user
 * @route POST /auth/signup
 * @access Public
 */
export const signupUser = async (req, res) => {
  const startTime = Date.now();

  try {
    const { name, email, password } = req.body;
    const correlationId = req.correlationId;

    logger.debug("Signup attempt initiated", {
      email: email ? `${email.substring(0, 3)}***` : undefined,
      hasName: !!name,
      correlationId,
    });

    if (!email || !password) {
      logger.warn("Signup failed - missing required fields", {
        hasEmail: !!email,
        hasPassword: !!password,
        correlationId,
      });
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      logger.info("Signup failed - email already exists", {
        email: `${email.substring(0, 3)}***`,
        correlationId,
      });
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    // Audit log for new user registration
    logger.audit("USER_REGISTRATION_SUCCESS", {
      userId: newUser._id,
      email: `${email.substring(0, 3)}***`,
      correlationId,
      ip: req.ip,
    });

    // Performance metric
    logger.metric("auth_signup_duration", Date.now() - startTime, {
      success: true,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: newUser,
    });
  } catch (error) {
    logger.logError(error, {
      action: "signup",
      correlationId: req.correlationId,
      duration: Date.now() - startTime,
    });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const correlationId = req.correlationId;

    const user = await User.findById(req.user.id).populate("customMailSent");

    if (!user) {
      logger.warn("Get profile failed - user not found", {
        userId: req.user.id,
        correlationId,
      });
      return res.status(404).json({ message: "User not found" });
    }

    logger.debug("User profile retrieved", {
      userId: user._id,
      correlationId,
    });

    res.json({ user });
  } catch (error) {
    logger.logError(error, {
      action: "getUserProfile",
      userId: req.user?.id,
      correlationId: req.correlationId,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};
