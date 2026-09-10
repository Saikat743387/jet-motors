import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});
