import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    holderName: { type: String, required: true },
    accountNumber: { type: String, required: true, select: false },
    ifscCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
