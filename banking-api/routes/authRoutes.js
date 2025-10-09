const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit"); // 🛡️ Protection: Throttle brute-force attacks
const xss = require("xss"); // 🛡️ Protection: Sanitizes input against XSS payloads
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// 🛡️ Protection: Rate limiting to prevent brute-force login attempts
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit to 5 login attempts per IP per window
    message: { error: "Too many login attempts. Please try again later." },
});

// 🛡️ Protection: Token generator with short expiry to limit stolen token risk
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing in .env");
    return jwt.sign({ id }, secret, { expiresIn: "1d" }); // Token expires in 1 day
};

// REGISTER USER
router.post("/register", async (req, res) => {
    try {
        let { fullName, idNumber, accountNumber, password } = req.body;

        // 🛡️ Protection: Input Sanitization & Whitelisting
        // Prevents XSS and malicious payloads (e.g. script injections)
        fullName = xss(fullName.trim());
        idNumber = xss(idNumber.trim());
        accountNumber = xss(accountNumber.trim());
        password = xss(password.trim());

        // 🛡️ Protection: Validate input formats using RegEx (Whitelist pattern)
        const namePattern = /^[a-zA-Z\s]+$/;
        const idPattern = /^[0-9]{13}$/;
        const accountPattern = /^[0-9]{10,12}$/;

        if (
            !fullName.match(namePattern) ||
            !idNumber.match(idPattern) ||
            !accountNumber.match(accountPattern)
        ) {
            return res.status(400).json({ error: "Invalid input format detected." });
        }

        if (!password || password.length < 8) {
            return res
                .status(400)
                .json({ error: "Password must be at least 8 characters long." });
        }

        // 🛡️ Protection: Prevent duplicate accounts (SQL injection-safe)
        // Using Mongoose parameterized queries protects against SQL Injection
        const existingUser = await User.findOne({ accountNumber });
        if (existingUser) {
            return res.status(400).json({ error: "Account number already registered." });
        }

        // 🛡️ Protection: Password Hashing & Salting
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            idNumber,
            accountNumber,
            password: hashedPassword,
        });

        await newUser.save();

        const token = generateToken(newUser._id);

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

// LOGIN USER
router.post("/login", loginLimiter, async (req, res) => {
    try {
        let { accountNumber, password, fullName } = req.body;

        // 🛡️ Protection: Sanitize input (prevent XSS and injection)
        accountNumber = xss(accountNumber.trim());
        password = xss(password.trim());
        fullName = xss(fullName.trim());

        // 🛡️ Protection: Whitelist pattern validation
        const accountPattern = /^[0-9]{10,12}$/;
        if (!accountNumber.match(accountPattern)) {
            return res.status(400).json({ error: "Invalid account number format." });
        }

        const user = await User.findOne({ accountNumber });
        if (!user) {
            return res.status(404).json({ error: "Invalid credentials." });
        }

        // Normalize full name for comparison
        if (fullName.toLowerCase() !== user.fullName.toLowerCase()) {
            return res.status(401).json({ error: "Full name does not match." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = generateToken(user._id);

        // 🛡️ Protection: HttpOnly Cookie Option (optional, if using browser auth)
        // res.cookie("token", token, {
        //   httpOnly: true,
        //   secure: true, // ensures cookie is only sent over HTTPS
        //   sameSite: "Strict", // prevents CSRF & session fixation
        // });

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
    try {
        // 🛡️ Protection: Sensitive data never returned (no password, tokens)
        res.status(200).json(req.user);
    } catch (err) {
        console.error("❌ Fetch user error:", err.message);
        res.status(500).json({ error: "Server error fetching user details." });
    }
});

module.exports = router;
