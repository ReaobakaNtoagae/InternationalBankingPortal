const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    provider: { type: String },

    beneficiaryName: { type: String },
    accountNumber: { type: String }, // ✅ renamed from beneficiaryAccount
    bankName: { type: String },      // ✅ added to support frontend display
    swiftCode: { type: String },
    reference: { type: String },

    type: {
      type: String,
      enum: ["payment", "transfer"],
      default: "payment",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "submitted"], // ✅ added "submitted"
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
