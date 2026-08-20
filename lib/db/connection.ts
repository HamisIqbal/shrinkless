import mongoose from 'mongoose';
import { loadServerEnv } from '@/lib/env';

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { _mongooseCache?: ConnectionCache };

const cache: ConnectionCache = globalForMongoose._mongooseCache ?? { conn: null, promise: null };
globalForMongoose._mongooseCache = cache;

export async function connectToDatabase(uri?: string): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const resolvedUri = uri ?? loadServerEnv().MONGODB_URI;

  cache.promise ??= mongoose.connect(resolvedUri, { bufferCommands: false });
  cache.conn = await cache.promise;

  return cache.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!cache.conn) return;

  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
