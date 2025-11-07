import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Rate limiter for payment creation
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many payment requests. Please wait 10 seconds before retrying.",
});

const SWIFT_CODES = {
  "Absa Bank Limited": "ABSAZAJJXXX",
  "African Bank Limited": "AFRCZAJJXXX",
  "Bidvest Bank Limited": "BIDBZAJJXXX",
  "Capitec Bank Limited": "CABLZAJJXXX",
  "Discovery Bank Limited": "DISCZAJJ",
  "First National Bank ": "FIRNZAJJ",
  "FirstRand Bank": "FIRNZAJJRSL",
  "Grindrod Bank Limited": "GRIDZAJJXXX",
  "Investec Bank Limited": "IVESZAJJXXX",
  "Mercantile Bank Limited": "LISAZAJJXXX",
  "Nedbank Limited": "NEDSZAJJXXX",
  "Standard Bank of South Africa": "SBZAZAJJ",
};

// ✅ Create Payment
router.post(
  "/",
  authMiddleware,
  paymentLimiter,
  [
    body("amount")
      .isNumeric().withMessage("Amount must be a number")
      .matches(/^\d+(\.\d{1,2})?$/).withMessage("Invalid amount format"),
    body("currency")
      .notEmpty().withMessage("Currency is required")
      .matches(/^[A-Z]{3}$/).withMessage("Currency must be a valid 3-letter ISO code"),
    body("provider")
      .notEmpty().withMessage("Provider is required")
      .matches(/^[a-zA-Z0-9\s\.,'-]{2,50}$/).withMessage("Invalid provider name"),
    body("accountNumber")
      .notEmpty().withMessage("Account number is required")
      .matches(/^[0-9]{6,20}$/).withMessage("Invalid account number format"),
    body("beneficiaryName")
      .optional()
      .matches(/^[a-zA-Z\s\.'-]{2,100}$/).withMessage("Invalid beneficiary name"),
    body("reference")
      .optional()
      .matches(/^[a-zA-Z0-9\s\.,#\-]{0,100}$/).withMessage("Invalid reference format"),
  ],
  async (req, res) => {
    try {
      console.log("[Payment Init] Request body:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("[Payment Init] Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, currency, provider, accountNumber, beneficiaryName, reference } = req.body;

      const payment = new Payment({
        user: req.user.id,
        amount,
        currency,
        provider,
        accountNumber,
        beneficiaryName,
        reference,
        status: "initialized",
        type: "payment",
      });

      await payment.save();
      console.log("[Payment Init] Payment saved:", payment);
      res.status(201).json({ message: "Payment initialized successfully.", payment });
    } catch (error) {
      console.error("[Payment Init Error]:", error);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  }
);

// ✅ Create Transfer
router.post(
  "/transfer",
  authMiddleware,
  [
    body("amount")
      .isNumeric().withMessage("Amount must be a number")
      .matches(/^\d+(\.\d{1,2})?$/).withMessage("Invalid amount format"),
    body("bankName")
      .notEmpty().withMessage("Bank name is required")
      .matches(/^[a-zA-Z\s\.,'-]{2,100}$/).withMessage("Invalid bank name"),
    body("swiftCode")
      .notEmpty().withMessage("SWIFT code is required")
      .matches(/^[A-Z0-9]{8,11}$/).withMessage("Invalid SWIFT code format"),
    body("accountNumber")
      .notEmpty().withMessage("Account number is required")
      .matches(/^[0-9]{6,20}$/).withMessage("Invalid account number"),
    body("currency")
      .optional()
      .matches(/^[A-Z]{3}$/).withMessage("Currency must be a valid 3-letter ISO code"),
    body("beneficiaryName")
      .optional()
      .matches(/^[a-zA-Z\s\.'-]{2,100}$/).withMessage("Invalid beneficiary name"),
    body("reference")
      .optional()
      .matches(/^[a-zA-Z0-9\s\.,#\-]{0,100}$/).withMessage("Invalid reference format"),
  ],
  async (req, res) => {
    try {
      console.log("[Transfer] Request body:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("[Transfer] Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, bankName, swiftCode, accountNumber, currency, beneficiaryName, reference } = req.body;

      const expectedSwift = SWIFT_CODES[bankName];
      let status = "pending";

      if (!expectedSwift || swiftCode.toUpperCase() !== expectedSwift) {
        status = "rejected";
        console.log(`[Transfer] Invalid SWIFT code for ${bankName}: ${swiftCode} (expected ${expectedSwift})`);
      }

      const transfer = new Payment({
        user: req.user.id,
        amount,
        currency: currency || "ZAR",
        bankName,
        swiftCode,
        accountNumber,
        beneficiaryName,
        reference,
        status,
        type: "transfer",
      });

      await transfer.save();
      console.log("[Transfer] Transfer saved:", transfer);

      if (status === "rejected") {
        return res.status(200).json({
          message: "Transfer automatically rejected due to invalid SWIFT code.",
          payment: transfer,
        });
      }

      res.status(201).json({ message: "Transfer created successfully.", payment: transfer });
    } catch (error) {
      console.error("[Transfer Error]:", error);
      res.status(500).json({ error: "Failed to create transfer" });
    }
  }
);

// ✅ Customer Transaction History
router.get("/history", authMiddleware, async (req, res) => {
  try {
    console.log("[History] Fetching transactions for user:", req.user.id);
    const payments = await Payment.find({
      user: req.user.id,
      type: { $in: ["payment", "transfer"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("[History] Transactions fetched:", payments.length);
    res.json({ transactions: payments });
  } catch (error) {
    console.error("[History Error]:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

// ✅ Submitted Payments (Admin)
router.get("/submitted", authMiddleware, async (req, res) => {
  try {
    console.log("[Submitted] Fetching submitted payments");
    const payments = await Payment.find({ status: "submitted" })
      .sort({ createdAt: -1 })
      .populate("user", "fullName accountNumber");

    console.log("[Submitted] Submitted payments count:", payments.length);
    res.json({ payments });
  } catch (error) {
    console.error("[Submitted Error]:", error);
    res.status(500).json({ error: "Failed to fetch submitted payments" });
  }
});

// ✅ Approve Payment (Admin)
router.put("/approve/:id", authMiddleware, async (req, res) => {
  try {
    console.log("[Approve] Payment ID:", req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("[Approve] Invalid payment ID");
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.log("[Approve] Payment not found");
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = "approved";
    await payment.save();
    console.log("[Approve] Payment approved:", payment);
    res.json({ message: "Payment approved successfully.", payment });
  } catch (error) {
    console.error("[Approve Error]:", error);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// ✅ Pending Payments (Admin)
router.post("/pending", authMiddleware, async (req, res) => {
  try {
    console.log("[Pending] Fetching pending payments");
    const payments = await Payment.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("user", "fullName accountNumber");

    console.log("[Pending] Pending payments count:", payments.length);
    res.json({ payments });
  } catch (error) {
    console.error("[Pending Error]:", error);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
});

// ✅ Reject Payment
router.patch("/reject/:id", authMiddleware, async (req, res) => {
  try {
    console.log("[Reject] Payment ID:", req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("[Reject] Invalid payment ID");
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.log("[Reject] Payment not found");
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = "rejected";
    await payment.save();
    console.log("[Reject] Payment rejected:", payment);
    res.json({ message: "Payment rejected successfully.", payment });
  } catch (error) {
    console.error("[Reject Error]:", error);
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

// ✅ Rejected Payments
router.get("/rejected", authMiddleware, async (req, res) => {
  try {
    console.log("[Rejected] Fetching all rejected payments");
    const payments = await Payment.find({ status: "rejected" }).populate("user");
    console.log("[Rejected] Rejected payments count:", payments.length);
    res.json({ payments });
  } catch (err) {
    console.error("[Get Rejected Payments Error]:", err);
    res.status(500).json({ error: "Failed to fetch rejected payments" });
  }
});

// ✅ Update Payment Status
router.patch("/status/:id", authMiddleware, async (req, res) => {
  try {
    console.log("[Status Update] Payment ID:", req.params.id, "Body:", req.body);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("[Status Update] Invalid payment ID");
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const { status } = req.body;
    if (!status || typeof status !== "string" || !/^[a-zA-Z\s_-]{3,20}$/.test(status)) {
      console.log("[Status Update] Invalid status:", status);
      return res.status(400).json({ error: "Valid status is required" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.log("[Status Update] Payment not found");
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = status;
    await payment.save();
    console.log("[Status Update] Payment updated:", payment);
    res.json({ message: "Payment status updated.", payment });
  } catch (error) {
    console.error("[Status Update Error]:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

// ✅ Delete Transaction
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    console.log("[Delete] Payment ID:", req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("[Delete] Invalid payment ID");
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.log("[Delete] Payment not found");
      return res.status(404).json({ error: "Payment not found" });
    }

    await payment.deleteOne();
    console.log("[Delete] Payment deleted:", req.params.id);
    res.json({ message: "Payment deleted successfully." });
  } catch (error) {
    console.error("[Delete Error]:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;
