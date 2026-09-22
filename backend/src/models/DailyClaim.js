import mongoose from 'mongoose';

// One row per purchased plan per calendar day (server UTC date).
// The unique { purchaseId, claimDate } index is the atomic guard against
// double-claiming the same day's income, even under concurrent requests.
const dailyClaimSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    claimDate: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['success'], default: 'success', index: true },
  },
  { timestamps: true }
);

dailyClaimSchema.index({ purchaseId: 1, claimDate: 1 }, { unique: true });
dailyClaimSchema.index({ userId: 1, createdAt: -1 });

export const DailyClaim = mongoose.model('DailyClaim', dailyClaimSchema);
