import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connect, disconnect, clearDb } from './setup.js';
import { User } from '../src/models/User.js';
import { Transaction } from '../src/models/Transaction.js';
import { registerUser } from '../src/services/auth.service.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDb();
});

describe('Signup bonus is ₹10', () => {
  it('newly registered user receives exactly ₹10 signup bonus', async () => {
    const mobile = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    const user = await registerUser({
      mobile,
      password: 'password123',
      confirmPassword: 'password123',
      inviteCode: '',
      ip: '127.0.0.1',
    });

    const fresh = await User.findById(user._id);
    expect(fresh.signupBonus).toBe(10);
    expect(fresh.depositBalance).toBe(0);
    expect(fresh.totalDeposit).toBe(0);
    expect(fresh.balance).toBe(0);

    const txn = await Transaction.findOne({ userId: user._id, type: 'signup_bonus', status: 'success' });
    expect(txn).toBeTruthy();
    expect(txn.amount).toBe(10);
  });

  it('signup bonus transaction amount is exactly 10', async () => {
    const mobile = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    const user = await registerUser({
      mobile,
      password: 'password123',
      confirmPassword: 'password123',
      inviteCode: '',
      ip: '127.0.0.1',
    });

    const txns = await Transaction.find({ userId: user._id, type: 'signup_bonus' });
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(10);
    expect(txns[0].status).toBe('success');
  });

  it('does not affect Deposit Balance, Total Deposit, balance', async () => {
    const mobile = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    const user = await registerUser({
      mobile,
      password: 'password123',
      confirmPassword: 'password123',
      inviteCode: '',
      ip: '127.0.0.1',
    });

    const fresh = await User.findById(user._id);
    expect(fresh.signupBonus).toBe(10);
    expect(fresh.depositBalance).toBe(0);
    expect(fresh.balance).toBe(0);
    expect(fresh.totalDeposit).toBe(0);
    expect(fresh.totalWithdrawal).toBe(0);
    expect(fresh.totalCommission).toBe(0);
  });

  it('creditSignupBonus is idempotent — second call does not double-credit', async () => {
    const { creditSignupBonus } = await import('../src/services/ledger.service.js');
    const mongoose = (await import('mongoose')).default;
    const mobile = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    const user = await registerUser({
      mobile,
      password: 'password123',
      confirmPassword: 'password123',
      inviteCode: '',
      ip: '127.0.0.1',
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await creditSignupBonus(session, user._id);
      expect(result).toBeNull();
      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }

    const fresh = await User.findById(user._id);
    expect(fresh.signupBonus).toBe(10);
    expect(await Transaction.countDocuments({ userId: user._id, type: 'signup_bonus' })).toBe(1);
  });
});
