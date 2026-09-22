import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { BankAccount } from '../models/BankAccount.js';
import { Transaction } from '../models/Transaction.js';
import { Referral } from '../models/Referral.js';
import { Commission } from '../models/Commission.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { AppSettings, getSettings } from '../models/AppSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { adminUpdateDeposit, adminUpdateWithdrawal, confirmDepositServerSide } from '../services/ledger.service.js';
import { deleteUserPermanently } from '../services/deleteUser.service.js';
import { logActivity } from '../utils/logger.js';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function describeTransaction(t) {
  const meta = t.meta || {};
  if (t.type === 'purchase') return meta.productName ? `Purchase of ${meta.productName}` : 'Product purchase';
  if (t.type === 'commission') {
    return `Level ${meta.level ?? ''} referral commission from ${meta.fromUserId ?? '—'}`.trim();
  }
  if (t.type === 'deposit') return 'Wallet deposit';
  if (t.type === 'withdrawal') return 'Withdrawal request';
  if (t.type === 'refund') return 'Refund';
  return String(t.type || '');
}

export const dashboard = asyncHandler(async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalActiveUsers,
    totalDepositsAgg,
    totalWithdrawalsAgg,
    activeProducts,
    pendingWithdrawals,
    pendingDeposits,
    totalCommissionsAgg,
    totalPurchasesAgg,
    totalBalanceAgg,
    todayNewUsers,
    todayPurchases,
    todayWithdrawals,
    recentActivity,
    completedWithdrawals,
    rejectedWithdrawals,
    totalWithdrawalsCount,
    approvedWithdrawals,
    processingWithdrawals,
    totalDepositsCount,
    successfulDeposits,
    failedDeposits,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'active' }),
    Deposit.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Withdrawal.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Purchase.countDocuments({ status: 'active' }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Deposit.countDocuments({ status: 'pending' }),
    Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Purchase.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$price' } } }]),
    User.aggregate([{ $match: { role: 'user' } }, { $group: { _id: null, total: { $sum: '$balance' } } }]),
    User.countDocuments({ role: 'user', createdAt: { $gte: startOfDay } }),
    Purchase.countDocuments({ createdAt: { $gte: startOfDay } }),
    Withdrawal.countDocuments({ createdAt: { $gte: startOfDay } }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(12).populate('actorId', 'userId role'),
    Withdrawal.countDocuments({ status: 'completed' }),
    Withdrawal.countDocuments({ status: 'rejected' }),
    Withdrawal.countDocuments({}),
    Withdrawal.countDocuments({ status: 'approved' }),
    Withdrawal.countDocuments({ status: 'processing' }),
    Deposit.countDocuments({}),
    Deposit.countDocuments({ status: 'success' }),
    Deposit.countDocuments({ status: 'failed' }),
  ]);

  res.json({
    totalUsers,
    totalActiveUsers,
    totalDeposits: totalDepositsAgg[0]?.total || 0,
    totalWithdrawals: totalWithdrawalsAgg[0]?.total || 0,
    activeProducts,
    pendingWithdrawals,
    completedWithdrawals,
    rejectedWithdrawals,
    totalWithdrawalsCount,
    approvedWithdrawals,
    processingWithdrawals,
    pendingDeposits,
    totalDepositsCount,
    successfulDeposits,
    failedDeposits,
    totalCommissions: totalCommissionsAgg[0]?.total || 0,
    totalProductPurchases: totalPurchasesAgg[0]?.count || 0,
    totalPurchaseAmount: totalPurchasesAgg[0]?.total || 0,
    totalUserBalance: totalBalanceAgg[0]?.total || 0,
    todayNewUsers,
    todayPurchases,
    todayWithdrawals,
    recentActivity,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 30);
  const status = (req.query.status || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const match = { role: 'user' };
  if (q) {
    const safe = escapeRegex(q);
    match.$or = [
      { mobile: { $regex: safe, $options: 'i' } },
      { userId: { $regex: safe, $options: 'i' } },
      { inviteCode: { $regex: safe, $options: 'i' } },
    ];
  }
  if (status && ['active', 'blocked'].includes(status)) {
    match.status = status;
  }

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'userId',
          as: '__purchases',
        },
      },
      {
        $lookup: {
          from: 'withdrawals',
          localField: '_id',
          foreignField: 'userId',
          as: '__withdrawals',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referredBy',
          foreignField: '_id',
          as: '__referrer',
        },
      },
      {
        $project: {
          userId: 1,
          mobile: 1,
          inviteCode: 1,
          balance: 1,
          totalDeposit: 1,
          totalWithdrawal: 1,
          totalCommission: 1,
          status: 1,
          role: 1,
          createdAt: 1,
          referredBy: { $ifNull: [{ $arrayElemAt: ['$__referrer.userId', 0] }, null] },
          totalPurchases: { $size: '$__purchases' },
          totalPurchaseAmount: { $sum: '$__purchases.price' },
          withdrawalCount: { $size: '$__withdrawals' },
        },
      },
    ]),
    User.countDocuments(match),
  ]);

  res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('referredBy', 'userId mobile');
  if (!user) throw new ApiError(404, 'User not found');

  const [deposits, withdrawals, purchases, referrals, transactions, bankAccount] = await Promise.all([
    Deposit.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
    Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
    Purchase.find({ userId: user._id }).sort({ createdAt: -1 }).limit(200),
    Referral.find({ userId: user._id }),
    Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100),
    BankAccount.findOne({ userId: user._id }).select('+accountNumber'),
  ]);

  const pendingWithdrawalAmount = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const completedWithdrawalAmount = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

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
      referredBy: user.referredBy
        ? { userId: user.referredBy.userId, mobile: user.referredBy.mobile }
        : null,
      teamSize: referrals.length,
      totalPurchases: purchases.length,
      totalPurchaseAmount: purchases.reduce((sum, p) => sum + (p.price || 0), 0),
      totalEarnings: user.totalCommission,
      pendingWithdrawalAmount,
      completedWithdrawalAmount,
    },
    deposits,
    withdrawals,
    purchases,
    transactions,
    bankAccount: bankAccount
      ? {
          holderName: bankAccount.holderName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode,
          isVerified: bankAccount.isVerified,
        }
      : null,
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
  const products = await Product.aggregate([
    { $sort: { sortOrder: 1, createdAt: 1 } },
    {
      $lookup: {
        from: 'purchases',
        localField: '_id',
        foreignField: 'productId',
        as: '__purchases',
      },
    },
    {
      $project: {
        name: 1,
        image: 1,
        durationDays: 1,
        dailyIncome: 1,
        totalIncome: 1,
        price: 1,
        isActive: 1,
        sortOrder: 1,
        createdAt: 1,
        purchaseCount: { $size: '$__purchases' },
        purchaseRevenue: { $sum: '$__purchases.price' },
      },
    },
  ]);
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

