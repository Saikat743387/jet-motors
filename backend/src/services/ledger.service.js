import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Deposit } from '../models/Deposit.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { BankAccount } from '../models/BankAccount.js';
import { Transaction } from '../models/Transaction.js';
import { Referral } from '../models/Referral.js';
import { Commission } from '../models/Commission.js';
import { COMMISSION_RATES, getSettings } from '../models/AppSettings.js';
import { ApiError } from '../utils/apiError.js';
import { maskAccount, transactionRef } from '../utils/ids.js';
import { logActivity } from '../utils/logger.js';

async function credit(session, userId, amount, extra = {}) {
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: amount, ...extra } },
    { new: true, session }
  );
  if (!updated) throw new ApiError(404, 'User not found');
  return updated;
}

const SIGNUP_BONUS_AMOUNT = 50;

export async function creditSignupBonus(session, userId) {
  const existing = await Transaction.findOne({
    userId,
    type: 'signup_bonus',
    status: 'success',
  }).session(session);
  if (existing) return null;

  await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: SIGNUP_BONUS_AMOUNT } },
    { new: true, session }
  );

  const txn = await writeTxn(session, {
    transactionId: transactionRef('SBN'),
    userId,
    type: 'signup_bonus',
    amount: SIGNUP_BONUS_AMOUNT,
    status: 'success',
    meta: { description: 'Signup Bonus' },
  });

  return txn;
}

async function debitIfEnough(session, userId, amount, extra = {}) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount, ...extra } },
    { new: true, session }
  );
  if (!updated) throw new ApiError(400, 'Insufficient balance');
  return updated;
}

async function writeTxn(session, data) {
  const [row] = await Transaction.create([data], { session });
  return row;
}

async function creditCommissions(session, deposit, buyer) {
  const settings = await getSettings();
  const rates = settings.commissionRates || COMMISSION_RATES;
  const links = await Referral.find({ memberId: buyer._id }).session(session);

  for (const link of links) {
    const rate = Number(rates[link.level] ?? 0);
    if (rate <= 0) continue;
    const amount = Math.round(deposit.amount * rate * 100) / 100;
    if (amount <= 0) continue;

    await Commission.create(
      [
        {
          userId: link.userId,
          fromUserId: buyer._id,
          depositId: deposit._id,
          level: link.level,
          rate,
          baseAmount: deposit.amount,
          amount,
          status: 'credited',
        },
      ],
      { session }
    );

    await credit(session, link.userId, amount, { totalCommission: amount });
    await writeTxn(session, {
      transactionId: transactionRef('COM'),
      userId: link.userId,
      type: 'commission',
      amount,
      status: 'success',
      referenceId: deposit._id,
      meta: { level: link.level, fromUserId: buyer.userId, rate },
    });
  }
}

async function activatePurchase(session, user, product, deposit) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + product.durationDays * 24 * 60 * 60 * 1000);
  const [purchase] = await Purchase.create(
    [
      {
        userId: user._id,
        productId: product._id,
        depositId: deposit._id,
        price: product.price,
        startDate,
        endDate,
        dailyIncome: product.dailyIncome,
        totalIncome: product.totalIncome,
        durationDays: product.durationDays,
        productName: product.name,
        productImage: product.image,
        status: 'active',
      },
    ],
    { session }
  );

  await writeTxn(session, {
    transactionId: transactionRef('PUR'),
    userId: user._id,
    type: 'purchase',
    amount: product.price,
    status: 'success',
    referenceId: purchase._id,
    meta: { productName: product.name },
  });

  return purchase;
}

export async function createDepositIntent({ user, productId, claimedAmount }) {
  let product = null;
  let amount = Number(claimedAmount);

  if (productId) {
    product = await Product.findById(productId);
    if (!product || !product.isActive) throw new ApiError(404, 'Product not available');
    amount = product.price;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Enter a valid deposit amount');
  }

  const deposit = await Deposit.create({
    transactionId: transactionRef('DEP'),
    userId: user._id,
    productId: product?._id || null,
    amount,
    status: 'pending',
    paymentToken: transactionRef('PAY'),
  });

  return {
    depositId: deposit._id,
    transactionId: deposit.transactionId,
    amount: deposit.amount,
    product: product
      ? { id: product._id, name: product.name, price: product.price, image: product.image }
      : null,
    status: deposit.status,
  };
}

