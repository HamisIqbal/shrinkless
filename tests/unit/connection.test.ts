import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/connection';

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
});

afterAll(async () => {
  await disconnectFromDatabase();
  await server.stop();
});

describe('connectToDatabase', () => {
  it('connects and reuses the same connection on a second call', async () => {
    const first = await connectToDatabase(server.getUri());
    const second = await connectToDatabase(server.getUri());

    expect(first.connection.readyState).toBe(1);
    expect(second).toBe(first);
  });
});
