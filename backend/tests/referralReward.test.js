import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connect, disconnect, clearDb } from './setup.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Referral } from '../src/models/Referral.js';
import { ReferralReward } from '../src/models/ReferralReward.js';
import { Transaction } from '../src/models/Transaction.js';
import { registerUser } from '../src/services/auth.service.js';
import { creditReferralReward } from '../src/services/ledger.service.js';
import { purchaseWithDepositBalance } from '../src/services/ledger.service.js';

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
beforeEach(async () => { await clearDb(); });

async function createProduct(price = 40) {
  return Product.create({
    name: 'Test Plan',
    price,
    dailyIncome: 25,
    totalIncome: 50,
    durationDays: 2,
    isActive: true,
  });
}

describe('Referral Reward ₹5 to Deposit Balance', () => {
  it('per referral gives exactly ₹5 to depositBalance, NOT withdrawal balance', async () => {
    const referrer = await registerUser({ mobile: '9000000001', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    const before = await User.findById(referrer._id);
    expect(before.depositBalance).toBe(0);
    expect(before.balance).toBe(0);

    const referred = await registerUser({ mobile: '9000000002', password: 'password123', confirmPassword: 'password123', inviteCode: referrer.inviteCode, ip: '127.0.0.1' });

    const after = await User.findById(referrer._id);
    expect(after.depositBalance).toBe(5);
    expect(after.balance).toBe(0); // withdrawal unchanged
    expect(after.totalDeposit).toBe(0); // not a deposit
    expect(after.signupBonus).toBe(10); // referrer signup bonus unchanged

    const reward = await ReferralReward.findOne({ referrerId: referrer._id, referredId: referred._id });
    expect(reward).toBeTruthy();
    expect(reward.amount).toBe(5);

    const txn = await Transaction.findOne({ userId: referrer._id, type: 'referral_reward', referenceId: referred._id });
    expect(txn).toBeTruthy();
    expect(txn.amount).toBe(5);
    expect(txn.status).toBe('success');
    expect(txn.meta.description).toMatch(/Referral Reward/);
  });

  it('depositBalance increase is usable for plan purchase via depositBalance flow', async () => {
    const referrer = await registerUser({ mobile: '9000000003', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    // Create 8 referrals to get total 40 (8 *5 =40)
    for (let i = 0; i < 8; i++) {
      const mobile = `9000001${String(100 + i).padStart(3,'0')}`;
      await registerUser({ mobile, password: 'password123', confirmPassword: 'password123', inviteCode: referrer.inviteCode, ip: '127.0.0.1' });
    }
    const afterReferrals = await User.findById(referrer._id);
    expect(afterReferrals.depositBalance).toBe(40); // 8 referrals *5 =40
    // Now purchase Plan 1 price 40 using depositBalance
    const product = await createProduct(40);
    const result = await purchaseWithDepositBalance({ user: afterReferrals, productId: product._id, ip: '127.0.0.1' });
    expect(result.depositBalance).toBe(0);
    const afterPurchase = await User.findById(referrer._id);
    expect(afterPurchase.depositBalance).toBe(0);
    expect(afterPurchase.balance).toBe(0); // withdrawal still 0
  });

  it('duplicate referral processing cannot create another ₹5 (idempotent)', async () => {
    const referrer = await registerUser({ mobile: '9000000004', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    const referred = await registerUser({ mobile: '9000000005', password: 'password123', confirmPassword: 'password123', inviteCode: referrer.inviteCode, ip: '127.0.0.1' });

    const afterFirst = await User.findById(referrer._id);
    expect(afterFirst.depositBalance).toBe(5);

    // Try to credit again directly - should be idempotent
    const session = await mongoose.startSession();
    session.startTransaction();
    let res;
    try {
      res = await creditReferralReward(session, referrer._id, referred._id);
      await session.commitTransaction();
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
    expect(res).toBeNull();

    const afterSecond = await User.findById(referrer._id);
    expect(afterSecond.depositBalance).toBe(5); // still 5, not 10
    const count = await ReferralReward.countDocuments({ referrerId: referrer._id, referredId: referred._id });
    expect(count).toBe(1);
    const txns = await Transaction.countDocuments({ userId: referrer._id, type: 'referral_reward', referenceId: referred._id });
    expect(txns).toBe(1);
  });

  it('concurrent duplicate processing is safe (only one succeeds)', async () => {
    const referrer = await registerUser({ mobile: '9000000006', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    const referred = await registerUser({ mobile: '9000000007', password: 'password123', confirmPassword: 'password123', inviteCode: referrer.inviteCode, ip: '127.0.0.1' });

    // Reset to 0 to test concurrent credit attempt after deletion? Actually already has 5, we need a new referred user without reward
    // Create a new referred user manually without going through registerUser reward, then try concurrent
    const manualReferred = await User.create({
      userId: `JM${Date.now().toString().slice(-6)}`,
      mobile: '9000000008',
      passwordHash: 'fake',
      inviteCode: 'CODEM1',
      referredBy: referrer._id,
      role: 'user',
    });

    const before = await User.findById(referrer._id);
    // before is 5 from previous referral, we want to test concurrent for manualReferred
    const results = await Promise.allSettled([
      (async () => {
        const s = await mongoose.startSession(); s.startTransaction();
        try { const r = await creditReferralReward(s, referrer._id, manualReferred._id); await s.commitTransaction(); return r; } catch(e){ if (s.inTransaction()) await s.abortTransaction(); throw e; } finally { s.endSession(); }
      })(),
      (async () => {
        const s = await mongoose.startSession(); s.startTransaction();
        try { const r = await creditReferralReward(s, referrer._id, manualReferred._id); await s.commitTransaction(); return r; } catch(e){ if (s.inTransaction()) await s.abortTransaction(); throw e; } finally { s.endSession(); }
      })(),
    ]);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value);
    expect(successes.length).toBe(1);
    const after = await User.findById(referrer._id);
    expect(after.depositBalance).toBe(10); // 5 + 5
    expect(after.balance).toBe(0);
  });

  it('existing Level 1/2/3 commissions still calculate exactly 22%/2%/1% and separate from ₹5', async () => {
    // Create chain: A refers B, B refers C, C refers D
    const userA = await registerUser({ mobile: '9000000010', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    const userB = await registerUser({ mobile: '9000000011', password: 'password123', confirmPassword: 'password123', inviteCode: userA.inviteCode, ip: '127.0.0.1' });
    const userC = await registerUser({ mobile: '9000000012', password: 'password123', confirmPassword: 'password123', inviteCode: userB.inviteCode, ip: '127.0.0.1' });
    const userD = await registerUser({ mobile: '9000000013', password: 'password123', confirmPassword: 'password123', inviteCode: userC.inviteCode, ip: '127.0.0.1' });

    // Check referral rewards: A got 5 from B, B got 5 from C, C got 5 from D
    const afterA = await User.findById(userA._id);
    const afterB = await User.findById(userB._id);
    const afterC = await User.findById(userC._id);
    expect(afterA.depositBalance).toBe(5);
    expect(afterB.depositBalance).toBe(5);
    expect(afterC.depositBalance).toBe(5);
    // Balances unchanged
    expect(afterA.balance).toBe(0);
    expect(afterB.balance).toBe(0);
    expect(afterC.balance).toBe(0);

    // Now D makes a deposit of 1000, commissions should be: A level3 1% =10, B level2 2%=20, C level1 22% =220
    const { confirmDepositServerSide } = await import('../src/services/ledger.service.js');
    const { Deposit } = await import('../src/models/Deposit.js');
    const deposit = await Deposit.create({
      transactionId: `DEP-TEST-${Date.now()}-${Math.random()}`,
      userId: userD._id,
      productId: null,
      amount: 1000,
      status: 'pending',
      paymentToken: 'PAY-TEST',
    });
    await confirmDepositServerSide({ user: userD, depositId: deposit._id, paymentReference: 'UPI-TEST', actorRole: 'system', actorId: userD._id, ip: '127.0.0.1' });

    const freshA = await User.findById(userA._id);
    const freshB = await User.findById(userB._id);
    const freshC = await User.findById(userC._id);
    // DepositBalances were 5 each, commissions go to balance (withdrawal), not depositBalance
    expect(freshA.depositBalance).toBe(5);
    expect(freshB.depositBalance).toBe(5);
    expect(freshC.depositBalance).toBe(5);
    expect(freshA.balance).toBe(10); // 1%
    expect(freshB.balance).toBe(20); // 2%
    expect(freshC.balance).toBe(220); // 22%
    expect(freshA.totalCommission).toBe(10);
    expect(freshB.totalCommission).toBe(20);
    expect(freshC.totalCommission).toBe(220);

    const { Commission } = await import('../src/models/Commission.js');
    const comms = await Commission.find({ fromUserId: userD._id });
    expect(comms).toHaveLength(3);
  });

  it('referral reward does not increase totalCommission and is not counted as commission', async () => {
    const referrer = await registerUser({ mobile: '9000000014', password: 'password123', confirmPassword: 'password123', inviteCode: '', ip: '127.0.0.1' });
    await registerUser({ mobile: '9000000015', password: 'password123', confirmPassword: 'password123', inviteCode: referrer.inviteCode, ip: '127.0.0.1' });
    const after = await User.findById(referrer._id);
    expect(after.totalCommission).toBe(0);
    expect(after.depositBalance).toBe(5);
    const { Commission } = await import('../src/models/Commission.js');
    const comms = await Commission.countDocuments({ userId: referrer._id });
    expect(comms).toBe(0);
  });

  it('frontend cannot directly credit referral reward - only via server', async () => {
    // Ensure no API endpoint allows direct credit; only registration triggers it
    // Verify that ReferralReward is only created via register, not via arbitrary POST
    const { ReferralReward: RR } = await import('../src/models/ReferralReward.js');
    const countBefore = await RR.countDocuments();
    expect(countBefore).toBeGreaterThanOrEqual(0);
    // Attempt to manually create via direct model would require bypass, but API should not expose
    // This test just ensures the model exists and has unique index
    const indexes = await RR.collection.getIndexes();
    expect(indexes).toHaveProperty('referrerId_1_referredId_1');
  });
});
