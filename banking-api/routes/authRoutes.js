const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined.");
  return jwt.sign({ id }, secret, { expiresIn: "1d" });
};

router.post("/register", async (req, res) => {
  console.log("📥 Incoming registration payload:", req.body);
  const { fullName, idNumber, accountNumber, password } = req.body;

  if (!fullName || !idNumber || !accountNumber || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

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
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) {
      return res.status(400).json({ error: "Account number already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ fullName, idNumber, accountNumber, password: hashedPassword });
    await newUser.save();

    const token = generateToken(newUser._id);

    return res.status(201).json({
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
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

module.exports = router;
