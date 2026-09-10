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

export async function ensureAdmin() {
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return existing;
  const admin = await User.create({
    userId: 'JM000000',
    mobile: env.adminMobile,
    passwordHash: await argon2.hash(env.adminPassword, { type: argon2.argon2id }),
    inviteCode: 'ADMIN000',
    role: 'admin',
  });
  console.log(`Admin created: ${env.adminMobile}`);
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
