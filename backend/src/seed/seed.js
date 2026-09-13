import argon2 from 'argon2';
import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppSettings } from '../models/AppSettings.js';

const DEFAULT_PRODUCTS = [
  {
    name: 'Plan 1',
    image: '/products/plan-1.svg',
    durationDays: 100,
    dailyIncome: 120,
    totalIncome: 12000,
    price: 540,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Plan 2',
    image: '/products/plan-2.svg',
    durationDays: 100,
    dailyIncome: 455,
    totalIncome: 45000,
    price: 1970,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Plan 3',
    image: '/products/plan-3.svg',
    durationDays: 100,
    dailyIncome: 1212,
    totalIncome: 121200,
    price: 4970,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Plan 4',
    image: '/products/plan-4.svg',
    durationDays: 100,
    dailyIncome: 2575,
    totalIncome: 257500,
    price: 4970,
    isActive: true,
    sortOrder: 4,
  },
];

const FIXED_ADMIN_USERID = 'Saikat7433';

export async function ensureAdmin() {
  const existing = await User.findOne({ role: 'admin', userId: FIXED_ADMIN_USERID });
  if (existing) {
    let changed = false;
    if (existing.mobile !== env.adminMobile) {
      existing.mobile = env.adminMobile;
      changed = true;
    }
    const ok = await argon2.verify(existing.passwordHash, env.adminPassword).catch(() => false);
    if (!ok) {
      existing.passwordHash = await argon2.hash(env.adminPassword, { type: argon2.argon2id });
      changed = true;
    }
    if (changed) {
      await existing.save();
      console.log(`Admin verified: ${FIXED_ADMIN_USERID} / ${env.adminMobile}`);
    }
    const stray = await User.find({ role: 'admin', userId: { $ne: FIXED_ADMIN_USERID } });
    if (stray.length > 0) {
      for (const u of stray) {
        u.role = 'user';
        u.status = 'blocked';
        await u.save();
        console.log(`Demoted stray admin ${u.userId} -> blocked user`);
      }
    }
    const fixedCount = await User.countDocuments({ role: 'admin', userId: FIXED_ADMIN_USERID });
    if (fixedCount > 1) {
      const extras = await User.find({ role: 'admin', userId: FIXED_ADMIN_USERID }).sort({ createdAt: 1 }).skip(1);
      for (const u of extras) {
        u.role = 'user';
        u.status = 'blocked';
        await u.save();
      }
      console.log(`Removed duplicate admin accounts for ${FIXED_ADMIN_USERID}`);
    }
    return existing;
  }

  const legacy = await User.findOne({ role: 'admin' });
  if (legacy) {
    legacy.userId = FIXED_ADMIN_USERID;
    legacy.mobile = env.adminMobile;
    legacy.passwordHash = await argon2.hash(env.adminPassword, { type: argon2.argon2id });
    legacy.status = 'active';
    await legacy.save();
    console.log(`Legacy admin migrated to ${FIXED_ADMIN_USERID} / ${env.adminMobile}`);
    const stray2 = await User.find({ role: 'admin', userId: { $ne: FIXED_ADMIN_USERID } });
    for (const u of stray2) {
      u.role = 'user';
      u.status = 'blocked';
      await u.save();
    }
    return legacy;
  }

  const admin = await User.create({
    userId: FIXED_ADMIN_USERID,
    mobile: env.adminMobile,
    passwordHash: await argon2.hash(env.adminPassword, { type: argon2.argon2id }),
    inviteCode: 'ADMIN000',
    role: 'admin',
  });
  console.log(`Admin created: ${FIXED_ADMIN_USERID} / ${env.adminMobile}`);
  return admin;
}

export async function seedIfEmpty() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(DEFAULT_PRODUCTS);
    console.log('Seeded default products');
  }

  const settingsCount = await AppSettings.countDocuments();
  if (settingsCount === 0) {
    await AppSettings.insertMany([
      { key: 'appName', value: 'JET MOTORS' },
      { key: 'minWithdrawal', value: 100 },
      { key: 'inviteRequired', value: false },
      { key: 'commissionRates', value: { 1: 0.22, 2: 0.02, 3: 0.01 } },
      {
        key: 'aboutText',
        value:
          'JET MOTORS offers curated automotive service plans. Figures shown are plan features of a service product, not guaranteed investment yields. Confirm applicable laws, payment-provider rules, and consumer-protection requirements before operating with real money.',
      },
    ]);
  }
}

async function run() {
  await connectDb();
  await ensureAdmin();
  await seedIfEmpty();
  console.log('Seed complete');
  process.exit(0);
}

const isDirect = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('/seed/seed.js');
if (isDirect) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
