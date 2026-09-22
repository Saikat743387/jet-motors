import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongo;

const COLLECTIONS = [
  'users',
  'products',
  'purchases',
  'transactions',
  'dailyclaims',
  'deposits',
  'commissions',
  'activitylogs',
  'settings',
  'withdrawals',
  'referrals',
  'bankaccounts',
  'supporttickets',
];

export async function connect() {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  // Pre-create every collection so the first write inside a multi-document
  // transaction does not trigger MongoDB's "catalog changes" error (implicit
  // collection creation inside a transaction is not allowed).
  for (const name of COLLECTIONS) {
    try {
      await mongoose.connection.createCollection(name);
    } catch (err) {
      if (!/already exists/i.test(err.message)) throw err;
    }
  }
}

export async function disconnect() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

export async function clearDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
