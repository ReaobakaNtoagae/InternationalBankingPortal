const express = require("express");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const validator = require("validator");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// 🛡️ Rate limiter for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again later." },
});

// ============================
// 🔍 Get pending payments (employees only)
// ============================
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    console.log("🔍 /pending route hit by:", req.user?.fullName, "| Role:", req.user?.role);

    if (!req.user || req.user.role.toLowerCase() !== "employee") {
      console.warn("⛔ Access denied for non-employee:", req.user?.role);
      return res.status(403).json({ error: "Access denied." });
    }

    const pendingPayments = await Payment.find({ status: "pending" }).lean();
    console.log("📦 Pending payments fetched:", pendingPayments.length);

    return res.status(200).json({ payments: pendingPayments });
  } catch (err) {
    console.error("❌ /pending route error:", err);
    return res.status(500).json({ error: "Server error fetching pending payments." });
  }
});

// ============================
// 🧾 Create new payment
// ============================
router.post("/", authMiddleware, paymentLimiter, async (req, res) => {
  try {
    let { accountNumber, amount, currency, provider } = req.body;

    if (!accountNumber || !amount || !currency || !provider) {
      return res.status(400).json({ error: "All fields are required." });
    }

    accountNumber = xss(accountNumber.trim());
    currency = xss(currency.trim());
    provider = xss(provider.trim());
    amount = xss(amount.toString().trim());

    const accPattern = /^[0-9]{10,12}$/;
    const currencyPattern = /^[A-Z]{3}$/;
    const providerPattern = /^[a-zA-Z\s]+$/;

    if (
      !accPattern.test(accountNumber) ||
      !currencyPattern.test(currency) ||
      !providerPattern.test(provider) ||
      !validator.isNumeric(amount)
    ) {
      return res.status(400).json({ error: "Invalid input format." });
    }

    const user = await User.findOne({ accountNumber }).select("_id fullName");
    if (!user) {
      console.warn(`[Payment] User not found: ${accountNumber}`);
      return res.status(404).json({ error: "User not found." });
    }

    if (Number(amount) <= 0 || Number(amount) > 1000000) {
      return res.status(400).json({ error: "Invalid amount range." });
    }

    const payment = new Payment({
      user: user._id,
      amount,
      currency,
      provider,
      type: "payment",
      status: "pending",
    });

    await payment.save();
    console.log(`[Payment] Created for ${user.fullName}: ${payment._id}`);

    return res.status(201).json({
      message: "Payment created successfully.",
      payment,
    });
  } catch (err) {
    console.error("[Payment] Creation error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ============================
// 🔁 Transfer funds
// ============================
router.post("/transfer", authMiddleware, paymentLimiter, async (req, res) => {
  try {
    let {
      accountNumber,
      beneficiaryName,
      accountNumberBeneficiary,
      bankName,
      swiftCode,
      amount,
      currency,
      reference,
      paymentId,
    } = req.body;

    const fields = {
      accountNumber,
      beneficiaryName,
      accountNumberBeneficiary,
      bankName,
      swiftCode,
      currency,
      reference,
      paymentId,
      amount: amount?.toString(),
    };

    for (const key in fields) {
      if (!fields[key]) {
        return res.status(400).json({ error: `${key} is required.` });
      }
      fields[key] = xss(fields[key].trim());
    }

    const accPattern = /^[0-9]{10,12}$/;
    const namePattern = /^[a-zA-Z\s]+$/;
    const swiftPattern = /^[A-Z0-9]{8,11}$/;
    const currencyPattern = /^[A-Z]{3}$/;

    if (
      !accPattern.test(fields.accountNumber) ||
      !accPattern.test(fields.accountNumberBeneficiary) ||
      !namePattern.test(fields.beneficiaryName) ||
      !swiftPattern.test(fields.swiftCode) ||
      !currencyPattern.test(fields.currency)
    ) {
      return res.status(400).json({ error: "Invalid input format detected." });
    }

    const sender = await User.findOne({ accountNumber: fields.accountNumber });
    if (!sender) {
      console.warn(`[Transfer] Sender not found: ${fields.accountNumber}`);
      return res.status(404).json({ error: "Sender not found." });
    }

    const numericAmount = Number(fields.amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || numericAmount > 1000000) {
      return res.status(400).json({ error: "Invalid transfer amount." });
    }

    const transfer = new Payment({
      user: sender._id,
      amount: numericAmount,
      currency: fields.currency,
      reference: fields.reference,
      type: "transfer",
      beneficiaryName: fields.beneficiaryName,
      accountNumber: fields.accountNumberBeneficiary,
      bankName: fields.bankName,
      swiftCode: fields.swiftCode,
      linkedPayment: fields.paymentId,
      status: "completed",
    });

    await transfer.save();
    console.log(`[Transfer] Completed for ${sender.fullName}: ${transfer._id}`);

    return res.status(201).json({
      message: "Transfer completed successfully.",
      payment: transfer,
    });
  } catch (err) {
    console.error("[Transfer] Creation error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ============================
// 📄 Get all payments by account
// ============================
router.get("/:accountNumber", authMiddleware, paymentLimiter, async (req, res) => {
  try {
    const accountNumber = xss(req.params.accountNumber.trim());
    const accPattern = /^[0-9]{10,12}$/;

    if (!accPattern.test(accountNumber)) {
      return res.status(400).json({ error: "Invalid account number format." });
    }

    const user = await User.findOne({ accountNumber }).select("_id fullName");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const payments = await Payment.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Payments] Fetched for user: ${user.fullName}`);
    return res.json({ payments });
  } catch (err) {
    console.error("[Payments] Fetch error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
