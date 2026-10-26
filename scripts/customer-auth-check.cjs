const assert = require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
const ownedFixtures = [];
const ownedDesignFixtures = [];
const fixtureMode = process.argv.includes('--fixture');
(async () => {
  const { normalizeUserId, validUserId, passwordProblem, activeSession } = require('../lib/server/member-policy.ts');
  const { hashPassword, verifyPassword } = await import('better-auth/crypto');
  assert.equal(normalizeUserId('  Owner.ID '), 'owner.id');
  assert.ok(validUserId('Member_123')); assert.ok(validUserId('dcorhome-admin')); assert.ok(validUserId('dcorhome-test01')); assert.equal(validUserId('../member'), false);
  assert.ok(passwordProblem('password123456')); assert.ok(passwordProblem('tiny'));
  const password = require('node:crypto').randomBytes(24).toString('base64url');
  assert.equal(passwordProblem(password), null);
  const hash = await hashPassword(password); assert.notEqual(hash, password);
  assert.ok(await verifyPassword({ hash, password })); assert.equal(await verifyPassword({ hash, password: 'incorrect-credential' }), false);
  assert.ok(activeSession({ status: 'active', sessionVersion: 2 }, 2));
  assert.equal(activeSession({ status: 'disabled', sessionVersion: 2 }, 2), false);
  assert.equal(activeSession({ status: 'active', sessionVersion: 3 }, 2), false);
  const { NextRequest } = require('next/server');
  const route = require('../app/api/auth/[...all]/route.ts');
  const signup = await route.POST(new NextRequest('http://localhost:3000/api/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ email: 'nobody@example.invalid', password }) }));
  assert.equal(signup.status, 403);
  console.log('VERIFIED WORKING: User ID normalization, password validation, real Better Auth scrypt hash/verification, status/version policy, server-side signup denial.');
  if (!process.argv.includes('--database')) {
    console.log('IMPLEMENTED, NOT VERIFIED: MongoDB credential/session/admin workflows. Run auth:check -- --database ADMIN_USER_ID after configuring MongoDB and starting the app.');
    return;
  }
  const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
  const { hiddenPassword } = require('./member-prompt.cjs');
  let adminId = process.argv[process.argv.indexOf('--database') + 1];
  if (!fixtureMode && !adminId) throw Error('Supply the existing administrator User ID after --database.');
  const db = await mongoDatabase(); await db.command({ ping: 1 });
  let fixturePassword;
  if (fixtureMode) {
    assert.equal(await db.collection('users').countDocuments({ role: 'admin' }), 0, 'Fixture bootstrap testing requires no pre-existing administrator.');
    adminId = 'checkadmin_' + require('node:crypto').randomBytes(6).toString('hex');
    fixturePassword = require('node:crypto').randomBytes(24).toString('base64url');
    const { provisionMember } = require('../lib/server/members.ts');
    const fixtureAdmin = await provisionMember(null, { userId: adminId, fullName: 'Authentication bootstrap fixture' }, fixturePassword);
    ownedFixtures.push({ id: fixtureAdmin.id, userId: adminId });
    await assert.rejects(() => provisionMember(null, { userId: 'duplicate_' + adminId.slice(-12), fullName: 'Duplicate bootstrap fixture' }, fixturePassword), /already exists/);
    console.log('VERIFIED WORKING: transactional first-admin provisioning and duplicate-bootstrap refusal.');
  }
  const base = process.env.SITE_URL; if (!base) throw Error('SITE_URL required.');
  async function api(endpoint, method = 'GET', body, cookie = '') {
    const response = await fetch(base + endpoint, { method, signal: AbortSignal.timeout(45000), redirect: 'manual', headers: { Origin: base, 'Content-Type': 'application/json', cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    console.log('HTTP sanity: ' + method + ' ' + endpoint.replace(/\/[a-f0-9]{24}/g, '/:id') + ' ' + response.status); return response;
  }
  const cookieOf = response => response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const login = (username, password) => api('/api/auth/sign-in/username', 'POST', { username, password });
  const adminLogin = await login(adminId, fixturePassword || await hiddenPassword('Existing administrator password (not displayed): '));
  assert.equal(adminLogin.status, 200, 'Administrator credentials must work before testing.');
  const adminCookie = cookieOf(adminLogin); assert.match(adminCookie, /session_token/);
  assert.ok(adminLogin.headers.getSetCookie().some(value => /HttpOnly/i.test(value)));
  const csrf = await fetch(base + '/api/admin/users', { method: 'POST', headers: { Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json', cookie: adminCookie }, body: JSON.stringify({ userId: 'forbidden', role: 'admin' }) });
  assert.equal(csrf.status, 403, 'Administrative mutation must reject a foreign origin.');
  const uid = 'check_' + require('node:crypto').randomBytes(8).toString('hex');
  const create = await api('/api/admin/users', 'POST', { fullName: 'Authentication sanity fixture', userId: uid, role: 'user' }, adminCookie);
  assert.equal(create.status, 201); const created = await create.json();
  if (fixtureMode) ownedFixtures.push({ id: created.id, userId: uid });
  const { ObjectId } = require('mongodb'); const id = new ObjectId(created.id);
  const fixture = await db.collection('users').findOne({ _id: id, userId: uid }); assert.ok(fixture);
  try {
    if (fixtureMode) {
      const finalAdminDisable = await api('/api/admin/users/' + ownedFixtures[0].id, 'PATCH', { action: 'disable' }, adminCookie);
      assert.equal(finalAdminDisable.status, 409, 'Final active administrator must be protected.');
    }
    const credential = await db.collection('accounts').findOne({ userId: id, providerId: 'credential' });
    assert.notEqual(credential.password, created.temporaryPassword); assert.ok(await verifyPassword({ hash: credential.password, password: created.temporaryPassword }));
    assert.equal((await login('unknown_' + uid, password)).status, 401);
    assert.equal((await login(uid, 'incorrect-password')).status, 401);
    const first = await login(uid.toUpperCase(), created.temporaryPassword); assert.equal(first.status, 200); const firstCookie = cookieOf(first);
    assert.equal((await api('/api/admin/users', 'GET', undefined, firstCookie)).status, 401);
    const firstAccount = await api('/account', 'GET', undefined, firstCookie); assert.ok((firstAccount.headers.get('location') || '').endsWith('/account/change-password'));
    const updated = await api('/api/account/password', 'POST', { currentPassword: created.temporaryPassword, newPassword: password }, firstCookie); assert.equal(updated.status, 200);
    assert.equal(await (await api('/api/auth/get-session', 'GET', undefined, firstCookie)).json(), null);
    const second = await login(uid, password); assert.equal(second.status, 200); const cookie = cookieOf(second);
    for (let n = 0; n < 2; n++) assert.equal((await (await api('/api/auth/get-session', 'GET', undefined, cookie)).json()).user.userId, uid);
    assert.equal((await api('/api/admin/users', 'GET', undefined, cookie)).status, 403);
    assert.equal((await api('/api/admin/users', 'POST', { userId: 'forbidden', role: 'admin' }, cookie)).status, 403);
    assert.equal((await api('/admin/users', 'GET', undefined, cookie)).status, 404);
    if (fixtureMode) {
      const designId = require('node:crypto').randomUUID();
      const store = require('../lib/server/db.ts');
      await store.put('manual-design', designId, ownedFixtures[0].id, { design: { fixture: true } });
      ownedDesignFixtures.push({ id: designId, owner: ownedFixtures[0].id });
      const tampered = await api('/api/manual-designs', 'DELETE', { id: designId, owner: created.id }, cookie);
      assert.equal(tampered.status, 404, 'Another account cannot delete an admin-owned design by changing body ownership.');
      assert.equal((await store.row('manual-design', designId)).owner, ownedFixtures[0].id);
      const list = await api('/api/manual-designs?owner=' + ownedFixtures[0].id, 'GET', undefined, cookie);
      assert.deepEqual((await list.json()).designs, [], 'Client-selected owner cannot expose another account designs.');
    }
    const saved = await api('/api/manual-designs', 'GET', undefined, cookie); assert.equal(saved.status, 200); assert.deepEqual((await saved.json()).designs, []);
    const userAction = action => api('/api/admin/users/' + created.id, 'PATCH', { action }, adminCookie);
    assert.equal((await userAction('disable')).status, 200);
    assert.equal(await (await api('/api/auth/get-session', 'GET', undefined, cookie)).json(), null);
    assert.equal((await login(uid, password)).status, 401);
    assert.equal((await api('/api/manual-designs', 'POST', {}, cookie)).status, 401);
    assert.equal((await userAction('enable')).status, 200);
    const reset = await userAction('reset-password'); assert.equal(reset.status, 200); const fresh = (await reset.json()).temporaryPassword;
    assert.equal((await login(uid, password)).status, 401);
    const last = await login(uid, fresh); assert.equal(last.status, 200); const lastCookie = cookieOf(last);
    assert.equal((await api('/api/auth/sign-out', 'POST', {}, lastCookie)).status, 200);
    assert.equal(await (await api('/api/auth/get-session', 'GET', undefined, lastCookie)).json(), null);
    for (const page of ['/', '/collections', '/studio', '/about', '/contact']) assert.equal((await api(page)).status, 200);
    console.log('VERIFIED WORKING: live MongoDB credentials, admin user creation, hashed credentials, first-login change, session refresh/logout, generic credential rejection, ordinary-user admin denial, disable/revocation, reset, private design API denial and public pages.');
  } finally {
    // Keep the audit trail and fixture profile; never delete existing user data.
    await api('/api/admin/users/' + created.id, 'PATCH', { action: 'disable' }, adminCookie);
    await api('/api/auth/sign-out', 'POST', {}, adminCookie);
    if (!fixtureMode) await (await mongoClient()).close();
  }
})().finally(async () => {
  for (const fixture of ownedDesignFixtures) {
    const store = require('../lib/server/db.ts');
    assert.equal((await store.row('manual-design', fixture.id))?.owner, fixture.owner, 'Refuse unexpected design cleanup.');
    await store.remove('manual-design', fixture.id);
  }
  if (!ownedFixtures.length) return;
  const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
  const { ObjectId } = require('mongodb'); const db = await mongoDatabase();
  for (const fixture of ownedFixtures) {
    const id = new ObjectId(fixture.id);
    // Exact IDs and unpredictable visible IDs created in this process only.
    const owned = await db.collection('users').findOne({ _id: id, userId: fixture.userId, name: { $in: ['Authentication bootstrap fixture', 'Authentication sanity fixture'] } });
    assert.ok(owned, 'Refuse cleanup of any record other than this test fixture.');
    await db.collection('sessions').deleteMany({ userId: id });
    await db.collection('accounts').deleteMany({ userId: id });
    await db.collection('users').deleteOne({ _id: id, userId: fixture.userId });
  }
  await (await mongoClient()).close();
  console.log('Temporary test identities removed by exact ID; audit records and all existing data preserved.');
}).then(() => process.exit(0)).catch(() => { console.error('FAIL/BLOCKED: authentication check failed. Verify configuration, connectivity and the stated workflow; no credentials are printed.'); process.exit(1); });
