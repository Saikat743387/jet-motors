import mongoose from 'mongoose';

const referralRewardSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, default: 5 },
    status: { type: String, enum: ['success', 'failed'], default: 'success', index: true },
  },
  { timestamps: true }
);

referralRewardSchema.index({ referrerId: 1, referredId: 1 }, { unique: true });

export const ReferralReward = mongoose.model('ReferralReward', referralRewardSchema);
