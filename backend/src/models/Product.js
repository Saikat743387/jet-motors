import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, default: '' },
    durationDays: { type: Number, required: true, min: 1 },
    dailyIncome: { type: Number, required: true, min: 0 },
    totalIncome: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
