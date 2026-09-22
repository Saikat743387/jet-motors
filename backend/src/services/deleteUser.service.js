import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Purchase } from '../models/Purchase.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { BankAccount } from '../models/BankAccount.js';
import { Transaction } from '../models/Transaction.js';
import { DailyClaim } from '../models/DailyClaim.js';
import { Referral } from '../models/Referral.js';
import { Commission } from '../models/Commission.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ApiError } from '../utils/apiError.js';
import { logActivity } from '../utils/logger.js';

/**
 * Permanently deletes a user and every MongoDB record owned by / referencing
 * that user, inside a single transaction (the app runs on a replica set /
 * Atlas, so multi-document transactions are supported).
 *
 * Collections touched (all are user-owned or user-specific records):
 *   User, Purchase, Deposit, Withdrawal, Transaction, DailyClaim,
 *   Commission (both the user's own and commissions granted FROM the user),
 *   Referral (both the user's own team rows AND rows where they are a member),
 *   SupportTicket, BankAccount, ActivityLog (their action logs and any logs
 *   that reference them as the target user).
 *
 * Cross-user references are cleaned up so no orphan records survive:
 *   - other users' `referredBy` that pointed at the deleted user are reset to null
 *     (the other users' documents are NOT deleted),
 *   - other users' commission Transactions that referenced one of the deleted
 *     user's deposits are removed (they are "from <deleted user>" records).
 *
 * Admin accounts can never be deleted.
 */
export async function deleteUserPermanently({ admin, userId, ip }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, 'Invalid user id');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'admin') {
      throw new ApiError(400, 'Cannot permanently delete an admin account');
    }

    const id = user._id;

    const [depositRows, purchaseRows, withdrawalRows] = await Promise.all([
      Deposit.find({ userId: id }).select('_id').session(session),
      Purchase.find({ userId: id }).select('_id').session(session),
      Withdrawal.find({ userId: id }).select('_id').session(session),
    ]);
    const referenceIds = [...depositRows, ...purchaseRows, ...withdrawalRows].map((d) => d._id);

    const [
      purchases,
      deposits,
      withdrawals,
      transactions,
      dailyClaims,
      commissions,
      referrals,
      tickets,
      bankAccounts,
      activityLogs,
      referredByCleared,
      userDeleted,
    ] = await Promise.all([
      Purchase.deleteMany({ userId: id }, { session }),
      Deposit.deleteMany({ userId: id }, { session }),
      Withdrawal.deleteMany({ userId: id }, { session }),
      Transaction.deleteMany({ userId: id }, { session }),
      DailyClaim.deleteMany({ userId: id }, { session }),
      Commission.deleteMany({ $or: [{ userId: id }, { fromUserId: id }] }, { session }),
      Referral.deleteMany({ $or: [{ userId: id }, { memberId: id }] }, { session }),
      SupportTicket.deleteMany({ userId: id }, { session }),
      BankAccount.deleteMany({ userId: id }, { session }),
      ActivityLog.deleteMany(
        { $or: [{ actorId: id }, { targetType: 'user', targetId: user.userId }] },
        { session }
      ),
      User.updateMany({ referredBy: id }, { $set: { referredBy: null } }, { session }),
      User.deleteOne({ _id: id, role: { $ne: 'admin' } }, { session }),
    ]);

    if (referenceIds.length > 0) {
      await Transaction.deleteMany({ referenceId: { $in: referenceIds } }, { session });
    }

    const cleanup = {
      purchases: purchases.deletedCount || 0,
      deposits: deposits.deletedCount || 0,
      withdrawals: withdrawals.deletedCount || 0,
      transactions: transactions.deletedCount || 0,
      dailyClaims: dailyClaims.deletedCount || 0,
      commissions: commissions.deletedCount || 0,
      referrals: referrals.deletedCount || 0,
      supportTickets: tickets.deletedCount || 0,
      bankAccounts: bankAccounts.deletedCount || 0,
      activityLogs: activityLogs.deletedCount || 0,
      referredByCleared: referredByCleared.modifiedCount || 0,
    };

    await session.commitTransaction();

    await logActivity({
      actorId: admin._id,
      actorRole: 'admin',
      action: 'user.delete.permanent',
      targetType: 'user',
      targetId: user.userId,
      details: { ip, cleanup },
      ip,
    });

    return {
      userId: user.userId,
      userDeleted: userDeleted.deletedCount === 1,
      cleanup,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}