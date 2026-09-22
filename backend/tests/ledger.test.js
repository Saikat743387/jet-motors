import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connect, disconnect, clearDb } from './setup.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Purchase } from '../src/models/Purchase.js';
import { DailyClaim } from '../src/models/DailyClaim.js';
import { Transaction } from '../src/models/Transaction.js';
import { purchaseWithDepositBalance, claimDailyIncome } from '../src/services/ledger.service.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDb();
});

function makeUserId() {
  return new mongoose.Types.ObjectId();
}

async function createUser(overrides = {}) {
  const id = makeUserId();
  const user = await User.create({
    _id: id,
    userId: `JM${Date.now().toString().slice(-6)}`,
    mobile: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    passwordHash: 'fakehash',
    inviteCode: `CODE${Date.now()}`,
    balance: 0,
    depositBalance: 0,
    signupBonus: 0,
    totalDeposit: 0,
    ...overrides,
  });
  return user;
}

async function createProduct(overrides = {}) {
  return Product.create({
    name: 'Test Plan',
    price: 540,
    dailyIncome: 12,
    totalIncome: 540,
    durationDays: 45,
    isActive: true,
    ...overrides,
  });
}

describe('Purchase with Deposit Balance', () => {
  it('deducts plan price from depositBalance', async () => {
    const user = await createUser({ depositBalance: 1000 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.depositBalance).toBe(460);
  });

  it('does NOT change balance (Withdrawal Balance)', async () => {
    const user = await createUser({ depositBalance: 1000, balance: 200 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.balance).toBe(200);
  });

  it('does NOT change signupBonus', async () => {
    const user = await createUser({ depositBalance: 1000, signupBonus: 50 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.signupBonus).toBe(50);
  });

  it('does NOT change totalDeposit', async () => {
    const user = await createUser({ depositBalance: 1000, totalDeposit: 1000 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.totalDeposit).toBe(1000);
  });

  it('creates a Purchase record with correct fields', async () => {
    const user = await createUser({ depositBalance: 1000 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    const result = await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    expect(result.purchase).toBeDefined();
    expect(result.purchase.userId.toString()).toBe(user._id.toString());
    expect(result.purchase.productId.toString()).toBe(product._id.toString());
    expect(result.purchase.price).toBe(540);
    expect(result.purchase.dailyIncome).toBe(12);
    expect(result.purchase.totalIncome).toBe(540);
    expect(result.purchase.durationDays).toBe(45);
    expect(result.purchase.status).toBe('active');
  });

  it('creates a purchase transaction record', async () => {
    const user = await createUser({ depositBalance: 1000 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const txn = await Transaction.findOne({ userId: user._id, type: 'purchase' });
    expect(txn).toBeTruthy();
    expect(txn.amount).toBe(540);
    expect(txn.status).toBe('success');
  });

  it('returns updated depositBalance', async () => {
    const user = await createUser({ depositBalance: 1000 });
    const product = await createProduct({ price: 540 });

    const result = await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    expect(result.depositBalance).toBe(460);
  });

  it('rejects purchase with insufficient depositBalance', async () => {
    const user = await createUser({ depositBalance: 100 });
    const product = await createProduct({ price: 540 });

    await expect(
      purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' })
    ).rejects.toThrow('Insufficient deposit balance');
  });

  it('rejects purchase with zero depositBalance', async () => {
    const user = await createUser({ depositBalance: 0 });
    const product = await createProduct({ price: 540 });

    await expect(
      purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' })
    ).rejects.toThrow('Insufficient deposit balance');
  });

  it('rejects purchase of inactive product', async () => {
    const user = await createUser({ depositBalance: 1000 });
    const product = await createProduct({ isActive: false });

    await expect(
      purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' })
    ).rejects.toThrow('Product not available');
  });

  it('ignores client-supplied amounts — never credits Withdrawal Balance from a purchase', async () => {
    const user = await createUser({ depositBalance: 1000, balance: 0 });
    const product = await createProduct({ price: 540, dailyIncome: 12 });

    const tamperedPayload = {
      user,
      productId: product._id,
      ip: '127.0.0.1',
      dailyIncome: 999999,
      amount: 1,
      balanceCredit: 50000,
      price: 1,
      status: 'success',
    };

    await purchaseWithDepositBalance(tamperedPayload);

    const updated = await User.findById(user._id);
    expect(updated.balance).toBe(0);
    expect(updated.depositBalance).toBe(460);
    const txn = await Transaction.findOne({ userId: user._id, type: 'purchase' });
    expect(txn.amount).toBe(540);
  });

  it('does not overdraw on concurrent-style edge (exact balance)', async () => {
    const user = await createUser({ depositBalance: 540 });
    const product = await createProduct({ price: 540 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.depositBalance).toBe(0);
    expect(updated.balance).toBe(0);
  });
});

describe('Claim Daily Income', () => {
  async function createActivePurchase(user, product, overrides = {}) {
    const now = new Date();
    const endDate = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);
    return Purchase.create({
      userId: user._id,
      productId: product._id,
      depositId: null,
      price: product.price,
      startDate: now,
      endDate,
      dailyIncome: product.dailyIncome,
      totalIncome: product.totalIncome,
      durationDays: product.durationDays,
      productName: product.name,
      productImage: '',
      status: 'active',
      claimedDays: 0,
      claimedTotal: 0,
      ...overrides,
    });
  }

  it('credits dailyIncome to balance (Withdrawal Balance)', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    const result = await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.balance).toBe(12);
    expect(result.balance).toBe(12);
  });

  it('does NOT change depositBalance', async () => {
    const user = await createUser({ depositBalance: 500, balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.depositBalance).toBe(500);
  });

  it('does NOT change signupBonus', async () => {
    const user = await createUser({ balance: 0, signupBonus: 50 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const updated = await User.findById(user._id);
    expect(updated.signupBonus).toBe(50);
  });

  it('creates a DailyClaim record', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const claim = await DailyClaim.findOne({ purchaseId: purchase._id });
    expect(claim).toBeTruthy();
    expect(claim.amount).toBe(12);
    expect(claim.status).toBe('success');
  });

  it('creates a daily_income transaction record', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const txn = await Transaction.findOne({ userId: user._id, type: 'daily_income' });
    expect(txn).toBeTruthy();
    expect(txn.amount).toBe(12);
    expect(txn.status).toBe('success');
  });

  it('increments purchase claimedDays and claimedTotal', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const updated = await Purchase.findById(purchase._id);
    expect(updated.claimedDays).toBe(1);
    expect(updated.claimedTotal).toBe(12);
  });

  it('multiple daily claims credit only their dailyIncome amounts', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12, durationDays: 5, totalIncome: 60 });
    const purchase = await createActivePurchase(user, product);

    // Day 1
    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });
    const afterDay1 = await User.findById(user._id);
    expect(afterDay1.balance).toBe(12);

    // Day 2 (use a different date)
    const day2 = new Date();
    day2.setDate(day2.getDate() + 1);
    await claimDailyIncome({ user, purchaseId: purchase._id, now: day2, ip: '127.0.0.1' });
    const afterDay2 = await User.findById(user._id);
    expect(afterDay2.balance).toBe(24);

    // Day 3
    const day3 = new Date();
    day3.setDate(day3.getDate() + 2);
    await claimDailyIncome({ user, purchaseId: purchase._id, now: day3, ip: '127.0.0.1' });
    const afterDay3 = await User.findById(user._id);
    expect(afterDay3.balance).toBe(36);

    const purchaseAfter = await Purchase.findById(purchase._id);
    expect(purchaseAfter.claimedDays).toBe(3);
    expect(purchaseAfter.claimedTotal).toBe(36);
  });

  it('depositBalance stays unchanged across multiple claims', async () => {
    const user = await createUser({ depositBalance: 200, balance: 0 });
    const product = await createProduct({ dailyIncome: 12, durationDays: 3, totalIncome: 36 });
    const purchase = await createActivePurchase(user, product);

    for (let i = 0; i < 3; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      await claimDailyIncome({ user, purchaseId: purchase._id, now: day, ip: '127.0.0.1' });
    }

    const updated = await User.findById(user._id);
    expect(updated.depositBalance).toBe(200);
    expect(updated.balance).toBe(36);
  });

  it('rejects same-day duplicate claim', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const purchase = await createActivePurchase(user, product);

    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    await expect(
      claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' })
    ).rejects.toThrow("Today's income has already been claimed");
  });

  it('rejects claim for non-existent purchase', async () => {
    const user = await createUser({ balance: 0 });
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      claimDailyIncome({ user, purchaseId: fakeId, ip: '127.0.0.1' })
    ).rejects.toThrow('Purchase not found');
  });

  it('rejects claim for completed purchase', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12, durationDays: 1, totalIncome: 12 });
    const purchase = await createActivePurchase(user, product, { status: 'completed' });

    await expect(
      claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' })
    ).rejects.toThrow('This plan is no longer active');
  });

  it('rejects claim before plan start date', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12 });
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 5);
    const endDate = new Date(futureStart.getTime() + product.durationDays * 24 * 60 * 60 * 1000);
    const purchase = await createActivePurchase(user, product, {
      startDate: futureStart,
      endDate,
    });

    await expect(
      claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' })
    ).rejects.toThrow('This plan has not started yet');
  });

  it('auto-marks purchase completed when all days claimed', async () => {
    const user = await createUser({ balance: 0 });
    const product = await createProduct({ dailyIncome: 12, durationDays: 2, totalIncome: 24 });
    const purchase = await createActivePurchase(user, product);

    // Day 1
    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    // Day 2
    const day2 = new Date();
    day2.setDate(day2.getDate() + 1);
    await claimDailyIncome({ user, purchaseId: purchase._id, now: day2, ip: '127.0.0.1' });

    const updated = await Purchase.findById(purchase._id);
    expect(updated.status).toBe('completed');
    expect(updated.claimedDays).toBe(2);
    expect(updated.claimedTotal).toBe(24);
  });
});

