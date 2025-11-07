const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // 🔹 The user who made the payment or transfer
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🔹 Core financial fields
    amount: { type: Number, required: true },
    currency: { type: String, required: true },

    // 🔹 For payment initialization (step 1)
    provider: { type: String },
    accountNumber: { type: String, required: true },

   
    beneficiaryName: { type: String },
    bankName: { type: String },
    swiftCode: { type: String },
    reference: { type: String },

   
    linkedPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

   
    type: {
      type: String,
      enum: ["payment", "transfer"],
      default: "payment",
      required: true,
    },

  
    status: {
      type: String,
      enum: ["initialized", "submitted", "approved", "rejected", "pending"],
      default: "initialized",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
