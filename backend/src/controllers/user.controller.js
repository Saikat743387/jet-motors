import mongoose from 'mongoose';
import { Purchase } from '../models/Purchase.js';
import { Transaction } from '../models/Transaction.js';
import { DailyClaim } from '../models/DailyClaim.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { getSettings } from '../models/AppSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { transactionRef } from '../utils/ids.js';
import { claimDailyIncome, describePurchaseClaim, purchaseWithDepositBalance } from '../services/ledger.service.js';

export const myProducts = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  const ids = purchases.map((p) => p._id);
  const latestClaims = ids.length
    ? await DailyClaim.aggregate([
        { $match: { purchaseId: { $in: ids } } },
        { $sort: { claimDate: -1 } },
        { $group: { _id: '$purchaseId', lastClaimDate: { $first: '$claimDate' } } },
      ])
    : [];
  const lastByPurchase = new Map(latestClaims.map((c) => [String(c._id), c.lastClaimDate]));
  const now = new Date();
  const rows = await Promise.all(
    purchases.map(async (p) => {
      const claim = await describePurchaseClaim({ user: req.user, purchase: p, now });
      if (!claim.lastClaimDate) claim.lastClaimDate = lastByPurchase.get(String(p._id)) || null;
      return { ...p, claim };
    })
  );
  res.json({ purchases: rows });
});

export const createDirectPurchase = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product' });
  }
  const result = await purchaseWithDepositBalance({ user: req.user, productId, ip: req.ip });
  res.status(201).json(result);
});

export const claimPurchaseIncome = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid purchase' });
  }
  const result = await claimDailyIncome({ user: req.user, purchaseId: id, ip: req.ip });
  res.json(result);
});

export const myTransactions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { userId: req.user._id };
  if (type) filter.type = type;
  const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ transactions });
});

export const createTicket = asyncHandler(async (req, res) => {
  const subject = (req.body.subject || '').trim();
  const message = (req.body.message || '').trim();
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }
  const ticket = await SupportTicket.create({
    ticketId: transactionRef('TCK'),
    userId: req.user._id,
    subject,
    messages: [{ senderRole: 'user', senderId: req.user._id, message }],
  });
  res.status(201).json({ ticket });
});

export const myTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ tickets });
});

export const publicSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({
    appName: settings.appName,
    aboutText: settings.aboutText,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
    minWithdrawal: settings.minWithdrawal,
    inviteRequired: settings.inviteRequired,
  });
});
