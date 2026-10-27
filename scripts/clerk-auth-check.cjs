// Negative/policy checks only. This script cannot claim provider-backed sign-in success.
const assert = require('node:assert/strict'), { spawn } = require('node:child_process');
const crypto = require('node:crypto');
require('./auth-loader.cjs');
const { authProvider, clerkConfigured } = require('../lib/auth-provider.ts');
const { clerkAccountRole } = require('../lib/server/clerk-policy.ts');
process.env.AUTH_PROVIDER = 'clerk';
process.env.CLERK_SECRET_KEY = ''; process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = '';
assert.equal(authProvider(), 'clerk'); assert.equal(clerkConfigured(), false);
const approved = { username: 'policy-only', publicMetadata: { dcorhomeAccess: 'approved', role: 'USER' } };
assert.equal(clerkAccountRole(approved), 'user');
assert.equal(clerkAccountRole({ ...approved, publicMetadata: { dcorhomeAccess: 'approved', role: 'ADMIN' } }), 'admin');
for (const user of [{ ...approved, banned: true }, { ...approved, locked: true }, { ...approved, username: null }, { ...approved, publicMetadata: {} }, { ...approved, publicMetadata: { role: 'ADMIN' }, unsafeMetadata: { dcorhomeAccess: 'approved', role: 'ADMIN' } }]) assert.equal(clerkAccountRole(user), null);
process.env.AUTH_PROVIDER = 'unrecognized'; assert.throws(authProvider); process.env.AUTH_PROVIDER = 'clerk';
const { MongoClient } = require('mongodb');
MongoClient.prototype.connect = async () => { throw Error('FORBIDDEN_MONGODB_CONNECT'); };
let server, logs = '';
const base = 'http://localhost:3353';
(async () => {
  const { NextRequest } = require('next/server');
  const route = require('../app/api/auth/[...all]/route.ts');
  for (const endpoint of ['/sign-in/username', '/get-session', '/sign-up/email', '/sign-out']) {
    const response = await route.POST(new NextRequest(base + '/api/auth' + endpoint, { method: 'POST', headers: { cookie: 'better-auth.session_token=legacy-cookie' } }));
    assert.equal(response.status, 410);
  }
  const { customerAuthReady, customerSession } = require('../lib/server/customer-auth.ts');
  assert.equal(customerAuthReady(), false); assert.equal(await customerSession(), null);
  const members = require('../lib/server/members.ts');
  await assert.rejects(() => members.memberIndexes(), error => error.status === 410);
  const admin = require('../app/api/admin/users/route.ts');
  assert.equal((await admin.GET()).status, 503);
  assert.equal((await admin.POST(new NextRequest(base + '/api/admin/users', { method: 'POST' }))).status, 503);
  console.log('PASS: Synthetic role/approval/ban policy; legacy routes/cookies and write helpers disabled; unconfigured administration fails closed. No provider login claimed.');
  require('./next-output-lock.cjs').acquireNextOutput('.next');
  const env = { ...process.env, VERCEL: '1', SITE_URL: base, CLERK_SECRET_KEY: '', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', MONGODB_URI: 'mongodb://127.0.0.1:1/no_auth_database', BETTER_AUTH_SECRET: '', SESSION_SECRET: crypto.randomBytes(32).toString('hex'), NODE_OPTIONS: '--require=./scripts/forbid-mongodb-preload.cjs', DCORHOME_TEST_FORBID_MONGO: 'true' };
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3353'], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', bytes => { logs += bytes.toString(); });
  for (let i = 0; i < 120 && !logs.includes('Ready in'); i++) { assert.equal(server.exitCode, null); await new Promise(resolve => setTimeout(resolve, 250)); }
  assert.ok(logs.includes('Ready in'));
  const get = path => fetch(base + path, { redirect: 'manual', headers: { cookie: 'better-auth.session_token=legacy-cookie' }, signal: AbortSignal.timeout(15000) });
  for (const path of ['/', '/collections', '/studio', '/measure', '/about', '/contact', '/inspiration', '/faq', '/designs', '/sitemap.xml', '/robots.txt']) assert.equal((await get(path)).status, 200, path);
  const login = await get('/login'); assert.equal(login.status, 200); assert.ok((await login.text()).includes('Sign-in is temporarily unavailable'));
  for (const path of ['/account', '/admin/users', '/api/admin/users']) assert.equal((await get(path)).status, 503, path);
  assert.equal((await get('/api/auth/get-session')).status, 410);
  assert.ok(!logs.includes('FORBIDDEN_MONGODB_CONNECT'));
  console.log('PASS: Clerk-mode unconfigured build keeps public routes available, ignores legacy sessions, makes zero MongoDB connections and denies private access. Real Clerk sign-in remains NOT TESTED.');
})().catch(() => { console.error('FAIL: Clerk staging/policy check. No provider credentials or response bodies printed.'); process.exitCode = 1; }).finally(async () => {
  if (server && server.exitCode === null) { const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGINT'); await stopped; }
});
