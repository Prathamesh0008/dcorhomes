import 'server-only';
import { MongoClient } from 'mongodb';
import { DatabaseConfigurationError, logDatabaseFailure } from './database-diagnostics';
import { createHash } from 'node:crypto';

const cache = globalThis as typeof globalThis & { dcorMongo?: Promise<MongoClient>; dcorMongoKey?: string };
function settings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseConfigurationError('missing_configuration');
  if (/YOUR_PASSWORD|<password>/i.test(uri) || !/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new DatabaseConfigurationError('invalid_configuration');
  let database: string;
  try { database = process.env.MONGODB_DB?.trim() || decodeURIComponent(new URL(uri).pathname.replace(/^\//, '')); }
  catch { throw new DatabaseConfigurationError('invalid_configuration'); }
  if (!database || Buffer.byteLength(database, 'utf8') > 63 || /[\/\\\s"$.*<>:|?\x00]/.test(database)) throw new DatabaseConfigurationError(database ? 'invalid_configuration' : 'missing_configuration');
  return { uri, database };
}
export function mongoConfigured() {
  try { settings(); return true; } catch { return false; }
}
export async function mongoClient() {
  let configured: ReturnType<typeof settings>;
  try { configured = settings(); } catch (error) { logDatabaseFailure('configuration', error); throw error; }
  const { uri } = configured, key = createHash('sha256').update(uri).digest('hex');
  if (cache.dcorMongoKey !== key) {
    cache.dcorMongo?.then(client => client.close()).catch(() => {});
    cache.dcorMongo = undefined; cache.dcorMongoKey = key;
  }
  if (!cache.dcorMongo) {
    const connection = new MongoClient(uri, { maxPoolSize: 5, maxIdleTimeMS: 30000, waitQueueTimeoutMS: 10000, serverSelectionTimeoutMS: 8000 }).connect();
    cache.dcorMongo = connection;
    connection.catch(error => { logDatabaseFailure('connect', error); if (cache.dcorMongo === connection) cache.dcorMongo = undefined; });
  }
  return cache.dcorMongo;
}
export async function mongoDatabase() {
  const { database } = settings();
  const client = await mongoClient();
  return client.db(database);
}
