import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    withdrawalId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
      default: 'pending',
      index: true,
    },
    bankSnapshot: {
      holderName: String,
      accountNumberMasked: String,
      ifscCode: String,
    },
    adminNote: { type: String, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
