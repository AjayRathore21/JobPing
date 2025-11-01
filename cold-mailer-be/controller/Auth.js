import User from "../model/User.js";

export const login = async (req, res) => {
  console.log("this is req obj");

  try {
    console.log("Login Request Body:", req.body);
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }

    // 2️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    return res
      .status(200)
      .json({
        message: "Login successful.",
        user: { id: user._id, email: user.email },
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

    // 1️⃣ Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 3️⃣ Create new user instance
    const newUser = new User({ email, password, name });

    // 4️⃣ Save to DB (password hashed automatically in model)
    await newUser.save();

    // 5️⃣ Return success response
    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
