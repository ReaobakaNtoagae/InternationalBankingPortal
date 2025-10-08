const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    provider: { type: String },

    
    beneficiaryName: { type: String },
    beneficiaryAccount: { type: String },
    swiftCode: { type: String },
    reference: { type: String },

   
    type: { type: String, enum: ['payment', 'transfer'], default: 'payment' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
