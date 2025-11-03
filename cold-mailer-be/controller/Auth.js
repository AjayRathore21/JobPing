import bcrypt from "bcrypt";
import User from "../model/User.js";
import logger from "../utils/logger.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    return res.status(200).json({
      message: "Login successful.",
      user: user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Register (Sign up) a new user
 * @route POST /auth/signup
 * @access Public
 */
export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Signup Request Body:@@@@", req.body);
    if (!email || !password) {
      logger.warn("Signup attempt with missing email or password");
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info(`Signup attempt with existing email: ${email}`);
      return res.status(400).json({ message: "User already exists." });
    }
    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();
    logger.info(`New user registered: ${newUser}`);
    return res.status(201).json({
      message: "User registered successfully.",
      user: newUser,
    });
  } catch (error) {
    logger.error("Signup Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
