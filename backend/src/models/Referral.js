import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: Number, enum: [1, 2, 3], required: true, index: true },
  },
  { timestamps: true }
);

referralSchema.index({ userId: 1, level: 1 });
referralSchema.index({ userId: 1, memberId: 1 }, { unique: true });

export const Referral = mongoose.model('Referral', referralSchema);
