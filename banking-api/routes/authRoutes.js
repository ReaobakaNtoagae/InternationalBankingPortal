const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const xss = require("xss");
const User = require("../models/User");
require("dotenv").config();
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔐 Token generator
const generateToken = (_id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined.");
  return jwt.sign({ _id }, secret, { expiresIn: "1d" });
};

// ============================
// 🔐 LOGIN
// ============================
router.post("/login", async (req, res) => {
  let { accountNumber, password, fullName } = req.body;

  console.log("🔹 Login attempt received:", { accountNumber, fullName });

  if (!accountNumber || !password || !fullName) {
    console.warn("⚠ Missing field(s):", { accountNumber, password, fullName });
    return res.status(400).json({ error: "All fields are required." });
  }

  accountNumber = xss(accountNumber.trim());
  password = xss(password.trim());
  fullName = xss(fullName.trim());

  try {
    console.log(`🔍 Searching for user with accountNumber: ${accountNumber} and fullName: ${fullName}`);

    const user = await User.findOne({
      accountNumber: accountNumber,
      fullName: { $regex: new RegExp(`^${fullName}$`, "i") }
    });

    if (!user) {
      console.warn("❌ No user found with matching credentials");
      return res.status(404).json({ error: "Invalid credentials." });
    }

    console.log("🧠 FINAL MATCHED USER:", user._id, "| ROLE:", user.role);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`⚠ Password mismatch for accountNumber: ${accountNumber}`);
      return res.status(401).json({ error: "Invalid credentials." });
    }

    console.log("✅ Password verified successfully!");

    const token = generateToken(user._id);
    console.log(`🎟 Token generated for user: ${user.fullName} | ID: ${user._id} | Role: ${user.role}`);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        role: user.role || "N/A",
      },
    });
  } catch (err) {
    console.error("❌ Unexpected login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ============================
// 👤 GET CURRENT USER
// ============================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🔓 Token decoded: { _id: '${userId}' }`);

    const user = await User.findById(userId);
    if (!user) {
      console.warn("❌ No user found in DB for ID:", userId);
      return res.status(404).json({ error: "User not found." });
    }

    console.log("📦 /me fetched user:", user.fullName, "| Role:", user.role, "| ID:", user._id);

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Fetch user error:", err);
    res.status(500).json({ error: "Server error fetching user details." });
  }
});

module.exports = router;
