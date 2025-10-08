const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// JWT Token Generator
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  console.log("🔐 Generating JWT token...");
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }
  return jwt.sign({ id }, secret, { expiresIn: "1d" });
};

// REGISTER
router.post("/register", async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;
  console.log("📥 Incoming registration:", req.body);

  if (!fullName || !idNumber || !accountNumber || !password) {
    console.warn("⚠️ Missing required fields");
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    console.log("🔍 Checking for existing user...");
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) {
      console.warn("⚠️ Account number already registered");
      return res.status(400).json({ error: "Account number already registered." });
    }

    console.log("📝 Creating new user...");
    const newUser = new User({ fullName, idNumber, accountNumber, password });
    await newUser.save();
    console.log("✅ User saved:", newUser._id);

    const token = generateToken(newUser._id);
    console.log("✅ Token generated");

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        accountNumber: newUser.accountNumber,
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  const { accountNumber, password, fullName } = req.body;

  if (!accountNumber || !password || !fullName) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const user = await User.findOne({ accountNumber });

    if (!user) {
      console.warn("⚠️ Account number not found");
      return res.status(404).json({ error: "Invalid credentials." });
    }

    // Normalize full name comparison
    if (fullName.trim().toLowerCase() !== user.fullName.trim().toLowerCase()) {
      console.warn("⚠️ Full name mismatch");
      return res.status(401).json({ error: "Full name does not match." });
    }

    const rawPassword = password.trim();
    console.log("🔍 Comparing password inputs:");
    console.log("🔍 Raw password from user:", `"${rawPassword}"`);
    console.log("🔍 Stored hashed password:", `"${user.password}"`);

    const isMatch = await bcrypt.compare(rawPassword, user.password);

    if (!isMatch) {
      console.warn("⚠️ Password mismatch");
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user._id);
    console.log("✅ Login successful");

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


// GET CURRENT USER
router.get("/me", authMiddleware, async (req, res) => {
  console.log("🔐 Fetching current user...");
  try {
    res.json(req.user);
  } catch (err) {
    console.error("❌ Fetch user error:", err.message);
    res.status(500).json({ error: "Server error fetching user details." });
  }
});

module.exports = router;