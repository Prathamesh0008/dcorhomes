import 'server-only';
import { MongoClient } from 'mongodb';
import { createHash } from 'node:crypto';

const cache = globalThis as typeof globalThis & { dcorMongo?: Promise<MongoClient>; dcorMongoKey?: string };
function settings() {
  const uri = process.env.MONGODB_URI;
  if (!uri || /YOUR_PASSWORD|<password>/i.test(uri) || !/^mongodb(?:\+srv)?:\/\//.test(uri)) throw Error('Configure MONGODB_URI with the existing MongoDB connection.');
  let database: string;
  try { database = process.env.MONGODB_DB?.trim() || decodeURIComponent(new URL(uri).pathname.replace(/^\//, '')); }
  catch { throw Error('Check MONGODB_URI and MONGODB_DB.'); }
  if (!database || /[\/\\\s"$]/.test(database)) throw Error('Select the existing MongoDB database using MONGODB_DB or the URI.');
  return { uri, database };
}
export function mongoConfigured() {
  try { settings(); return true; } catch { return false; }
}
export async function mongoClient() {
  const { uri } = settings(), key = createHash('sha256').update(uri).digest('hex');
  if (cache.dcorMongoKey !== key) {
    cache.dcorMongo?.then(client => client.close()).catch(() => {});
    cache.dcorMongo = undefined; cache.dcorMongoKey = key;
  }
  if (!cache.dcorMongo) {
    const connection = new MongoClient(uri, { maxPoolSize: 5, maxIdleTimeMS: 30000, waitQueueTimeoutMS: 10000, serverSelectionTimeoutMS: 8000 }).connect();
    cache.dcorMongo = connection;
    connection.catch(() => { if (cache.dcorMongo === connection) cache.dcorMongo = undefined; });
  }
  return cache.dcorMongo;
}
export async function mongoDatabase() {
  const { database } = settings();
  const client = await mongoClient();
  return client.db(database);
}
