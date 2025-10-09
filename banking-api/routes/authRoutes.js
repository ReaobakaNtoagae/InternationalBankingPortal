const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined.");
  return jwt.sign({ id }, secret, { expiresIn: "1d" });
};

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  console.log("📥 Incoming registration payload:", req.body);
  const { fullName, idNumber, accountNumber, password } = req.body;

  // ✅ Validate required fields
  if (!fullName || !idNumber || !accountNumber || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // ✅ Regex patterns
  const patterns = {
    fullName: /^[A-Za-z\s\-']{2,50}$/,
    idNumber: /^\d{13}$/,
    accountNumber: /^\d{12}$/,
    password: /^[\w@#\$%\^&\*\-]{8,32}$/
  };

  for (const field in patterns) {
    if (!patterns[field].test(req.body[field])) {
      console.warn(`⚠️ Invalid ${field}:`, req.body[field]);
      return res.status(400).json({ error: `Invalid ${field} format.` });
    }
  }

  try {
    // ✅ Check for existing user
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) {
      return res.status(400).json({ error: "Account number already registered." });
    }

    // ✅ Hash password & save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, idNumber, accountNumber, password: hashedPassword });
    await newUser.save();

    // ✅ Generate token
    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        accountNumber: newUser.accountNumber,
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// 🧯 Catch unmatched auth routes
router.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

module.exports = router;
