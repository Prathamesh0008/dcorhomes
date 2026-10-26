// Interactive owner-only setup. Passwords/cookies never enter files or tool output.
require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
if (process.platform === 'win32') process.env.DCORHOME_PASSWORD_UI = 'dialog';
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { createInterface } = require('node:readline/promises');
const { hiddenPassword } = require('./member-prompt.cjs');
const statusPath = path.resolve('.data/member-onboarding/status.json');
const report = { phase: 'starting', passed: [], initialAdminExisted: false, initialUsers: [] };
function status(phase) {
  report.phase = phase;
  fs.mkdirSync(path.dirname(statusPath), { recursive: true });
  fs.writeFileSync(statusPath, JSON.stringify(report, null, 2));
}
function check(condition, name) {
  if (!condition) { report.failedCheck = name; throw Error('Verification failed.'); }
  report.passed.push(name); status(report.phase);
  console.log('PASS: ' + name);
}
async function acknowledge(message) {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  try { await reader.question(message); } finally { reader.close(); }
}
(async () => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw Error('Interactive terminal required.');
  const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
  const db = await mongoDatabase(); await db.command({ ping: 1 });
  const projection = { _id: 0, userId: 1, role: 1, status: 1, mustChangePassword: 1 };
  report.initialUsers = await db.collection('users').find({}, { projection }).toArray();
  const existingAdmin = await db.collection('users').findOne({ role: 'admin' }, { projection });
  report.initialAdminExisted = Boolean(existingAdmin);
  if (existingAdmin && existingAdmin.userId !== 'dcorhome-admin') {
    report.existingAdminUserId = existingAdmin.userId;
    throw Error('Another administrator already exists; initialization refused.');
  }
  if (!existingAdmin) {
    status('waiting-bootstrap-password');
    console.log('Create dcorhome-admin. Choose a unique password/passphrase, 12–128 characters.');
    console.log('Passwords are entered here without echo, never in chat.');
    const bootstrap = spawnSync(process.execPath, [path.resolve('scripts/bootstrap-admin.cjs'), 'dcorhome-admin', 'Dcorhome Administrator'], { cwd: process.cwd(), stdio: 'inherit', windowsHide: true });
    if (bootstrap.status !== 0) throw Error('Bootstrap did not complete.');
  }
  const admin = await db.collection('users').findOne({ normalizedUserId: 'dcorhome-admin' }, { projection: { _id: 1, userId: 1, role: 1, status: 1 } });
  check(admin?.role === 'admin' && admin.status === 'active', 'Administrator confirmed active in MongoDB');
  const base = new URL(process.env.SITE_URL).origin;
  async function api(endpoint, method = 'GET', body, cookie = '') {
    return fetch(base + endpoint, { method, signal: AbortSignal.timeout(60000), redirect: 'manual', headers: { Origin: base, 'Content-Type': 'application/json', cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }
  function cookieOf(response) { return response.headers.getSetCookie().map(value => value.split(';')[0]).join('; '); }
  const login = (username, password) => api('/api/auth/sign-in/username', 'POST', { username, password });
  check((await api('/login')).status === 200, 'Login page renders');
  status('waiting-login-password');
  console.log('Confirm the chosen administrator password to test the real login workflow.');
  const adminLogin = await login('dcorhome-admin', await hiddenPassword('Administrator password (not displayed): '));
  check(adminLogin.status === 200, 'Administrator credential login succeeds');
  const adminCookie = cookieOf(adminLogin); let userCookie = '';
  try {
    status('testing-accounts');
    check((await api('/admin/users', 'GET', undefined, adminCookie)).status === 200, 'Administrator can open /admin/users');
    check((await api('/api/admin/users', 'GET', undefined, adminCookie)).status === 200, 'Administrator user management API authorized');
    const prior = await db.collection('users').findOne({ normalizedUserId: 'dcorhome-test01' }, { projection: { _id: 1 } });
    if (prior) { report.testUserAlreadyExisted = true; throw Error('Test User ID already exists; it was not overwritten.'); }
    const created = await api('/api/admin/users', 'POST', { userId: 'dcorhome-test01', fullName: 'Dcorhome Test Member', role: 'user' }, adminCookie);
    check(created.status === 201, 'Admin workflow creates dcorhome-test01');
    const result = await created.json();
    const stored = await db.collection('users').findOne({ normalizedUserId: 'dcorhome-test01' }, { projection: { _id: 1, role: 1, status: 1, mustChangePassword: 1 } });
    check(stored && String(stored._id) === result.id && stored.role === 'user' && stored.status === 'active' && stored.mustChangePassword, 'Test member database operation confirmed');
    check((await api('/api/admin/users', 'POST', { userId: 'DCORHOME-TEST01', fullName: 'Duplicate must fail' }, adminCookie)).status === 409, 'Duplicate User ID creation rejected');
    const userLogin = await login('dcorhome-test01', result.temporaryPassword);
    check(userLogin.status === 200, 'Test member temporary-password login succeeds');
    userCookie = cookieOf(userLogin);
    const account = await api('/account', 'GET', undefined, userCookie);
    check(account.status === 307 && (account.headers.get('location') || '').endsWith('/account/change-password'), 'First-login password change enforced');
    const newPassword = randomBytes(24).toString('base64url');
    check((await api('/api/account/password', 'POST', { currentPassword: result.temporaryPassword, newPassword }, userCookie)).status === 200, 'Test member establishes a new password');
    const changedLogin = await login('dcorhome-test01', newPassword);
    check(changedLogin.status === 200, 'Test member can log in after password setup');
    userCookie = cookieOf(changedLogin);
    check((await api('/admin/users', 'GET', undefined, userCookie)).status === 404, 'Ordinary member cannot access admin page');
    check((await api('/api/admin/users', 'POST', { userId: 'forbidden-user', fullName: 'Forbidden', role: 'admin' }, userCookie)).status === 403, 'Ordinary member cannot create users or admins');
    const manage = action => api('/api/admin/users/' + result.id, 'PATCH', { action }, adminCookie);
    check((await manage('disable')).status === 200, 'Administrator disables test member');
    check(await (await api('/api/auth/get-session', 'GET', undefined, userCookie)).json() === null, 'Disabling revokes existing session');
    check((await login('dcorhome-test01', newPassword)).status === 401, 'Disabled member cannot sign in');
    check((await api('/api/manual-designs', 'POST', {}, userCookie)).status === 401, 'Disabled member cannot access private actions');
    check((await api('/api/auth/sign-up/email', 'POST', { email: 'blocked@example.invalid', password: newPassword })).status === 403, 'Public signup remains disabled');
    check((await api('/api/admin/users', 'POST', { userId: 'unauthorized-user', fullName: 'Unauthorized' })).status === 401, 'Unauthenticated user creation remains disabled');
    // Replace test-only credentials after verification. This final temporary password is
    // displayed once below, only after authenticating the owner; the account stays disabled.
    const reset = await manage('reset-password'); check(reset.status === 200, 'Fresh test temporary password issued through admin reset');
    const finalCredential = await reset.json();
    const finalTest = await db.collection('users').findOne({ _id: stored._id }, { projection });
    check(finalTest.status === 'disabled' && finalTest.mustChangePassword, 'Test account remains disabled and requires password change');
    report.users = await db.collection('users').find({}, { projection }).toArray();
    status('waiting-owner-acknowledgement');
    console.log('\nAUTHORIZED ADMINISTRATOR ONLY — shown once in this local terminal.');
    console.log('User ID: dcorhome-test01');
    process.stdout.write('Temporary password: ' + finalCredential.temporaryPassword + '\n');
    console.log('Account is DISABLED after the requested revocation test. Enable it in /admin/users before use.');
    console.log('If this password is lost, reset it in the admin panel; it cannot be retrieved.');
    await acknowledge('Save it privately if needed, then press Enter to dismiss and finish: ');
    console.clear(); console.log('Credential setup and verification finished. Test account remains disabled.');
    status('complete');
  } finally {
    if (userCookie) await api('/api/auth/sign-out', 'POST', {}, userCookie).catch(() => {});
    await api('/api/auth/sign-out', 'POST', {}, adminCookie).catch(() => {});
    await (await mongoClient()).close();
  }
})().then(() => process.exit(0)).catch(() => {
  status('failed');
  console.error('Setup did not finish. Consult the credential-free status file; no passwords or existing accounts were overwritten.');
  process.exit(1);
});
