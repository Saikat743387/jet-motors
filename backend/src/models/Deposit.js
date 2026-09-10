import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentReference: { type: String, default: '' },
    paymentToken: { type: String, default: '', select: false },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });

export const Deposit = mongoose.model('Deposit', depositSchema);
