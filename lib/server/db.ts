import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { MongoError } from 'mongodb';
import { DatabaseConfigurationError, logDatabaseFailure } from './database-diagnostics';
import type { ClientSession } from 'mongodb';
import { mongoClient, mongoConfigured, mongoDatabase } from './mongodb';
import { collectionFor, recordCollections, validateRecord, type StoredRecord } from './record-schema';
export type RecordRow = { kind: string; id: string; owner: string; data: string; created: number };
export class DatabaseUnavailable extends Error {
  constructor(cause?: unknown) { super('Application database temporarily unavailable.'); this.cause = cause; }
  readonly cause: unknown;
}
const context = new AsyncLocalStorage<ClientSession>();
let initialization: Promise<void> | undefined;
export function databaseReady() { return mongoConfigured(); }
async function database() {
  return mongoDatabase();
}
const options = () => context.getStore() ? { session: context.getStore() } : {};
const asRow = (record: StoredRecord): RecordRow => ({ kind: record.kind, id: record.id, owner: record.owner, data: JSON.stringify(record.payload), created: record.created });
async function initializeApplicationDatabaseInternal() {
  if (!initialization) initialization = (async () => {
    const db = await database();
    for (const name of new Set([...Object.values(recordCollections), 'application_records'])) {
      const collection = db.collection<StoredRecord>(name);
      await collection.createIndex({ kind: 1, id: 1 }, { unique: true });
      await collection.createIndex({ kind: 1, owner: 1, created: -1 });
      await collection.createIndex({ kind: 1, created: 1 });
    }
    await db.collection('fabric_products').createIndex({ 'payload.colors.id': 1 });
    await db.collection('fabric_products').createIndex({ 'payload.colors.variantSku': 1 });
    await db.collection('fabric_products').createIndex({ 'payload.categoryId': 1, 'payload.active': 1 });
    await db.collection('application_limits').createIndex({ key: 1 }, { unique: true });
    await db.collection('application_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('application_control').createIndex({ key: 1 }, { unique: true });
    try { await db.collection('application_control').updateOne({ key: 'writes' }, { $setOnInsert: { revision: 0 } }, { upsert: true }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  })().catch(error => { initialization = undefined; throw error; });
  await initialization;
}
async function transactionInternal<T>(action: () => Promise<T>): Promise<T> {
  if (context.getStore()) return action();
  await initializeApplicationDatabase();
  const client = await mongoClient(), db = await database(), session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      // Preserve the former serialized admission/quota/read-before-write guarantees.
      await db.collection('application_control').updateOne({ key: 'writes' }, { $inc: { revision: 1 } }, { session });
      return context.run(session, action);
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
}
async function allRecordsInternal(kind: string, owner?: string): Promise<RecordRow[]> {
  const db = await database();
  const records = await db.collection<StoredRecord>(collectionFor(kind)).find({ kind, ...(owner === undefined ? {} : { owner }) }, options()).sort({ created: -1, id: 1 }).toArray();
  return records.map(asRow);
}
async function rowsInternal(kind: string, owner?: string): Promise<RecordRow[]> {
  const db = await database();
  return (await db.collection<StoredRecord>(collectionFor(kind)).find({ kind, ...(owner === undefined ? {} : { owner }) }, options()).sort({ created: -1, id: 1 }).limit(owner === undefined ? 200 : 100).toArray()).map(asRow);
}
async function rowInternal(kind: string, id: string): Promise<RecordRow | undefined> {
  const item = await (await database()).collection<StoredRecord>(collectionFor(kind)).findOne({ kind, id }, options());
  return item ? asRow(item) : undefined;
}
async function expiredRowsInternal(kind: string, before: number): Promise<RecordRow[]> {
  if (!Number.isFinite(before)) throw Error('Invalid expiry.');
  return (await (await database()).collection<StoredRecord>(collectionFor(kind)).find({ kind, created: { $lt: before } }, options()).sort({ created: 1 }).limit(200).toArray()).map(asRow);
}
async function putInternal(kind: string, id: string, owner: string, data: unknown) {
  const record = validateRecord({ kind, id, owner, payload: JSON.parse(JSON.stringify(data)), created: Date.now() });
  if (!context.getStore()) await initializeApplicationDatabase();
  await (await database()).collection<StoredRecord>(collectionFor(kind)).updateOne({ kind, id }, { $set: { payload: record.payload }, $setOnInsert: { kind, id, owner, created: record.created } }, { ...options(), upsert: true });
}
async function removeInternal(kind: string, id: string) {
  await (await database()).collection<StoredRecord>(collectionFor(kind)).deleteOne({ kind, id }, options());
}
async function consumeInternal(key: string, limit: number, windowMs: number) {
  if (!key || !Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1) throw Error('Usage is unavailable.');
  if (!context.getStore()) await initializeApplicationDatabase();
  const collection = (await database()).collection('application_limits'), now = new Date();
  await collection.updateOne({ key, expiresAt: { $lte: now } }, { $set: { count: 0, expiresAt: new Date(Date.now() + windowMs) } }, options());
  try { await collection.updateOne({ key }, { $setOnInsert: { count: 0, expiresAt: new Date(Date.now() + windowMs) } }, { ...options(), upsert: true }); }
  catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  if (!await collection.findOneAndUpdate({ key, count: { $lt: limit } }, { $inc: { count: 1 } }, { ...options(), returnDocument: 'after' })) throw Error('Request limit reached. Please try again later.');
}

async function operation<T>(name: string, action: () => Promise<T>): Promise<T> {
  try { return await action(); } catch (error) {
    // Let the driver see original transient errors while inside withTransaction.
    if (context.getStore() || error instanceof DatabaseUnavailable) throw error;
    if (!(error instanceof MongoError) && !(error instanceof DatabaseConfigurationError)) throw error;
    logDatabaseFailure(name, error);
    throw new DatabaseUnavailable(error);
  }
}
export const initializeApplicationDatabase: typeof initializeApplicationDatabaseInternal = (...args) => operation('initializeApplicationDatabase', () => initializeApplicationDatabaseInternal(...args));
export function transaction<T>(action: () => Promise<T>): Promise<T> { return operation('transaction', () => transactionInternal(action)); }
export const allRecords: typeof allRecordsInternal = (...args) => operation('allRecords', () => allRecordsInternal(...args));
export const rows: typeof rowsInternal = (...args) => operation('rows', () => rowsInternal(...args));
export const row: typeof rowInternal = (...args) => operation('row', () => rowInternal(...args));
export const expiredRows: typeof expiredRowsInternal = (...args) => operation('expiredRows', () => expiredRowsInternal(...args));
export const put: typeof putInternal = (...args) => operation('put', () => putInternal(...args));
export const remove: typeof removeInternal = (...args) => operation('remove', () => removeInternal(...args));
export const consume: typeof consumeInternal = (...args) => operation('consume', () => consumeInternal(...args));
