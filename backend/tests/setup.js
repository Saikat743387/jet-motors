import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongo;

export async function connect() {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
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
