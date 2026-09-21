import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    mobile: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    inviteCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    balance: { type: Number, default: 0, min: 0 },
    signupBonus: { type: Number, default: 0, min: 0 },
    totalDeposit: { type: Number, default: 0 },
    totalWithdrawal: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'blocked'], default: 'active', index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

export const User = mongoose.model('User', userSchema);
