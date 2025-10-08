const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");

// ============================
// Create a new payment
// ============================
router.post("/", async (req, res) => {
  const { accountNumber, amount, currency, provider } = req.body;

  if (!accountNumber || !amount || !currency || !provider) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
  
    const user = await User.findOne({ accountNumber });
    if (!user) {
      console.warn(`[Payment] User not found: ${accountNumber}`);
      return res.status(404).json({ error: "User not found." });
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


router.post("/transfer", async (req, res) => {
  const {
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

  if (
    !accountNumber ||
    !beneficiaryName ||
    !accountNumberBeneficiary ||
    !bankName ||
    !swiftCode ||
    !amount ||
    !currency ||
    !paymentId
  ) {
    return res
      .status(400)
      .json({ error: "All fields are required for transfer." });
  }

  try {
    // ✅ Identify sender from accountNumber
    const sender = await User.findOne({ accountNumber });
    if (!sender) {
      console.warn(`[Transfer] Sender not found: ${accountNumber}`);
      return res.status(404).json({ error: "Sender not found." });
    }

    const transfer = new Payment({
      user: sender._id,
      amount,
      currency,
      reference,
      type: "transfer",
      beneficiaryName,
      accountNumber: accountNumberBeneficiary,
      bankName,
      swiftCode,
      linkedPayment: paymentId,
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


router.get("/:accountNumber", async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

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
