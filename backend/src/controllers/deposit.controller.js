import { body } from 'express-validator';
import { Deposit } from '../models/Deposit.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { confirmDepositServerSide, createDepositIntent, failOrCancelDeposit } from '../services/ledger.service.js';

export const createDepositValidators = [
  body('amount').optional().isFloat({ gte: 100 }).withMessage('Minimum deposit is ₹100'),
];

export const createDeposit = asyncHandler(async (req, res) => {
  const intent = await createDepositIntent({
    user: req.user,
    productId: req.body.productId,
    claimedAmount: req.body.amount,
  });
  res.status(201).json(intent);
});

export const listDeposits = asyncHandler(async (req, res) => {
  const deposits = await Deposit.find({ userId: req.user._id })
    .populate('productId', 'name price')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ deposits });
});

export const simulatePay = asyncHandler(async (req, res) => {
  const deposit = await confirmDepositServerSide({
    user: req.user,
    depositId: req.params.id,
    paymentReference: req.body.paymentReference || `SIM-${Date.now()}`,
    actorRole: 'system',
    actorId: req.user._id,
    ip: req.ip,
  });
  const user = await req.user.constructor.findById(req.user._id);
  res.json({ deposit, balance: user.balance });
});

export const cancelDeposit = asyncHandler(async (req, res) => {
  const deposit = await failOrCancelDeposit({
    user: req.user,
    depositId: req.params.id,
    status: req.body.status === 'failed' ? 'failed' : 'cancelled',
    ip: req.ip,
  });
  res.json({ deposit });
});

export const depositOptions = asyncHandler(async (_req, res) => {
  const products = await Product.find({ isActive: true }).sort({ price: 1 });
  const amounts = [...new Set(products.map((p) => p.price))];
  res.json({ amounts, products });
});