describe('End-to-end: deposit → purchase → claim', () => {
  it('full cycle: deposit 540, buy plan 540, claim day 1 & 2', async () => {
    const user = await createUser({ depositBalance: 0, balance: 0 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    // Simulate deposit confirmation: credit depositBalance
    await User.findByIdAndUpdate(user._id, { $inc: { depositBalance: 540, totalDeposit: 540 } });
    let snapshot = await User.findById(user._id);
    expect(snapshot.depositBalance).toBe(540);
    expect(snapshot.balance).toBe(0);

    // Buy plan
    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });
    snapshot = await User.findById(user._id);
    expect(snapshot.depositBalance).toBe(0);
    expect(snapshot.balance).toBe(0);

    // Claim Day 1
    const purchase = await Purchase.findOne({ userId: user._id, productId: product._id });
    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });
    snapshot = await User.findById(user._id);
    expect(snapshot.depositBalance).toBe(0);
    expect(snapshot.balance).toBe(12);

    // Claim Day 2
    const day2 = new Date();
    day2.setDate(day2.getDate() + 1);
    await claimDailyIncome({ user, purchaseId: purchase._id, now: day2, ip: '127.0.0.1' });
    snapshot = await User.findById(user._id);
    expect(snapshot.depositBalance).toBe(0);
    expect(snapshot.balance).toBe(24);
  });

  it('signupBonus is untouched through the full cycle', async () => {
    const user = await createUser({ depositBalance: 540, balance: 0, signupBonus: 50 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    await purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' });

    const purchase = await Purchase.findOne({ userId: user._id, productId: product._id });
    await claimDailyIncome({ user, purchaseId: purchase._id, ip: '127.0.0.1' });

    const snapshot = await User.findById(user._id);
    expect(snapshot.signupBonus).toBe(50);
    expect(snapshot.balance).toBe(12);
    expect(snapshot.depositBalance).toBe(0);
  });
});

