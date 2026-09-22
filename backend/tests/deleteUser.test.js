import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { connect, disconnect, clearDb } from './setup.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Purchase } from '../src/models/Purchase.js';
import { Deposit } from '../src/models/Deposit.js';
import { Withdrawal } from '../src/models/Withdrawal.js';
import { BankAccount } from '../src/models/BankAccount.js';
import { Transaction } from '../src/models/Transaction.js';
import { DailyClaim } from '../src/models/DailyClaim.js';
import { Referral } from '../src/models/Referral.js';
import { Commission } from '../src/models/Commission.js';
import { SupportTicket } from '../src/models/SupportTicket.js';
import { ActivityLog } from '../src/models/ActivityLog.js';
import { ApiError } from '../src/utils/apiError.js';

const ORIG = {};
let secret = 'test-secret';
let appServer;
let baseUrl;

beforeAll(async () => {
  ORIG.MONGODB_URI = process.env.MONGODB_URI;
  ORIG.JWT_SECRET = process.env.JWT_SECRET;
  ORIG.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  process.env.MONGODB_URI ||= 'mongodb://localhost/test';
  process.env.JWT_SECRET ||= 'test-secret';
  process.env.ADMIN_PASSWORD ||= 'test-admin-pass';

  await connect();

  const { default: adminRoutes } = await import('../src/routes/admin.routes.js');
  const { errorHandler } = await import('../src/middleware/errorHandler.js');
  const { env } = await import('../src/config/env.js');
  secret = env.jwtSecret;

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  appServer = app.listen(0);
  const { port } = appServer.address();
  baseUrl = `http://127.0.0.1:${port}/api/admin`;
});

afterAll(async () => {
  if (appServer) await new Promise((resolve) => appServer.close(resolve));
  await disconnect();
  for (const key of Object.keys(ORIG)) {
    if (ORIG[key] === undefined) delete process.env[key];
    else process.env[key] = ORIG[key];
  }
});

beforeEach(async () => {
  await clearDb();
});

let seq = 0;
async function createUser(overrides = {}) {
  seq += 1;
  const id = new mongoose.Types.ObjectId();
  return User.create({
    _id: id,
    userId: `JM${String(100000 + seq)}`,
    mobile: String(6000000000 + seq),
    passwordHash: 'fakehash',
    inviteCode: `CODE${Date.now()}${seq}`,
    balance: 0,
    depositBalance: 0,
    signupBonus: 0,
    totalDeposit: 0,
    ...overrides,
  });
}

async function createAdmin() {
  return createUser({ userId: 'Saikat7433', role: 'admin', inviteCode: 'ADMIN000' });
}

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn: '1h' });
}

