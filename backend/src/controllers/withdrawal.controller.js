import { body } from 'express-validator';
import { BankAccount } from '../models/BankAccount.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { maskAccount } from '../utils/ids.js';
import { requestWithdrawal } from '../services/ledger.service.js';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const bankValidators = [
  body('holderName').trim().notEmpty().withMessage('Bank holder name is required'),
  body('accountNumber').trim().isLength({ min: 8, max: 18 }).withMessage('Enter a valid account number'),
  body('ifscCode').trim().notEmpty().withMessage('IFSC code is required'),
];

export const saveBank = asyncHandler(async (req, res) => {
  const holderName = req.body.holderName.trim();
  const accountNumber = String(req.body.accountNumber).replace(/\s+/g, '');
  const ifscCode = String(req.body.ifscCode).trim().toUpperCase();
  if (!IFSC_RE.test(ifscCode)) throw new ApiError(400, 'Enter a valid IFSC code');
  if (!/^\d{8,18}$/.test(accountNumber)) throw new ApiError(400, 'Account number must be 8–18 digits');

  const bank = await BankAccount.findOneAndUpdate(
    { userId: req.user._id },
    { holderName, accountNumber, ifscCode },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('+accountNumber');

  res.json({
    bank: {
      holderName: bank.holderName,
      accountNumberMasked: maskAccount(bank.accountNumber),
      ifscCode: bank.ifscCode,
      isVerified: bank.isVerified,
    },
  });
});

export const getBank = asyncHandler(async (req, res) => {
  const bank = await BankAccount.findOne({ userId: req.user._id }).select('+accountNumber');
  if (!bank) return res.json({ bank: null });
  res.json({
    bank: {
      holderName: bank.holderName,
      accountNumberMasked: maskAccount(bank.accountNumber),
      ifscCode: bank.ifscCode,
      isVerified: bank.isVerified,
    },
  });
});

export const createWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await requestWithdrawal({
    user: req.user,
    amount: req.body.amount,
    ip: req.ip,
  });
  const user = await req.user.constructor.findById(req.user._id);
  res.status(201).json({ withdrawal, balance: user.balance });
});

export const listWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ withdrawals });
});
