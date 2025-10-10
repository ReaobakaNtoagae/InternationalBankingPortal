const express = require("express");
const rateLimit = require("express-rate-limit"); // 🛡️ Prevent DDoS and abuse
const xss = require("xss"); // 🛡️ Sanitize all inputs to prevent XSS
const validator = require("validator");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");


// 🛡️ Protection: Global rate limiter for all payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 payment-related requests
    message: { error: "Too many requests. Please try again later." },
});

// ============================
// Create a new payment
// ============================
router.post("/", authMiddleware, paymentLimiter, async (req, res) => {
    try {
        let { accountNumber, amount, currency, provider } = req.body;

        // 🛡️ Input Sanitization — prevents XSS and injection attacks
        accountNumber = xss(accountNumber.trim());
        currency = xss(currency.trim());
        provider = xss(provider.trim());
        amount = xss(amount.toString().trim());

        // 🛡️ Whitelist validation (RegEx + validator)
        const accPattern = /^[0-9]{10,12}$/;
        const currencyPattern = /^[A-Z]{3}$/; // e.g., USD, EUR, ZAR
        const providerPattern = /^[a-zA-Z\s]+$/;

        if (
            !accPattern.test(accountNumber) ||
            !currencyPattern.test(currency) ||
            !providerPattern.test(provider) ||
            !validator.isNumeric(amount)
        ) {
            return res.status(400).json({ error: "Invalid input format." });
        }

        // 🛡️ Parameterized query — protects against SQL Injection
        const user = await User.findOne({ accountNumber }).select("_id fullName");
        if (!user) {
            console.warn(`[Payment] User not found: ${accountNumber}`);
            return res.status(404).json({ error: "User not found." });
        }

        // 🛡️ Validate transaction amount range (to prevent abuse / logic attacks)
        if (Number(amount) <= 0 || Number(amount) > 1000000) {
            return res.status(400).json({ error: "Invalid amount range." });
        }

        const payment = new Payment({
            user: user._id,
            amount,
            currency,
            provider,
            type: "payment",
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
// Transfer funds to beneficiary
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

        // 🛡️ Sanitize input (prevents stored XSS and injection)
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

        // 🛡️ Find sender safely
        const sender = await User.findOne({ accountNumber: fields.accountNumber });
        if (!sender) {
            console.warn(`[Transfer] Sender not found: ${fields.accountNumber}`);
            return res.status(404).json({ error: "Sender not found." });
        }

        // 🛡️ Amount validation — prevents integer overflow / abuse
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
// Get all payments for an account
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

        // 🛡️ Use .lean() to prevent prototype pollution
        const payments = await Payment.find({ user: user._id })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`[Payments] Fetched for user: ${user.fullName}`);
        return res.json(payments);
    } catch (err) {
        console.error("[Payments] Fetch error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
