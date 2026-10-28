// Trusted local CLI only. No passwords in arguments, environment, output or files.
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
require('./auth-loader.cjs');
const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
const { normalizeUserId, passwordProblem } = require('../lib/server/member-policy.ts');
const { databaseFailure, databaseFailureCodes } = require('../lib/server/database-diagnostics.ts');
const { hiddenPassword } = require('./member-prompt.cjs');
let client;
const deadline = setTimeout(() => { console.error('MongoDB diagnostic deadline exceeded; no account change confirmed.'); process.exit(1); }, 25000);
(async () => {
  const [mode, input, ...extra] = process.argv.slice(2);
  if (!['inspect', 'reset', 'verify'].includes(mode) || !input || extra.length) throw Error('Usage: node scripts/admin-account.cjs inspect|reset|verify USER_ID');
  client = await mongoClient(); const db = await mongoDatabase();
  await db.command({ ping: 1 });
  const matches = await db.collection('users').find({ $or: [{ normalizedUserId: normalizeUserId(input) }, { userId: input }] }).toArray();
  console.log('Connected database: ' + db.databaseName);
  if (matches.length !== 1) throw Error('Expected exactly one matching user; found ' + matches.length + '. No changes made.');
  const user = matches[0];
  const accounts = await db.collection('accounts').find({ userId: { $in: [user._id, String(user._id)] }, providerId: 'credential' }).toArray();
  console.log(JSON.stringify({ userId: user.userId, normalizedUserId: user.normalizedUserId, role: user.role, status: user.status,
    mustChangePassword: user.mustChangePassword, sessionVersion: user.sessionVersion,
    credentialRecords: accounts.length, credentials: accounts.map(a => ({ objectIdReference: a.userId?.equals?.(user._id) === true,
      accountIdMatches: a.accountId === String(user._id), passwordPresent: typeof a.password === 'string' && a.password.length > 0,
      passwordFormatValid: typeof a.password === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(a.password) })) }));
  clearTimeout(deadline);
  if (mode === 'inspect') {
    const recent = await db.collection('member_audit').find({ target: String(user._id) }, { projection: { action: 1, at: 1, actor: 1 } }).sort({ at: -1 }).limit(5).toArray();
    const sessions = await db.collection('sessions').find({ userId: { $in: [user._id, String(user._id)] } }, { projection: { sessionVersion: 1, expiresAt: 1 } }).toArray();
    console.log(JSON.stringify({ updatedAt: user.updatedAt, lastLoginAt: user.lastLoginAt || null,
      credentialUpdatedAt: accounts.map(account => account.updatedAt),
      recentActions: recent.map(entry => ({ action: entry.action, at: entry.at, selfAction: entry.actor === String(user._id) })),
      sessions: { total: sessions.length, current: sessions.filter(entry => entry.sessionVersion === user.sessionVersion && entry.expiresAt > new Date()).length,
        staleVersion: sessions.filter(entry => entry.sessionVersion !== user.sessionVersion).length, expired: sessions.filter(entry => entry.expiresAt <= new Date()).length } }));
    return;
  }
  if (user.role !== 'admin' || user.status !== 'active' || !Number.isInteger(user.sessionVersion)) throw Error('Reset refused: expected an active administrator with a valid session version.');
  if (accounts.length !== 1 || !accounts[0].userId?.equals?.(user._id) || accounts[0].accountId !== String(user._id)) throw Error('Reset refused: credential records need investigation.');
  if (mode === 'verify') {
    const password = await hiddenPassword('Existing administrator password (hidden): ');
    const { verifyPassword } = await import('better-auth/crypto');
    if (!accounts[0].password || !await verifyPassword({ hash: accounts[0].password, password })) throw Error('Verification failed: invalid credentials in the configured database.');
    console.log('Password matches the existing Better Auth credential.');
    const base = process.env.SITE_URL;
    const api = (route, method = 'GET', body, cookie = '') => fetch(new URL(route, base), {
      method, redirect: 'manual', signal: AbortSignal.timeout(20000),
      headers: { Origin: new URL(base).origin, 'Content-Type': 'application/json', cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const assert = require('node:assert/strict');
    const login = await api('/api/auth/sign-in/username', 'POST', { username: input, password });
    console.log('Login HTTP status: ' + login.status);
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    assert.match(cookie, /session_token=/);
    try {
      for (let i = 0; i < 2; i++) {
        const state = await api('/api/auth/get-session');
        assert.equal(await state.json(), null);
        const session = await api('/api/auth/get-session', 'GET', undefined, cookie);
        assert.equal(session.status, 200);
        const data = await session.json(); assert.equal(data.user.userId, user.userId); assert.equal(data.user.role, 'admin');
        for (const route of ['/account', '/admin/users']) {
          const page = await api(route, 'GET', undefined, cookie);
          if (user.mustChangePassword) { assert.ok([303, 307, 308].includes(page.status)); assert.equal(new URL(page.headers.get('location'), base).pathname, '/account/change-password'); }
          else assert.equal(page.status, 200, route);
        }
        if (user.mustChangePassword) assert.equal((await api('/account/change-password', 'GET', undefined, cookie)).status, 200);
        else assert.equal((await api('/api/admin/users', 'GET', undefined, cookie)).status, 200);
      }
    } finally {
      assert.equal((await api('/api/auth/sign-out', 'POST', {}, cookie)).status, 200);
      assert.equal(await (await api('/api/auth/get-session', 'GET', undefined, cookie)).json(), null);
    }
    console.log(user.mustChangePassword
      ? 'PASS: current password accepted, sessions persist, protected pages require password change, and logout works. Complete /account/change-password before administrator access.'
      : 'PASS: administrator login, /account, /admin/users, user listing, session persistence across requests, logout and rejection of the logged-out session.');
    return;
  }
  console.log('This resets only this administrator password and revokes its existing sessions.');
  let password;
  while (true) {
    password = await hiddenPassword('New administrator password (hidden): ');
    const problem = passwordProblem(password, { userId: user.userId, name: user.name, email: user.email }); if (problem) { console.error(problem); continue; }
    if (password !== await hiddenPassword('Confirm new password (hidden): ')) { console.error('Passwords do not match.'); continue; }
    break;
  }
  await require('../lib/server/members.ts').resetLocalAdminPassword(String(user._id), user.sessionVersion, password);
  password = undefined;
  console.log('Administrator password reset; previous sessions revoked. Sign in at /login.');
})().catch(error => {
  // Print only our own fixed validation messages, never driver errors or stacks.
  console.error(error?.constructor?.name === 'Error' && /^(Usage:|Expected exactly|Reset refused:|Verification failed:|An interactive|Cancelled\.|The local|Passwords|Administrator changed)/.test(error.message)
    ? error.message : 'Account operation failed (' + databaseFailure(error) + '; ' + databaseFailureCodes(error).join(',') + '). No secrets printed.');
  process.exitCode = 1;
}).finally(async () => { clearTimeout(deadline); if (client) await client.close(); });
