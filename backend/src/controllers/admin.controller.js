import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Transaction } from '../models/Transaction.js';
import { Referral } from '../models/Referral.js';
import { Commission } from '../models/Commission.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { AppSettings, getSettings } from '../models/AppSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { maskMobile } from '../utils/ids.js';
import { adminUpdateWithdrawal, confirmDepositServerSide } from '../services/ledger.service.js';
import { logActivity } from '../utils/logger.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalDepositsAgg,
    totalWithdrawalsAgg,
    activeProducts,
    pendingWithdrawals,
    pendingDeposits,
    totalCommissionsAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Deposit.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Purchase.countDocuments({ status: 'active' }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Deposit.countDocuments({ status: 'pending' }),
    Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    totalUsers,
    totalDeposits: totalDepositsAgg[0]?.total || 0,
    totalWithdrawals: totalWithdrawalsAgg[0]?.total || 0,
    activeProducts,
    pendingWithdrawals,
    pendingDeposits,
    totalCommissions: totalCommissionsAgg[0]?.total || 0,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = { role: 'user' };
  if (q) {
    filter.$or = [
      { mobile: { $regex: q, $options: 'i' } },
      { userId: { $regex: q, $options: 'i' } },
      { inviteCode: { $regex: q, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({
    users: users.map((u) => ({
      id: u._id,
      userId: u.userId,
      mobile: u.mobile,
      inviteCode: u.inviteCode,
      balance: u.balance,
      totalDeposit: u.totalDeposit,
      totalWithdrawal: u.totalWithdrawal,
      totalCommission: u.totalCommission,
      status: u.status,
      createdAt: u.createdAt,
    })),
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const [deposits, withdrawals, purchases, referrals] = await Promise.all([
    Deposit.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
    Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
    Purchase.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
    Referral.find({ userId: user._id }),
  ]);
  res.json({
    user: {
      id: user._id,
      userId: user.userId,
      mobile: user.mobile,
      inviteCode: user.inviteCode,
      balance: user.balance,
      totalDeposit: user.totalDeposit,
      totalWithdrawal: user.totalWithdrawal,
      totalCommission: user.totalCommission,
      status: user.status,
      createdAt: user.createdAt,
    },
    deposits,
    withdrawals,
    purchases,
    teamSize: referrals.length,
  });
});

export const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot block an admin');
  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  await user.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: user.status === 'blocked' ? 'user.block' : 'user.unblock',
    targetType: 'user',
    targetId: user.userId,
    ip: req.ip,
  });
  res.json({ user: { id: user._id, status: user.status } });
});

export const listAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ products });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    name: req.body.name,
    image: req.body.image || '',
    durationDays: Number(req.body.durationDays),
    dailyIncome: Number(req.body.dailyIncome),
    totalIncome: Number(req.body.totalIncome),
    price: Number(req.body.price),
    isActive: req.body.isActive !== false && req.body.isActive !== 'false',
    sortOrder: Number(req.body.sortOrder || 0),
  });
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'product.create',
    targetType: 'product',
    targetId: product._id.toString(),
    ip: req.ip,
  });
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const fields = ['name', 'image', 'durationDays', 'dailyIncome', 'totalIncome', 'price', 'isActive', 'sortOrder'];
  for (const field of fields) {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  }
  await product.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'product.update',
    targetType: 'product',
    targetId: product._id.toString(),
    ip: req.ip,
  });
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isActive = false;
  await product.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'product.deactivate',
    targetType: 'product',
    targetId: product._id.toString(),
    ip: req.ip,
  });
  res.json({ product });
});

export const listPurchases = asyncHandler(async (_req, res) => {
  const purchases = await Purchase.find()
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ purchases });
});

export const listDepositsAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const deposits = await Deposit.find(filter)
    .populate('userId', 'userId mobile')
    .populate('productId', 'name price')
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ deposits });
});

export const confirmDepositAdmin = asyncHandler(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  const user = await User.findById(deposit.userId);
  const updated = await confirmDepositServerSide({
    user,
    depositId: deposit._id,
    paymentReference: req.body.paymentReference || deposit.transactionId,
    actorRole: 'admin',
    actorId: req.user._id,
    ip: req.ip,
  });
  res.json({ deposit: updated });
});

export const listWithdrawalsAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const withdrawals = await Withdrawal.find(filter)
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ withdrawals });
});

export const updateWithdrawalAdmin = asyncHandler(async (req, res) => {
  const withdrawal = await adminUpdateWithdrawal({
    admin: req.user,
    withdrawalId: req.params.id,
    status: req.body.status,
    adminNote: req.body.adminNote,
    ip: req.ip,
  });
  res.json({ withdrawal });
});

export const listTransactionsAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  const transactions = await Transaction.find(filter)
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(400);
  res.json({ transactions });
});

export const listTeamsAdmin = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: 'user' }).sort({ totalCommission: -1 }).limit(200);
  const rows = await Promise.all(
    users.map(async (u) => {
      const size = await Referral.countDocuments({ userId: u._id });
      return {
        userId: u.userId,
        mobile: maskMobile(u.mobile),
        inviteCode: u.inviteCode,
        teamSize: size,
        totalCommission: u.totalCommission,
      };
    })
  );
  res.json({ teams: rows });
});

export const listCommissionsAdmin = asyncHandler(async (_req, res) => {
  const commissions = await Commission.find()
    .populate('userId', 'userId mobile')
    .populate('fromUserId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(400);
  res.json({ commissions });
});

export const listTicketsAdmin = asyncHandler(async (_req, res) => {
  const tickets = await SupportTicket.find()
    .populate('userId', 'userId mobile')
    .sort({ updatedAt: -1 })
    .limit(200);
  res.json({ tickets });
});

export const replyTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  const message = (req.body.message || '').trim();
  if (!message) throw new ApiError(400, 'Message is required');
  ticket.messages.push({ senderRole: 'admin', senderId: req.user._id, message });
  ticket.status = req.body.close ? 'closed' : 'replied';
  await ticket.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'ticket.reply',
    targetType: 'ticket',
    targetId: ticket.ticketId,
    ip: req.ip,
  });
  res.json({ ticket });
});

export const getSettingsAdmin = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ settings });
});

export const saveSettingsAdmin = asyncHandler(async (req, res) => {
  const allowed = [
    'appName',
    'minWithdrawal',
    'supportPhone',
    'supportEmail',
    'aboutText',
    'commissionRates',
    'inviteRequired',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      await AppSettings.findOneAndUpdate({ key }, { value: req.body[key] }, { upsert: true });
    }
  }
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'settings.update',
    targetType: 'settings',
    ip: req.ip,
  });
  res.json({ settings: await getSettings() });
});

export const listLogs = asyncHandler(async (_req, res) => {
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(300).populate('actorId', 'userId role');
  res.json({ logs });
});