export const listPurchases = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.product) filter.productName = { $regex: req.query.product, $options: 'i' };

  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      const end = new Date(req.query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (req.query.user) {
    const users = await User.find({
      $or: [
        { userId: { $regex: req.query.user, $options: 'i' } },
        { mobile: { $regex: req.query.user, $options: 'i' } },
      ],
    }).select('_id');
    filter.userId = { $in: users.map((u) => u._id) };
  }

  const purchases = await Purchase.find(filter)
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(400);
  res.json({ purchases });
});

export const listDepositsAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.user) {
    const users = await User.find({
      $or: [
        { userId: { $regex: req.query.user, $options: 'i' } },
        { mobile: { $regex: req.query.user, $options: 'i' } },
      ],
    }).select('_id');
    filter.userId = { $in: users.map((u) => u._id) };
  }
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
  if (!user) throw new ApiError(404, 'User not found');
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

export const updateDepositAdmin = asyncHandler(async (req, res) => {
  const { status, adminNote, paymentReference } = req.body;
  const deposit = await adminUpdateDeposit({
    admin: req.user,
    depositId: req.params.id,
    status,
    adminNote,
    paymentReference,
    ip: req.ip,
  });
  res.json({ deposit });
});

export const updateUserAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot edit an admin');
  const { mobile, status } = req.body;
  if (mobile !== undefined) {
    const m = String(mobile).trim();
    if (!/^[6-9]\d{9}$/.test(m)) throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number');
    const exists = await User.findOne({ mobile: m, _id: { $ne: user._id } });
    if (exists) throw new ApiError(409, 'Mobile number is already registered');
    user.mobile = m;
  }
  if (status !== undefined) {
    if (!['active', 'blocked'].includes(status)) throw new ApiError(400, 'Invalid status');
    user.status = status;
  }
  await user.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'user.update',
    targetType: 'user',
    targetId: user.userId,
    details: { mobile: user.mobile, status: user.status },
    ip: req.ip,
  });
  res.json({ user: { id: user._id, userId: user.userId, mobile: user.mobile, status: user.status } });
});

