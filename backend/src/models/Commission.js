import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit', required: true, index: true },
    level: { type: Number, enum: [1, 2, 3], required: true },
    rate: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['credited'], default: 'credited' },
  },
  { timestamps: true }
);

commissionSchema.index({ userId: 1, createdAt: -1 });
commissionSchema.index({ depositId: 1, userId: 1 }, { unique: true });

export const Commission = mongoose.model('Commission', commissionSchema);