export async function confirmDepositServerSide({ user, depositId, paymentReference, actorRole = 'system', actorId, ip }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Deposit.findOneAndUpdate(
      { _id: depositId, userId: user._id, status: 'pending' },
      { $set: { status: 'success', paymentReference: paymentReference || undefined } },
      { new: true, session }
    );
    if (!updated) {
      const existing = await Deposit.findOne({ _id: depositId, userId: user._id }).session(session);
      if (!existing) throw new ApiError(404, 'Deposit not found');
      if (existing.status === 'success') {
        await session.abortTransaction();
        return existing;
      }
      throw new ApiError(400, 'Deposit cannot be confirmed');
    }
    const deposit = updated;
    if (!deposit.paymentReference) {
      deposit.paymentReference = deposit.transactionId;
      await deposit.save({ session });
    }

    let product = null;
    if (deposit.productId) {
      product = await Product.findById(deposit.productId).session(session);
      if (!product || !product.isActive) throw new ApiError(400, 'Product is no longer available');
      if (deposit.amount !== product.price) {
        throw new ApiError(400, 'Deposit amount does not match current product price');
      }
    }

    await credit(session, user._id, deposit.amount, { totalDeposit: deposit.amount });
    await writeTxn(session, {
      transactionId: deposit.transactionId,
      userId: user._id,
      type: 'deposit',
      amount: deposit.amount,
      status: 'success',
      referenceId: deposit._id,
      meta: { productId: deposit.productId },
    });

    if (product) await activatePurchase(session, user, product, deposit);

    const freshUser = await User.findById(user._id).session(session);
    await creditCommissions(session, deposit, freshUser);

    await session.commitTransaction();
    await logActivity({
      actorId: actorId || user._id,
      actorRole,
      action: 'deposit.success',
      targetType: 'deposit',
      targetId: deposit.transactionId,
      details: { amount: deposit.amount },
      ip,
    });
    return deposit;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function adminUpdateDeposit({ admin, depositId, status, adminNote, paymentReference, ip }) {
  const allowed = ['success', 'failed', 'rejected', 'cancelled'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid deposit status');
  if (status === 'success') throw new ApiError(400, 'Use confirm endpoint for success');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deposit = await Deposit.findOne({ _id: depositId, status: 'pending' }).session(session);
    if (!deposit) {
      const existing = await Deposit.findById(depositId).session(session);
      if (!existing) throw new ApiError(404, 'Deposit not found');
      throw new ApiError(400, 'Deposit is already finalized');
    }
    deposit.status = status;
    deposit.note = adminNote || deposit.note || '';
    if (paymentReference) deposit.paymentReference = paymentReference;
    await deposit.save({ session });
    await session.commitTransaction();
    await logActivity({
      actorId: admin._id,
      actorRole: 'admin',
      action: `deposit.${status}`,
      targetType: 'deposit',
      targetId: deposit.transactionId,
      details: { status, adminNote },
      ip,
    });
    return deposit;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function failOrCancelDeposit({ user, depositId, status, ip }) {
  if (!['failed', 'cancelled'].includes(status)) throw new ApiError(400, 'Invalid status');
  const deposit = await Deposit.findOne({ _id: depositId, userId: user._id });
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  if (deposit.status !== 'pending') throw new ApiError(400, 'Deposit is already finalized');
  deposit.status = status;
  await deposit.save();
  await logActivity({
    actorId: user._id,
    actorRole: 'user',
    action: `deposit.${status}`,
    targetType: 'deposit',
    targetId: deposit.transactionId,
    ip,
  });
  return deposit;
}

export async function requestWithdrawal({ user, amount, ip }) {
  const settings = await getSettings();
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new ApiError(400, 'Enter a valid withdrawal amount');
  if (value < Number(settings.minWithdrawal || 0)) {
    throw new ApiError(400, `Minimum withdrawal is ₹${settings.minWithdrawal}`);
  }

  const bank = await BankAccount.findOne({ userId: user._id }).select('+accountNumber');
  if (!bank) throw new ApiError(400, 'Add a bank account first');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await debitIfEnough(session, user._id, value);

    const [withdrawal] = await Withdrawal.create(
      [
        {
          withdrawalId: transactionRef('WDR'),
          userId: user._id,
          amount: value,
          status: 'pending',
          bankSnapshot: {
            holderName: bank.holderName,
            accountNumberMasked: maskAccount(bank.accountNumber),
            ifscCode: bank.ifscCode,
          },
        },
      ],
      { session }
    );

    await writeTxn(session, {
      transactionId: withdrawal.withdrawalId,
      userId: user._id,
      type: 'withdrawal',
      amount: value,
      status: 'pending',
      referenceId: withdrawal._id,
    });

    await session.commitTransaction();
    await logActivity({
      actorId: user._id,
      actorRole: 'user',
      action: 'withdrawal.request',
      targetType: 'withdrawal',
      targetId: withdrawal.withdrawalId,
      details: { amount: value },
      ip,
    });
    return withdrawal;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function adminUpdateWithdrawal({ admin, withdrawalId, status, adminNote, ip }) {
  if (status === 'success') status = 'completed';
  const allowed = ['approved', 'rejected', 'processing', 'completed'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid withdrawal status');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const withdrawal = await Withdrawal.findById(withdrawalId).session(session);
    if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');

    const prev = withdrawal.status;
    if (prev === 'completed' || prev === 'rejected') {
      throw new ApiError(400, 'This withdrawal is already finalized');
    }

    if (status === 'rejected' && prev !== 'rejected') {
      await credit(session, withdrawal.userId, withdrawal.amount);
      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: 'withdrawal' },
        { status: 'rejected' },
        { session }
      );
    }

    if (status === 'completed') {
      await User.findByIdAndUpdate(
        withdrawal.userId,
        { $inc: { totalWithdrawal: withdrawal.amount } },
        { session }
      );
      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: 'withdrawal' },
        { status: 'completed' },
        { session }
      );
    }

    if (status === 'approved' || status === 'processing') {
      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: 'withdrawal' },
        { status },
        { session }
      );
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote || withdrawal.adminNote;
    withdrawal.processedAt = new Date();
    await withdrawal.save({ session });

    await session.commitTransaction();
    await logActivity({
      actorId: admin._id,
      actorRole: 'admin',
      action: `withdrawal.${status}`,
      targetType: 'withdrawal',
      targetId: withdrawal.withdrawalId,
      details: { from: prev, to: status, adminNote },
      ip,
    });
    return withdrawal;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