export const adjustBalanceAdmin = asyncHandler(async (req, res) => {
  const type = req.body.type;
  const rawAmount = Number(req.body.amount);
  const note = (req.body.note || '').trim().slice(0, 200);
  if (!['credit', 'debit'].includes(type)) throw new ApiError(400, 'type must be credit or debit');
  if (!Number.isFinite(rawAmount) || rawAmount <= 0 || rawAmount > 1000000) throw new ApiError(400, 'Enter a valid amount (1 - 1000000)');
  const amount = Math.round(rawAmount * 100) / 100;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot adjust admin balance');

  const session = (await import('mongoose')).default.startSession();
  session.startTransaction();
  try {
    let updated;
    if (type === 'credit') {
      updated = await User.findOneAndUpdate({ _id: user._id }, { $inc: { balance: amount } }, { new: true, session });
    } else {
      updated = await User.findOneAndUpdate({ _id: user._id, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { new: true, session });
      if (!updated) throw new ApiError(400, 'Insufficient balance');
    }
    const { transactionRef } = await import('../utils/ids.js');
    const { Transaction } = await import('../models/Transaction.js');
    await Transaction.create(
      [
        {
          transactionId: transactionRef(type === 'credit' ? 'ADJ' : 'DEB'),
          userId: user._id,
          type: type === 'credit' ? 'deposit' : 'refund',
          amount,
          status: 'success',
          referenceId: null,
          meta: { adminId: req.user._id.toString(), note, adjType: type },
        },
      ],
      { session }
    );
    await session.commitTransaction();
    await logActivity({
      actorId: req.user._id,
      actorRole: 'admin',
      action: type === 'credit' ? 'user.balance.credit' : 'user.balance.debit',
      targetType: 'user',
      targetId: user.userId,
      details: { amount, note, balance: updated.balance },
      ip: req.ip,
    });
    res.json({ user: { id: updated._id, balance: updated.balance }, amount, type });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  const result = await deleteUserPermanently({ admin: req.user, userId: req.params.id, ip: req.ip });
  res.json({
    message: `User ${result.userId} and all associated data permanently deleted`,
    result,
  });
});

export const resetPasswordAdmin = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot reset admin password');
  const argon2 = (await import('argon2')).default;
  user.passwordHash = await argon2.hash(String(newPassword), { type: argon2.argon2id });
  await user.save();
  await logActivity({
    actorId: req.user._id,
    actorRole: 'admin',
    action: 'user.password.reset',
    targetType: 'user',
    targetId: user.userId,
    ip: req.ip,
  });
  res.json({ message: 'Password reset successfully' });
});

export const listWithdrawalsAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.user) {
    const users = await User.find({
      $or: [
        { userId: { $regex: req.query.user, $options: 'i' } },
        { mobile: { $regex: req.query.user, $options: 'i' } },
      ],
    }).select('_id');
    filter.userId = { $in: users.map((u) => u._id) };
  }
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      const end = new Date(req.query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  const withdrawals = await Withdrawal.find(filter)
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ withdrawals });
});

export const getWithdrawalAdmin = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate('userId', 'userId mobile');
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');

  const bank = await BankAccount.findOne({ userId: withdrawal.userId }).select('+accountNumber');

  res.json({
    withdrawal: {
      _id: withdrawal._id,
      withdrawalId: withdrawal.withdrawalId,
      user: withdrawal.userId
        ? { userId: withdrawal.userId.userId, mobile: withdrawal.userId.mobile }
        : null,
      amount: withdrawal.amount,
      status: withdrawal.status,
      adminNote: withdrawal.adminNote,
      createdAt: withdrawal.createdAt,
      processedAt: withdrawal.processedAt,
      bankSnapshot: withdrawal.bankSnapshot,
      bankAccount: bank
        ? {
            holderName: bank.holderName,
            accountNumber: bank.accountNumber,
            ifscCode: bank.ifscCode,
            isVerified: bank.isVerified,
          }
        : null,
    },
  });
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
  if (req.query.status) filter.status = req.query.status;
  if (req.query.user) {
    const users = await User.find({
      $or: [
        { userId: { $regex: req.query.user, $options: 'i' } },
        { mobile: { $regex: req.query.user, $options: 'i' } },
      ],
    }).select('_id');
    filter.userId = { $in: users.map((u) => u._id) };
  }
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      const end = new Date(req.query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  const transactions = await Transaction.find(filter)
    .populate('userId', 'userId mobile')
    .sort({ createdAt: -1 })
    .limit(400);
  res.json({
    transactions: transactions.map((t) => ({
      _id: t._id,
      transactionId: t.transactionId,
      userId: t.userId?.userId || null,
      mobile: t.userId?.mobile || null,
      type: t.type,
      amount: t.amount,
      status: t.status,
      createdAt: t.createdAt,
      meta: t.meta,
      description: describeTransaction(t),
    })),
  });
});

export const listTeamsAdmin = asyncHandler(async (_req, res) => {
  const teams = await User.aggregate([
    { $match: { role: 'user' } },
    { $sort: { totalCommission: -1 } },
    { $limit: 200 },
    {
      $lookup: {
        from: 'referrals',
        localField: '_id',
        foreignField: 'userId',
        as: '__refs',
      },
    },
    {
      $project: {
        userId: 1,
        mobile: 1,
        inviteCode: 1,
        createdAt: 1,
        totalCommission: 1,
        teamSize: { $size: '$__refs' },
        level1: {
          $size: { $filter: { input: '$__refs', as: 'r', cond: { $eq: ['$$r.level', 1] } } },
        },
        level2: {
          $size: { $filter: { input: '$__refs', as: 'r', cond: { $eq: ['$$r.level', 2] } } },
        },
        level3: {
          $size: { $filter: { input: '$__refs', as: 'r', cond: { $eq: ['$$r.level', 3] } } },
        },
      },
    },
  ]);
  res.json({ teams });
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