async function del(url, token) {
  return fetch(url, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function countWhere(model, query) {
  return model.countDocuments(query);
}

async function loadFixture() {
  const product = await Product.create({
    name: 'Plan X',
    price: 540,
    dailyIncome: 12,
    totalIncome: 540,
    durationDays: 45,
    isActive: true,
  });

  const a = await createUser({ balance: 100, depositBalance: 540, totalDeposit: 540 });
  const b = await createUser({ balance: 50 });
  const c = await createUser({ balance: 25 });
  const r = await createUser({ balance: 300, totalCommission: 120 });

  const purchase = await Purchase.create({
    userId: a._id,
    productId: product._id,
    depositId: null,
    price: product.price,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    dailyIncome: product.dailyIncome,
    totalIncome: product.totalIncome,
    durationDays: product.durationDays,
    productName: product.name,
    status: 'active',
    claimedDays: 0,
    claimedTotal: 0,
  });

  await Deposit.insertMany([
    {
      transactionId: `DEP-A-1-${seq}`,
      userId: a._id,
      amount: 340,
      status: 'success',
      paymentReference: 'REF1',
    },
    {
      transactionId: `DEP-A-2-${seq}`,
      userId: a._id,
      amount: 200,
      status: 'pending',
      paymentToken: 'PAY',
    },
  ]);
  const depositA = await Deposit.findOne({ userId: a._id, transactionId: `DEP-A-1-${seq}` });

  await Withdrawal.insertMany([
    { withdrawalId: `WDW-A-1-${seq}`, userId: a._id, amount: 100, status: 'completed' },
    { withdrawalId: `WDW-A-2-${seq}`, userId: a._id, amount: 50, status: 'pending' },
  ]);

  await Transaction.insertMany([
    { transactionId: `TXN-A-1-${seq}`, userId: a._id, amount: 340, type: 'deposit', status: 'success' },
    { transactionId: `TXN-A-2-${seq}`, userId: a._id, amount: 540, type: 'purchase', status: 'success' },
    {
      transactionId: `TXN-B-other-${seq}`,
      userId: c._id,
      amount: 100,
      type: 'signup_bonus',
      status: 'success',
    },
    {
      transactionId: `TXN-R-comm-${seq}`,
      userId: r._id,
      amount: 74.8,
      type: 'commission',
      status: 'success',
      referenceId: depositA._id,
      meta: { level: 1, fromUserId: a.userId, rate: 0.22 },
    },
  ]);

  await DailyClaim.create({
    userId: a._id,
    purchaseId: purchase._id,
    productId: product._id,
    claimDate: '2026-09-21',
    amount: 12,
    status: 'success',
  });

  await Commission.insertMany([
    {
      userId: a._id,
      fromUserId: c._id,
      depositId: depositA._id,
      level: 1,
      rate: 0.22,
      baseAmount: 340,
      amount: 74.8,
      status: 'credited',
    },
    {
      userId: r._id,
      fromUserId: a._id,
      depositId: depositA._id,
      level: 1,
      rate: 0.22,
      baseAmount: 340,
      amount: 74.8,
      status: 'credited',
    },
  ]);

  await Referral.insertMany([
    { userId: a._id, memberId: b._id, level: 1 },
    { userId: r._id, memberId: a._id, level: 1 },
    { userId: c._id, memberId: b._id, level: 2 },
  ]);

  await SupportTicket.create({
    ticketId: `TCK-A-${seq}`,
    userId: a._id,
    subject: 'Help',
    status: 'open',
    messages: [{ senderRole: 'user', senderId: a._id, message: 'hi' }],
  });

  await BankAccount.create({
    userId: a._id,
    holderName: 'A',
    accountNumber: '1234567890',
    ifscCode: 'IFSC0000001',
  });

  await ActivityLog.insertMany([
    { actorId: a._id, actorRole: 'user', action: 'user.register', targetType: 'user', targetId: a.userId },
    {
      actorId: r._id,
      actorRole: 'admin',
      action: 'user.update',
      targetType: 'user',
      targetId: a.userId,
    },
    { actorId: c._id, actorRole: 'user', action: 'user.register', targetType: 'user', targetId: c.userId },
  ]);

  // b and r's documents reference a via referredBy (b) — must be cleared, not deleted.
  await User.updateMany({ _id: { $in: [b._id, r._id] } }, { $set: { referredBy: a._id } });

  return { a, b, c, r, product, purchase, depositA };
}

describe('deleteUserPermanently service', async () => {
  it('permanently deletes the user and every user-owned record', async () => {
    const { deleteUserPermanently } = await import('../src/services/deleteUser.service.js');
    const admin = await createAdmin();
    const { a, depositA, purchase } = await loadFixture();

    const result = await deleteUserPermanently({ admin, userId: a._id.toString(), ip: '127.0.0.1' });

    expect(result.userId).toBe(a.userId);
    expect(result.userDeleted).toBe(true);
    expect(await User.findById(a._id)).toBeNull();

    expect(await Purchase.countDocuments({ userId: a._id })).toBe(0);
    expect(await Deposit.countDocuments({ userId: a._id })).toBe(0);
    expect(await Withdrawal.countDocuments({ userId: a._id })).toBe(0);
    expect(await Transaction.countDocuments({ userId: a._id })).toBe(0);
    expect(await DailyClaim.countDocuments({ userId: a._id })).toBe(0);
    expect(await Commission.countDocuments({ $or: [{ userId: a._id }, { fromUserId: a._id }] })).toBe(0);
    expect(await Referral.countDocuments({ $or: [{ userId: a._id }, { memberId: a._id }] })).toBe(0);
    expect(await SupportTicket.countDocuments({ userId: a._id })).toBe(0);
    expect(await BankAccount.countDocuments({ userId: a._id })).toBe(0);
    expect(await ActivityLog.countDocuments({ $or: [{ actorId: a._id }, { targetType: 'user', targetId: a.userId }], action: { $ne: 'user.delete.permanent' } })).toBe(0);
    expect(await ActivityLog.countDocuments({ action: 'user.delete.permanent', targetId: a.userId })).toBe(1);
  });

  it('removes cross-user orphan references but keeps other users intact', async () => {
    const { deleteUserPermanently } = await import('../src/services/deleteUser.service.js');
    const admin = await createAdmin();
    const { a, b, c, r, depositA } = await loadFixture();

    await deleteUserPermanently({ admin, userId: a._id.toString(), ip: '127.0.0.1' });

    // Other users still exist.
    expect(await User.findById(b._id)).not.toBeNull();
    expect(await User.findById(c._id)).not.toBeNull();
    expect(await User.findById(r._id)).not.toBeNull();

    // Their referredBy pointers to the deleted user were cleared, not those users deleted.
    const bFresh = await User.findById(b._id);
    const rFresh = await User.findById(r._id);
    expect(bFresh.referredBy).toBeNull();
    expect(rFresh.referredBy).toBeNull();
    // Their own financial data stays untouched.
    expect(bFresh.balance).toBe(50);
    expect(rFresh.balance).toBe(300);
    expect(rFresh.totalCommission).toBe(120);

    // Referrers' commission ledger rows referencing the deleted user are gone.
    expect(await Commission.countDocuments({ userId: r._id })).toBe(0);

    // The referrer's commission transaction that referenced the deleted user's deposit is removed,
    // but the referrer's own documents remain.
    expect(await Transaction.countDocuments({ userId: r._id })).toBe(0);
    expect(await Transaction.countDocuments({ userId: c._id, type: 'signup_bonus' })).toBe(1);

    // Unrelated user C's referral records are intact.
    expect(await Referral.countDocuments({ userId: c._id })).toBe(1);
    expect(depositA).toBeTruthy();
  });

  it('refuses to delete an admin account', async () => {
    const { deleteUserPermanently } = await import('../src/services/deleteUser.service.js');
    const admin = await createAdmin();

    await expect(
      deleteUserPermanently({ admin, userId: admin._id.toString(), ip: '127.0.0.1' })
    ).rejects.toThrow('Cannot permanently delete an admin account');
    expect(await User.findById(admin._id)).not.toBeNull();
  });

  it('rejects an invalid or non-existent target user id', async () => {
    const { deleteUserPermanently } = await import('../src/services/deleteUser.service.js');
    const admin = await createAdmin();

    await expect(deleteUserPermanently({ admin, userId: 'not-a-valid-id', ip: '127.0.0.1' })).rejects.toThrow('Invalid user id');
    await expect(
      deleteUserPermanently({ admin, userId: new mongoose.Types.ObjectId().toString(), ip: '127.0.0.1' })
    ).rejects.toThrow('User not found');
  });
});

describe('DELETE /api/admin/users/:id (HTTP)', () => {
  it('returns 401 without a token', async () => {
    const admin = await createAdmin();
    const user = await createUser();

    const res = await del(`${baseUrl}/users/${user._id}`, null);
    expect(res.status).toBe(401);
    expect(await User.findById(user._id)).not.toBeNull();
    expect(admin.role).toBe('admin');
  });

  it('rejects a normal (non-admin) user with 403', async () => {
    const normal = await createUser({ role: 'user' });
    const victim = await createUser();

    const res = await del(`${baseUrl}/users/${victim._id}`, tokenFor(normal));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain('Admin access required');
    expect(await User.findById(victim._id)).not.toBeNull();
  });

  it('rejects any non-Saikat7433 admin with 403', async () => {
    const fakeAdmin = await createUser({ role: 'admin', userId: 'JMOtherAdmin' });
    const victim = await createUser();

    const res = await del(`${baseUrl}/users/${victim._id}`, tokenFor(fakeAdmin));
    expect(res.status).toBe(403);
    expect(await User.findById(victim._id)).not.toBeNull();
  });

  it('allows the authorized admin to permanently delete the user via HTTP', async () => {
    const admin = await createAdmin();
    const { a } = await loadFixture();

    const res = await del(`${baseUrl}/users/${a._id}`, tokenFor(admin));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.userDeleted).toBe(true);
    expect(await User.findById(a._id)).toBeNull();
    expect(await Transaction.countDocuments({ userId: a._id })).toBe(0);
    expect(await Purchase.countDocuments({ userId: a._id })).toBe(0);
  });

  it('returns 404 for a non-existent user id through the API', async () => {
    const admin = await createAdmin();
    const missing = new mongoose.Types.ObjectId();

    const res = await del(`${baseUrl}/users/${missing}`, tokenFor(admin));
    expect(res.status).toBe(404);
  });
});