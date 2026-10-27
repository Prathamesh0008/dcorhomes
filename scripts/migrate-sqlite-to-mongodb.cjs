throw Error('Legacy application persistence is retired. Use check:architecture for isolated authentication checks and content:export for read-only preservation.');
// Explicit CLI only. SQLite is never imported by deployed application code.
require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { DatabaseSync, backup } = require('node:sqlite');
const { isDeepStrictEqual } = require('node:util');
function argument(name) { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; }
const apply = process.argv.includes('--apply');
const report = { mode: apply ? 'apply-insert-only' : 'dry-run', inserted: 0, updated: 0, skipped: 0, failed: 0, wouldInsert: 0, sourceCounts: {}, tables: {}, relationshipsChecked: 0, issues: [], warnings: [], counters: { inserted: 0, skipped: 0 } };
let mongo;
(async () => {
  const supplied = argument('--source');
  if (!supplied) throw Error('Provide --source with the existing SQLite file. No runtime data directory is assumed.');
  const source = fs.realpathSync(path.resolve(supplied));
  if (!fs.statSync(source).isFile()) throw Error('Source is not a file.');
  const destination = path.resolve(argument('--backup-dir') || '.data/migration-backups');
  const privateRoot = path.resolve('public') + path.sep;
  if (destination === path.resolve('public') || destination.startsWith(privateRoot)) throw Error('Backups must be private, outside public.');
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  const snapshot = path.join(destination, `sqlite-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.sqlite`);
  const original = new DatabaseSync(source, { readOnly: true });
  try { await backup(original, snapshot); } finally { original.close(); }
  report.backup = snapshot;
  report.backupSha256 = crypto.createHash('sha256').update(fs.readFileSync(snapshot)).digest('hex');
  const sqlite = new DatabaseSync(snapshot, { readOnly: true });
  let sourceRows, counters;
  try {
    if (sqlite.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw Error('SQLite integrity check failed.');
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(item => item.name);
    for (const name of tables) { if (!/^[a-zA-Z0-9_]+$/.test(name)) throw Error('Unexpected table name.'); report.tables[name] = Number(sqlite.prepare(`SELECT COUNT(*) AS count FROM "${name}"`).get().count); }
    if (!tables.includes('records')) throw Error('Expected application records table not found. Authentication SQLite files require a separate reviewed identity migration.');
    sourceRows = sqlite.prepare('SELECT kind,id,owner,data,created FROM records').all();
    counters = tables.includes('limits') ? sqlite.prepare('SELECT key,count,expires FROM limits').all() : [];
    if (tables.some(name => ['user', 'users', 'account', 'session'].includes(name))) throw Error('Authentication tables detected. Refusing to copy or replace existing MongoDB identities/passwords.');
    if (tables.some(name => name.startsWith('swatch_'))) report.warnings.push('Derived swatch cache tables are not migrated; variants/facets derive from canonical fabric products.');
  } finally { sqlite.close(); }
  const { validateRecord, collectionFor, recordCollections } = require('../lib/server/record-schema.ts');
  const { validateFabricStructure, validateCategory } = require('../lib/server/fabric-records.ts');
  const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
  mongo = await mongoClient(); const db = await mongoDatabase(); await db.command({ ping: 1 });
  const records = [], keys = new Set();
  for (const item of sourceRows) {
    report.sourceCounts[item.kind] = (report.sourceCounts[item.kind] || 0) + 1;
    try {
      const record = validateRecord({ kind: item.kind, id: item.id, owner: item.owner, created: Number(item.created), payload: JSON.parse(item.data) });
      const key = JSON.stringify([record.kind, record.id]); if (keys.has(key)) throw Error('Duplicate stable key.'); keys.add(key);
      if (!recordCollections[record.kind] && record.kind !== 'admin-session') throw Error('Unknown record kind requires manual schema review.');
      if (record.kind === 'fabric-record') {
        validateFabricStructure(record.payload);
        const f = record.payload;
        if (!Array.isArray(f.colors) || typeof f.slug !== 'string' || f.slug !== record.id || !Array.isArray(f.images) || !f.name || !Array.isArray(f.usage)) throw Error('Invalid fabric schema.');
        if (new Set(f.colors.map(v => v.id)).size !== f.colors.length || f.colors.some(v => !v.id || !v.name || !v.colorCode)) throw Error('Invalid or duplicate variant references.');
      }
      if (record.kind === 'fabric-category') validateCategory(record.payload);
      records.push(record);
    } catch { report.failed++; report.issues.push({ kind: item.kind, id: item.id, problem: 'Invalid source record; manual review required.' }); }
  }
  const sourceIndex = new Map(records.map(record => [JSON.stringify([record.kind, record.id]), record]));
  for (const counter of counters) {
    if (typeof counter.key !== 'string' || !counter.key || !Number.isInteger(counter.count) || counter.count < 0 || !Number.isFinite(counter.expires)) {
      report.failed++; report.issues.push({ problem: 'Invalid legacy usage counter; manual review required.' });
    }
  }
  async function find(kind, id) { return sourceIndex.get(JSON.stringify([kind, id])) || await db.collection(collectionFor(kind)).findOne({ kind, id }); }
  const { fabrics } = require('../lib/curtains/manual-config.ts');
  const { libraryRecords } = require('../lib/manual-visualizer/library.ts');
  const seeds = new Map([...fabrics, ...libraryRecords].map(f => [f.id, f]));
  const { ObjectId } = require('mongodb');
  for (const record of records) {
    const p = record.payload;
    try {
      if (['manual-design', 'saved-fabric', 'account-enquiry'].includes(record.kind)) {
        if (!ObjectId.isValid(record.owner) || !await db.collection('users').findOne({ _id: new ObjectId(record.owner) }, { projection: { _id: 1 } })) throw Error('Unreconciled account owner.');
        report.relationshipsChecked++;
      }
      const selections = record.kind === 'manual-design' ? [p.design?.main, p.design?.sheer] : record.kind === 'saved-fabric' ? [p] : [];
      for (const selection of selections) {
        if (!selection?.fabricId) throw Error('Missing fabric reference.');
        const fabric = (await find('fabric-record', selection.fabricId))?.payload || seeds.get(selection.fabricId);
        if (!fabric || (selection.variantId && !fabric.colors?.some(v => v.id === selection.variantId))) throw Error('Unreconciled fabric/variant reference.');
        report.relationshipsChecked++;
      }
      if (record.kind === 'share') { const target = await find('design', p.designId); if (!target || target.owner !== record.owner) throw Error('Invalid share ownership.'); report.relationshipsChecked++; }
      if (record.kind === 'account-enquiry' && !await find('enquiry', record.id)) throw Error('Missing original enquiry.');
      if (record.kind === 'generation' && p.uploadId) { if (!await find('upload', p.uploadId)) throw Error('Missing upload metadata.'); report.relationshipsChecked++; }
    } catch { report.failed++; report.issues.push({ kind: record.kind, id: record.id, problem: 'Unresolved relationship; preserve and reconcile the original owner/reference before applying.' }); }
  }
  const canonical = value => ({ kind: value.kind, id: value.id, owner: value.owner, payload: value.payload, created: value.created });
  for (const record of records) {
    const prior = await db.collection(collectionFor(record.kind)).findOne({ kind: record.kind, id: record.id });
    if (!prior) report.wouldInsert++;
    else if (isDeepStrictEqual(canonical(prior), canonical(record))) report.skipped++;
    else { report.failed++; report.issues.push({ kind: record.kind, id: record.id, problem: 'Target differs. Existing MongoDB document will not be overwritten.' }); }
  }
  if (records.some(r => ['upload', 'generation', 'design', 'catalogue-image'].includes(r.kind))) report.warnings.push('Metadata migration does not migrate private asset bytes. Reconcile object storage separately before enabling dependent operations.');
  if (apply && report.failed === 0) {
    const repository = require('../lib/server/db.ts');
    await repository.initializeApplicationDatabase();
    const session = mongo.startSession();
    try { await session.withTransaction(async () => {
      report.inserted = 0; report.skipped = 0; report.counters = { inserted: 0, skipped: 0 };
      await db.collection('application_control').updateOne({ key: 'writes' }, { $inc: { revision: 1 } }, { session });
      for (const record of records) {
        const collection = db.collection(collectionFor(record.kind));
        const prior = await collection.findOne({ kind: record.kind, id: record.id }, { session });
        if (prior) { if (!isDeepStrictEqual(canonical(prior), canonical(record))) throw Error('Target changed during migration.'); report.skipped++; continue; }
        await collection.insertOne({ ...record }, { session }); report.inserted++;
      }
      for (const counter of counters) {
        if (!counter.key || !Number.isInteger(counter.count) || counter.count < 0 || !Number.isFinite(counter.expires)) throw Error('Invalid legacy usage counter.');
        if (counter.expires <= Date.now()) { report.counters.skipped++; continue; }
        const result = await db.collection('application_limits').updateOne({ key: counter.key }, { $setOnInsert: { count: counter.count, expiresAt: new Date(counter.expires) } }, { session, upsert: true });
        result.upsertedCount ? report.counters.inserted++ : report.counters.skipped++;
      }
    }); } finally { await session.endSession(); }
    for (const record of records) {
      const stored = await db.collection(collectionFor(record.kind)).findOne({ kind: record.kind, id: record.id });
      if (!stored || !isDeepStrictEqual(canonical(stored), canonical(record))) { report.failed++; report.issues.push({ kind: record.kind, id: record.id, problem: 'Post-migration equality check failed.' }); }
    }
    report.verifiedRecords = records.length - report.failed;
  }
  report.sourceRecords = sourceRows.length;
  report.sourceLimits = counters.length;
  report.completed = report.failed === 0;
  const output = path.resolve(argument('--report') || '.data/migration-report.json');
  if (output === path.resolve('public') || output.startsWith(privateRoot)) throw Error('Migration report must remain private.');
  fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 }); fs.writeFileSync(output, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ mode: report.mode, sourceRecords: report.sourceRecords, sourceCounts: report.sourceCounts, inserted: report.inserted, updated: report.updated, skipped: report.skipped, wouldInsert: report.wouldInsert, failed: report.failed, relationshipsChecked: report.relationshipsChecked, sourceLimits: report.sourceLimits, backupCreated: true, reportSaved: true }));
  if (report.failed) process.exitCode = 1;
})().catch(() => { console.error('Migration stopped safely. Check the private report/configuration; no credentials or source payloads are printed.'); process.exitCode = 1; }).finally(async () => { if (mongo) await mongo.close(); });
