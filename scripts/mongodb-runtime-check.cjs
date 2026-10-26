// All writes are restricted to an ephemeral localhost replica set, never .env.local.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve('.test-data/mongodb-binaries');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const fixtureRoot = path.resolve('.test-data/mongo-runtime-' + crypto.randomBytes(6).toString('hex'));
let repl, server, mongo, stage = 'starting isolated MongoDB';
const results = [];
function pass(name) { results.push(name); console.log('PASS: ' + name); }
async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGINT'); await stopped; server = undefined;
}
(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' }, binary: { version: '7.0.24' } });
  const uri = repl.getUri('dcorhome_check');
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:/, 'Refuse any nonlocal test database.');
  Object.assign(process.env, { MONGODB_URI: uri, MONGODB_DB: 'dcorhome_check', SITE_URL: 'http://localhost:3349', SESSION_SECRET: crypto.randomBytes(32).toString('hex'), BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('hex'), VERCEL: '1', ALLOW_LOCAL_HTTP: 'true', DCORHOME_DATA_DIR: path.join(fixtureRoot, 'must-not-create'), DCORHOME_AI_ENABLED: 'false', OPENAI_API_KEY: '', RESEND_API_KEY: '', ENQUIRY_FROM_EMAIL: '', S3_ENDPOINT: '', S3_BUCKET: '', S3_ACCESS_KEY_ID: '', S3_SECRET_ACCESS_KEY: '', TRUST_PROXY: 'false' });
  require('./auth-loader.cjs');
  const diagnostics = require('../lib/server/database-diagnostics.ts');
  for (const [error, expected] of [[new diagnostics.DatabaseConfigurationError('missing_configuration'), 'missing_configuration'], [new diagnostics.DatabaseConfigurationError('invalid_configuration'), 'invalid_configuration'], [{code:18}, 'authentication'], [{code:13}, 'permission'], [{name:'MongoServerSelectionError'}, 'network_timeout'], [{code:2}, 'query']]) assert.equal(diagnostics.databaseFailure(error), expected);
  const originalConsole = console.error, logs = []; console.error = value => logs.push(value);
  try { diagnostics.logDatabaseFailure('fixture', {code:18, message:'PRIVATE_SENTINEL', stack:'PRIVATE_SENTINEL'}); } finally { console.error = originalConsole; }
  assert.ok(!logs.join('').includes('PRIVATE_SENTINEL')); pass('Database failure categories and redacted structured diagnostics');
  const repository = require('../lib/server/db.ts');
  const connection = require('../lib/server/mongodb.ts'); mongo = await connection.mongoClient(); const db = await connection.mongoDatabase();
  stage = 'repository guarantees';
  await repository.put('content', 'stable-record', 'original-owner', { title: 'Original' });
  const original = await repository.row('content', 'stable-record');
  await repository.put('content', 'stable-record', 'different-owner', { title: 'Updated' });
  const updated = await repository.row('content', 'stable-record'); assert.equal(updated.owner, original.owner); assert.equal(updated.created, original.created); assert.equal(JSON.parse(updated.data).title, 'Updated');
  await assert.rejects(() => repository.transaction(async () => { await repository.put('enquiry', 'rolled-back', 'guest', { name: 'Not committed' }); throw Error('rollback'); }));
  assert.equal(await repository.row('enquiry', 'rolled-back'), undefined);
  await repository.transaction(async () => { await repository.put('enquiry', 'nested', 'guest', { name: 'Nested' }); await repository.transaction(async () => { assert.ok(await repository.row('enquiry', 'nested')); }); });
  const limits = await Promise.allSettled(Array.from({ length: 8 }, () => repository.consume('fixture-quota', 3, 60000))); assert.equal(limits.filter(r => r.status === 'fulfilled').length, 3);
  pass('MongoDB record round trip, immutable ownership/timestamp, transaction rollback/nesting and atomic quotas');
  const { provisionMember } = require('../lib/server/members.ts');
  const adminPassword = crypto.randomBytes(24).toString('base64url');
  const admin = await provisionMember(null, { userId: 'fixture-admin', fullName: 'Isolated fixture administrator' }, adminPassword);
  stage = 'SQLite migration fixtures';
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const sqlitePath = path.join(fixtureRoot, 'source.sqlite'); const { DatabaseSync } = require('node:sqlite');
  const sqlite = new DatabaseSync(sqlitePath); sqlite.exec('CREATE TABLE records(kind TEXT,id TEXT,owner TEXT,data TEXT,created REAL,PRIMARY KEY(kind,id));CREATE TABLE limits(key TEXT PRIMARY KEY,count INTEGER,expires REAL)');
  const product = structuredClone(require('../lib/curtains/manual-config.ts').fabrics[0]); product.id = product.slug = 'fixture-product'; product.name = 'Isolated fixture fabric';
  const manual = require('../lib/manual-visualizer/model.ts').defaultDesign;
  const source = [ ['fabric-record', product.id, 'admin', product], ['enquiry', 'fixture-migrated-enquiry', 'guest-owner', { name: 'Fixture', message: 'Migration reference retained' }], ['manual-design', 'fixture-migrated-design', admin.id, { design: manual }] ];
  for (const [kind,id,owner,data] of source) sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(kind,id,owner,JSON.stringify(data),1000);
  sqlite.prepare('INSERT INTO limits VALUES(?,?,?)').run('migrated-counter',1,Date.now()+60000); sqlite.close();
  function migrate(apply) { const result = spawnSync(process.execPath, ['scripts/migrate-sqlite-to-mongodb.cjs', '--source', sqlitePath, '--backup-dir', path.join(fixtureRoot,'backups'), '--report', path.join(fixtureRoot,'report.json'), apply ? '--apply' : '--dry-run'], { env: process.env, encoding: 'utf8', windowsHide: true }); return { code: result.status, report: JSON.parse(fs.readFileSync(path.join(fixtureRoot,'report.json'),'utf8')) }; }
  let migration = migrate(false); assert.equal(migration.code,0); assert.equal(migration.report.wouldInsert,3); assert.equal(await repository.row('fabric-record',product.id),undefined); assert.ok(fs.existsSync(migration.report.backup));
  migration = migrate(true); assert.equal(migration.code,0); assert.equal(migration.report.inserted,3); assert.equal(migration.report.verifiedRecords,3);
  migration = migrate(true); assert.equal(migration.code,0); assert.equal(migration.report.inserted,0); assert.equal(migration.report.skipped,3);
  await repository.put('enquiry','fixture-migrated-enquiry','guest-owner',{name:'Target change must survive'});
  migration = migrate(true); assert.equal(migration.code,1); assert.ok(migration.report.failed); assert.equal(JSON.parse((await repository.row('enquiry','fixture-migrated-enquiry')).data).name,'Target change must survive');
  pass('SQLite backup/dry run, stable IDs/owners/variants, relationship checks, insert-only migration, idempotence and conflict refusal');
  const base = process.env.SITE_URL;
  let serverLogs = '';
  async function startServer() {
    serverLogs = '';
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3349'], { env: process.env, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
    for (const stream of [server.stdout,server.stderr]) stream.on('data', chunk => { serverLogs = (serverLogs + chunk).slice(-4000); });
    for (let i=0;i<90;i++) { if (server.exitCode !== null) throw Error('Server exited.'); try { const response=await fetch(base+'/login',{signal:AbortSignal.timeout(3000)}); if(response.status===200)return; } catch {} await new Promise(resolve=>setTimeout(resolve,500)); }
    throw Error('Server did not start.');
  }
  async function api(endpoint,method='GET',body,cookie='') { return fetch(base+endpoint,{method,redirect:'manual',signal:AbortSignal.timeout(30000),headers:{Origin:base,'Content-Type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})}); }
  const cookieOf = response => response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
  // The local harness owns the output while its VERCEL=1 server skips checkout locks.
  require('./next-output-lock.cjs').acquireNextOutput('.next');
  stage = 'production-mode route smoke'; await startServer();
  for (const route of ['/','/collections','/collections/fixture-product','/studio','/measure','/about','/contact','/inspiration','/login']) assert.equal((await api(route)).status,200,route);
  assert.equal((await api('/account')).status,307); assert.equal((await api('/admin/users')).status,307);
  const swatches = await (await api('/api/fabrics?q=Isolated%20fixture')).json(); assert.ok(swatches.items.some(item=>item.fabric.id===product.id)); assert.equal(swatches.storage,'database'); assert.ok(swatches.items[0].variant.id);
  assert.equal((await api('/api/visualizer/generate')).status,200); const ready=await(await api('/api/visualizer/generate')).json();assert.equal(ready.configured,false);assert.equal(ready.uploadConfigured,false);
  pass('Public routes, MongoDB-backed product details/swatches/search, private redirects and disabled AI/private-storage readiness');
  stage = 'authentication and account persistence';
  const login = (username,password)=>api('/api/auth/sign-in/username','POST',{username,password});
  const signedIn = await login('fixture-admin',adminPassword); assert.equal(signedIn.status,200); const adminCookie=cookieOf(signedIn); assert.ok(signedIn.headers.getSetCookie().some(value=>/HttpOnly/i.test(value)&&/Secure/i.test(value)));
  assert.equal((await api('/admin/users','GET',undefined,adminCookie)).status,200);
  const created = await api('/api/admin/users','POST',{userId:'fixture-member',fullName:'Isolated fixture member'},adminCookie); assert.equal(created.status,201); const user=await created.json();
  const temp = await login('fixture-member',user.temporaryPassword); assert.equal(temp.status,200); const temporaryCookie=cookieOf(temp),password=crypto.randomBytes(24).toString('base64url');
  assert.equal((await api('/api/account/password','POST',{currentPassword:user.temporaryPassword,newPassword:password},temporaryCookie)).status,200);
  const userLogin=await login('FIXTURE-MEMBER',password);assert.equal(userLogin.status,200);const userCookie=cookieOf(userLogin);
  assert.equal((await api('/admin/users','GET',undefined,userCookie)).status,404);
  assert.equal((await api('/api/admin/users','POST',{userId:'forbidden'},userCookie)).status,403);
  assert.equal((await login('fixture-member','incorrect')).status,401);assert.equal((await login('unknown-member',password)).status,401);
  assert.equal((await api('/api/auth/sign-up/email','POST',{})).status,403);
  const save=await api('/api/manual-designs','POST',{design:manual},userCookie);assert.equal(save.status,201);const designId=(await save.json()).id;
  assert.equal((await api('/api/manual-designs','DELETE',{id:designId},adminCookie)).status,404);
  const enquiry=await api('/api/enquiries','POST',{name:'Isolated fixture',email:'fixture@example.invalid',message:'Persist this local test only',consent:true},userCookie);assert.equal(enquiry.status,200);const enquiryId=(await enquiry.json()).id;assert.ok(await repository.row('enquiry',enquiryId));assert.ok(await repository.row('account-enquiry',enquiryId));
  pass('Admin and member credentials, first-login change, role/ownership checks, enquiries and saved designs persisted to MongoDB');
  stage = 'restart durability';await stopServer();await startServer();
  const saved=await(await api('/api/manual-designs','GET',undefined,userCookie)).json();assert.ok(saved.designs.some(item=>item.id===designId));assert.equal((await api('/account','GET',undefined,userCookie)).status,200);
  assert.ok(await repository.row('enquiry',enquiryId));
  assert.equal((await api('/api/admin/users/'+user.id,'PATCH',{action:'disable'},adminCookie)).status,200);
  assert.equal(await(await api('/api/auth/get-session','GET',undefined,userCookie)).json(),null);assert.equal((await login('fixture-member',password)).status,401);
  assert.equal((await api('/api/auth/sign-out','POST',{},adminCookie)).status,200);assert.equal(await(await api('/api/auth/get-session','GET',undefined,adminCookie)).json(),null);
  assert.equal(fs.existsSync(process.env.DCORHOME_DATA_DIR),false);
  pass('Server restart preserves records/sessions, disabling revokes access, logout works, no local data directory created under VERCEL=1');
  stage='missing configuration'; const configured=process.env.MONGODB_URI;delete process.env.MONGODB_URI;assert.equal(repository.databaseReady(),false);await assert.rejects(()=>repository.row('content','x'),error => error instanceof repository.DatabaseUnavailable && error.cause instanceof diagnostics.DatabaseConfigurationError);
  await stopServer(); process.env.MONGODB_URI=''; await startServer();
  const unavailable=await api('/api/catalogue');assert.equal(unavailable.status,503);assert.match((await unavailable.json()).error,/database.*unavailable/i);
  assert.equal((await api('/login')).status,200);assert.equal((await api('/contact')).status,200);
  process.env.MONGODB_URI=configured;
  const homeOutage = await api('/'); assert.equal(homeOutage.status, 200); const homeHtml = await homeOutage.text(); assert.ok(homeHtml.includes('Your room.')); assert.ok(!homeHtml.includes('Fabric categories are temporarily unavailable'));
  const collectionsOutage = await api('/collections'); assert.ok(collectionsOutage.status >= 500, 'Database-dependent catalogue must not pretend success.');
  pass('Missing MongoDB fails explicitly rather than switching to SQLite or an empty success');
  fs.writeFileSync(path.join(fixtureRoot,'results.json'),JSON.stringify({passed:results,isolated:true,productionDatabaseModified:false},null,2));
  console.log('All targeted checks passed against ephemeral localhost MongoDB only.');
})().catch(()=>{console.error('FAIL at stage: '+stage+'. No credentials or response bodies printed.');process.exitCode=1;}).finally(async()=>{await stopServer();if(mongo)await mongo.close();if(repl)await repl.stop();});
