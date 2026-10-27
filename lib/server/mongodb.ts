import 'server-only';
import { MongoClient } from 'mongodb';
import { DatabaseConfigurationError, logDatabaseFailure } from './database-diagnostics';
import { createHash } from 'node:crypto';

const cache = globalThis as typeof globalThis & { dcorMongo?: Promise<MongoClient>; dcorMongoKey?: string; dcorMongoRetryAt?: number };
function settings() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new DatabaseConfigurationError('missing_configuration');
  if (/YOUR_PASSWORD|<password>/i.test(uri) || !/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new DatabaseConfigurationError('invalid_configuration');
  let database: string;
  // WHATWG URL rejects valid standard MongoDB seed lists with multiple host:port pairs.
  try { database = process.env.MONGODB_DB?.trim() || decodeURIComponent(uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1] || ''); }
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
    cache.dcorMongo = undefined; cache.dcorMongoKey = key; cache.dcorMongoRetryAt = undefined;
  }
  if (!cache.dcorMongo) {
    const client = new MongoClient(uri, { maxPoolSize: 5, minPoolSize: 0, maxConnecting: 2, maxIdleTimeMS: 30000, waitQueueTimeoutMS: 5000, serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 15000 });
    const connection = client.connect();
    cache.dcorMongo = connection;
    connection.catch(error => {
      logDatabaseFailure('connect', error);
      void client.close().catch(() => {});
      // Share the same rejection briefly, so unrelated renderers cannot retry in a storm.
      if (cache.dcorMongo === connection) cache.dcorMongoRetryAt = Date.now() + 5000;
    });
  }
  if (cache.dcorMongoRetryAt && Date.now() >= cache.dcorMongoRetryAt) {
    cache.dcorMongo = undefined; cache.dcorMongoRetryAt = undefined;
    return mongoClient();
  }
  return cache.dcorMongo;
}
export async function mongoDatabase() {
  const { database } = settings();
  const client = await mongoClient();
  return client.db(database);
}
