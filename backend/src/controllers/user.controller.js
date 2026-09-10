import { Purchase } from '../models/Purchase.js';
import { Transaction } from '../models/Transaction.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { getSettings } from '../models/AppSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { transactionRef } from '../utils/ids.js';

export const myProducts = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ purchases });
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
