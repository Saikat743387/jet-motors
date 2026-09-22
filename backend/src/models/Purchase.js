import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit', default: null },
    price: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyIncome: { type: Number, required: true },
    totalIncome: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active', index: true },
    claimedDays: { type: Number, default: 0, min: 0 },
    claimedTotal: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

purchaseSchema.index({ userId: 1, createdAt: -1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
