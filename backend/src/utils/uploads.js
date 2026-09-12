import mongoose from 'mongoose';

const BUCKET_NAME = 'uploads';

let bucket;

function getBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: BUCKET_NAME,
    });
  }
  return bucket;
}

export async function saveImage(filename, contentType, buffer) {
  const b = getBucket();
  await new Promise((resolve, reject) => {
    const stream = b.openUploadStream(filename, { contentType });
    stream.on('finish', resolve);
    stream.on('error', reject);
    stream.end(buffer);
  });
}

export async function findImage(filename) {
  return getBucket().find({ filename }).sort({ uploadDate: -1 }).next();
}

export function imageStream(filename) {
  return getBucket().openDownloadStreamByName(filename, { revision: -1 });
}