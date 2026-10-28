// Disposable replica set only; never loads .env.local or touches existing users.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
require('./auth-loader.cjs');
let repl, client, server;
(async () => {
  repl = await MongoMemoryReplSet.create({ binary: { version: '7.0.24', downloadDir: require('node:path').resolve('.test-data/mongodb-binaries') }, replSet: { count: 1 } });
  Object.assign(process.env, { MONGODB_URI: repl.getUri(), MONGODB_DB: 'admin_recovery_check', SITE_URL: 'http://localhost:3357', BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('hex'), NODE_ENV: 'test' });
  const { mongoClient, mongoDatabase } = require('../lib/server/mongodb.ts');
  client = await mongoClient(); const db = await mongoDatabase();
  const { provisionMember, resetLocalAdminPassword } = require('../lib/server/members.ts');
  const { customerAuth, runMemberLogin, validatedCustomerSession } = require('../lib/server/customer-auth.ts');
  const oldPassword = crypto.randomBytes(24).toString('base64url'), newPassword = crypto.randomBytes(24).toString('base64url');
  const admin = await provisionMember(null, { userId: 'recovery-admin', fullName: 'Recovery test', email: 'recovery@example.invalid' }, oldPassword);
  const auth = await customerAuth();
  const login = password => runMemberLogin('recovery-admin', () => auth.handler(new Request(process.env.SITE_URL + '/api/auth/sign-in/username', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: process.env.SITE_URL }, body: JSON.stringify({ username: 'recovery-admin', password }) })));
  const headers = response => new Headers({ cookie: response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') });
  const before = await login(oldPassword); assert.equal(before.status, 200);
  const oldHeaders = headers(before); assert.ok(await validatedCustomerSession(oldHeaders));
  await resetLocalAdminPassword(admin.id, 1, newPassword);
  assert.equal(await validatedCustomerSession(oldHeaders), null);
  assert.equal((await login(oldPassword)).status, 401);
  const after = await login(newPassword); assert.equal(after.status, 200);
  const newHeaders = headers(after);
  for (let i = 0; i < 2; i++) { const state = await validatedCustomerSession(newHeaders); assert.equal(state.user.role, 'admin'); assert.equal(state.user.mustChangePassword, false); }
  await assert.rejects(() => resetLocalAdminPassword(admin.id, 1, oldPassword), /Administrator changed/);
  const out = await auth.handler(new Request(process.env.SITE_URL + '/api/auth/sign-out', { method: 'POST', headers: new Headers({ ...Object.fromEntries(newHeaders), Origin: process.env.SITE_URL, 'Content-Type': 'application/json' }), body: '{}' }));
  assert.equal(out.status, 200); assert.equal(await validatedCustomerSession(newHeaders), null);
  assert.equal(await db.collection('users').countDocuments(), 1); assert.equal(await db.collection('accounts').countDocuments(), 1);
  console.log('PASS: local reset, old password rejection, new admin login, session persistence/revocation, logout, stale reset refusal and preserved user/credential records.');
  if (process.argv.includes('--http')) {
    server = require('node:child_process').spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3357'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production', ALLOW_LOCAL_HTTP: 'true' } });
    let ready = false; server.stdout.on('data', b => { if (b.toString().includes('Ready in')) ready = true; }); server.stderr.on('data', () => {});
    for (let i = 0; i < 120 && !ready; i++) { if (server.exitCode !== null) throw Error('Server exited'); await new Promise(r => setTimeout(r, 250)); }
    assert.ok(ready);
    const api = (route, method = 'GET', body, cookie = '') => fetch(process.env.SITE_URL + route, { method, redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Origin: process.env.SITE_URL, cookie, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const response = await api('/api/auth/sign-in/username', 'POST', { username: 'recovery-admin', password: newPassword }); assert.equal(response.status, 200);
    const cookie = response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    for (let i = 0; i < 2; i++) {
      for (const route of ['/account', '/admin/users']) assert.equal((await api(route, 'GET', undefined, cookie)).status, 200);
      assert.equal((await (await api('/api/auth/get-session', 'GET', undefined, cookie)).json()).user.role, 'admin');
    }
    assert.equal((await api('/api/auth/sign-out', 'POST', {}, cookie)).status, 200);
    assert.equal(await (await api('/api/auth/get-session', 'GET', undefined, cookie)).json(), null);
    for (const route of ['/account', '/admin/users']) assert.equal((await api(route, 'GET', undefined, cookie)).headers.get('location'), '/login');
    for (const route of ['/api/auth/sign-up/email', '/api/auth/request-password-reset']) assert.equal((await api(route, 'POST', {})).status, 403);
    console.log('PASS: production HTTP login, /account and /admin/users, repeated session reads, logout, protected redirects and blocked signup/reset endpoints.');
  }
})().catch(() => { console.error('FAIL: isolated administrator recovery check. No secrets printed.'); process.exitCode = 1; }).finally(async () => { if (server && server.exitCode === null) { const stopped = new Promise(r => server.once('exit', r)); server.kill(); await stopped; } if (client) await client.close(); if (repl) await repl.stop(); });
