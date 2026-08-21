import { MongoMemoryServer } from 'mongodb-memory-server';
const t = Date.now();
const s = await MongoMemoryServer.create();
console.log('READY', s.getUri(), 'in', ((Date.now() - t) / 1000).toFixed(1) + 's');
await s.stop();
console.log('STOPPED');