describe('Deposit tagged with a product (buy a plan by paying)', () => {
  async function depositForProduct(user, product) {
    const { confirmDepositServerSide } = await import('../src/services/ledger.service.js');
    const { Deposit } = await import('../src/models/Deposit.js');
    const deposit = await Deposit.create({
      transactionId: `DEP-TEST-${Date.now()}-${Math.random()}`,
      userId: user._id,
      productId: product._id,
      amount: product.price,
      status: 'pending',
      paymentToken: 'PAY-TEST',
    });
    const confirmed = await confirmDepositServerSide({
      user,
      depositId: deposit._id,
      paymentReference: 'UPI-TEST',
      actorRole: 'system',
      actorId: user._id,
      ip: '127.0.0.1',
    });
    return { confirmed, deposit };
  }

  it('does not leave the plan price sitting in Deposit Balance', async () => {
    const user = await createUser({ depositBalance: 0, balance: 0, signupBonus: 50 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    await depositForProduct(user, product);

    const snapshot = await User.findById(user._id);
    expect(snapshot.depositBalance).toBe(0);
    expect(snapshot.balance).toBe(0);
    expect(snapshot.totalDeposit).toBe(540);
    expect(snapshot.signupBonus).toBe(50);
  });

  it('activates exactly one plan and does not credit the Withdrawal Balance', async () => {
    const user = await createUser({ depositBalance: 0, balance: 0 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    await depositForProduct(user, product);

    const purchases = await Purchase.find({ userId: user._id, productId: product._id });
    expect(purchases).toHaveLength(1);
    expect(purchases[0].status).toBe('active');
    expect(purchases[0].price).toBe(540);
    expect(purchases[0].dailyIncome).toBe(12);

    const fresh = await User.findById(user._id);
    expect(fresh.balance).toBe(0);
    expect(fresh.depositBalance).toBe(0);
  });

  it('cannot re-buy the plan the user already paid the price for', async () => {
    const user = await createUser({ depositBalance: 0, balance: 0 });
    const product = await createProduct({ price: 540, dailyIncome: 12, totalIncome: 540, durationDays: 45 });

    await depositForProduct(user, product);

    await expect(
      purchaseWithDepositBalance({ user, productId: product._id, ip: '127.0.0.1' })
    ).rejects.toThrow('Insufficient deposit balance');

    const fresh = await User.findById(user._id);
    expect(fresh.depositBalance).toBe(0);
    expect(fresh.balance).toBe(0);
    expect(await Purchase.countDocuments({ userId: user._id })).toBe(1);
  });

  it('plain top-up (no product) still credits Deposit Balance', async () => {
    const user = await createUser({ depositBalance: 0, balance: 0 });
    const { confirmDepositServerSide } = await import('../src/services/ledger.service.js');
    const { Deposit } = await import('../src/models/Deposit.js');
    const deposit = await Deposit.create({
      transactionId: `DEP-TEST-${Date.now()}-${Math.random()}`,
      userId: user._id,
      productId: null,
      amount: 5000,
      status: 'pending',
      paymentToken: 'PAY-TEST',
    });
    await confirmDepositServerSide({
      user,
      depositId: deposit._id,
      paymentReference: 'UPI-TEST',
      actorRole: 'system',
      actorId: user._id,
      ip: '127.0.0.1',
    });

    const fresh = await User.findById(user._id);
    expect(fresh.depositBalance).toBe(5000);
    expect(fresh.balance).toBe(0);
    expect(fresh.totalDeposit).toBe(5000);
    expect(await Purchase.countDocuments({ userId: user._id })).toBe(0);
  });
});
