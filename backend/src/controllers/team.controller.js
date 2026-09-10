import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { Commission } from '../models/Commission.js';
import { Deposit } from '../models/Deposit.js';
import { COMMISSION_RATES, getSettings } from '../models/AppSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { maskMobile } from '../utils/ids.js';
import { env } from '../config/env.js';

export const teamOverview = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const rates = settings.commissionRates || COMMISSION_RATES;
  const userId = req.user._id;

  const [levelCounts, commissions] = await Promise.all([
    Referral.aggregate([
      { $match: { userId } },
      { $group: { _id: '$level', size: { $sum: 1 } } },
    ]),
    Commission.aggregate([
      { $match: { userId } },
      { $group: { _id: '$level', amount: { $sum: '$amount' } } },
    ]),
  ]);

  const members = await Referral.find({ userId }).select('memberId');
  const memberIds = members.map((m) => m.memberId);
  const rechargeAgg = memberIds.length
    ? await Deposit.aggregate([
        { $match: { userId: { $in: memberIds }, status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
    : [];

  const sizeMap = Object.fromEntries(levelCounts.map((r) => [r._id, r.size]));
  const commMap = Object.fromEntries(commissions.map((r) => [r._id, r.amount]));
  const levels = [1, 2, 3].map((level) => ({
    level,
    commissionRate: Math.round((rates[level] || 0) * 100),
    teamSize: sizeMap[level] || 0,
    commission: commMap[level] || 0,
  }));

  const inviteLink = `${env.clientOrigin}/signup?invite=${req.user.inviteCode}`;

  res.json({
    totalTeamSize: levels.reduce((s, l) => s + l.teamSize, 0),
    totalCommission: req.user.totalCommission,
    totalRecharge: rechargeAgg[0]?.total || 0,
    inviteCode: req.user.inviteCode,
    inviteLink,
    levels,
  });
});

export const teamMembers = asyncHandler(async (req, res) => {
  const level = Number(req.params.level);
  if (![1, 2, 3].includes(level)) return res.status(400).json({ message: 'Invalid level' });

  const rows = await Referral.find({ userId: req.user._id, level })
    .populate('memberId', 'userId mobile createdAt totalDeposit')
    .sort({ createdAt: -1 });

  res.json({
    members: rows.map((r) => ({
      userId: r.memberId?.userId,
      mobile: maskMobile(r.memberId?.mobile),
      joinedAt: r.createdAt,
      totalDeposit: r.memberId?.totalDeposit || 0,
    })),
  });
});
