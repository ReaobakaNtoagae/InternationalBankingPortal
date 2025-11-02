const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");

const swiftMap = {
  ABSAZAJJXXX: "Absa Bank Limited",
  AFRCZAJJXXX: "African Bank Limited",
  BIDBZAJJXXX: "Bidvest Bank Limited",
  CABLZAJJXXX: "Capitec Bank Limited",
  DISCZAJJXXX: "Discovery Bank Limited",
  FIRNZAJJXXX: "First National Bank",
  FINBZAJJXXX: "Finbond Bank Limited",
  GRIDZAJJXXX: "Grindrod Bank Limited",
  IVESZAJJXXX: "Investec Bank Limited",
  LISAZAJJXXX: "Mercantile Bank Limited",
  NEDSZAJJXXX: "Nedbank Limited",
  SBZAZAJJXXX: "Standard Bank of South Africa",
};

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again later." },
});

// ✅ Get pending transfers only
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const pendingTransfers = await Payment.find({ status: "pending", type: "transfer" }).lean();
    const enriched = pendingTransfers.map(p => ({
      ...p,
      bankName: p.bankName || swiftMap[p.swiftCode?.trim().toUpperCase()] || "—"
    }));
    return res.status(200).json({ payments: enriched });
  } catch (err) {
    console.error("❌ /pending route error:", err);
    return res.status(500).json({ error: "Server error fetching pending transfers." });
  }
});

// ✅ Update payment status
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "submitted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Payment not found." });
    }

    return res.json({ message: "Status updated.", payment: updated });
  } catch (err) {
    console.error("[Status Update] Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ Get submitted transactions
router.get("/submitted", authMiddleware, async (req, res) => {
  try {
    const submitted = await Payment.find({ status: "submitted" }).lean();
    const enriched = submitted.map(p => ({
      ...p,
      bankName: p.bankName || swiftMap[p.swiftCode?.trim().toUpperCase()] || "—"
    }));
    return res.status(200).json({ transactions: enriched });
  } catch (err) {
    console.error("❌ /submitted route error:", err);
    return res.status(500).json({ error: "Server error fetching submitted transactions." });
  }
});

// ✅ Reject payment explicitly
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Payment not found." });
    }

    return res.json({ message: "Payment rejected.", payment: updated });
  } catch (err) {
    console.error("[Reject] Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
