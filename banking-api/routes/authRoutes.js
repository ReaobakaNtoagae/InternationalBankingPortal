const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const xss = require("xss");
const User = require("../models/User");
require("dotenv").config();
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined.");
  return jwt.sign({ id }, secret, { expiresIn: "1d" });
};

// 🚫 Registration removed — users are created by admin only

router.post("/login", async (req, res) => {
  const { accountNumber, password, fullName } = req.body;

  if (!accountNumber || !password || !fullName) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(404).json({ error: "Invalid credentials." });
    }

    if (fullName.trim().toLowerCase() !== user.fullName.trim().toLowerCase()) {
      return res.status(401).json({ error: "Full name does not match." });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user._id);

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

router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error("❌ Fetch user error:", err.message);
    res.status(500).json({ error: "Server error fetching user details." });
  }
});

module.exports = router;
