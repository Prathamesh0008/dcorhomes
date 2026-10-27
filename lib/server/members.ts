import 'server-only';
import { authProvider } from '@/lib/auth-provider';
import { createHash, randomBytes } from 'node:crypto';
import { ObjectId, type ClientSession, type Document } from 'mongodb';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { mongoClient, mongoDatabase } from './mongodb';
import { customerSession } from './customer-auth';
import { activeSession, normalizeUserId, passwordProblem, validUserId } from './member-policy';
import { HttpError } from './security';
import { jsonInput } from './security';
import type { NextRequest } from 'next/server';

export async function memberJson(request: NextRequest, maxBytes: number) {
  if (!process.env.SITE_URL || request.headers.get('origin') !== new URL(process.env.SITE_URL).origin || !request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(403, 'Same-origin JSON request required.');
  return jsonInput(request, maxBytes);
}

let indexes: Promise<unknown> | undefined;
function legacyOnly() { if (authProvider() !== 'legacy') throw new HttpError(410, 'Legacy account management is retired. Use the Clerk Dashboard.'); }
export async function memberIndexes() {
  legacyOnly();
  if (!indexes) indexes = (async () => {
    const db = await mongoDatabase();
    await db.collection('users').createIndex({ normalizedUserId: 1 }, { unique: true, partialFilterExpression: { normalizedUserId: { $type: 'string' } } });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
    await db.collection('accounts').createIndex({ userId: 1, providerId: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('member_login_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('member_login_limits').createIndex({ key: 1 }, { unique: true });
    await db.collection('member_audit').createIndex({ at: -1 });
    await db.collection('member_control').createIndex({ key: 1 }, { unique: true });
    try { await db.collection('member_control').updateOne({ key: 'administration' }, { $setOnInsert: { revision: 0 } }, { upsert: true }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  })().catch(error => { indexes = undefined; throw error; });
  await indexes;
}
export async function requireMemberAdmin() {
  const account = await customerSession();
  if (!account) throw new HttpError(401, 'Sign in with an authorized administrator account.');
  if (account.user.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  return { id: account.user.id, version: account.user.sessionVersion };
}
export function publicMember(user: Document) {
  return { id: String(user._id), userId: String(user.userId || ''), fullName: String(user.name || ''),
    email: user.email?.endsWith('@members.invalid') ? '' : String(user.email || ''), role: user.role,
    status: user.status, mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt, lastLoginAt: user.lastLoginAt || null, createdBy: user.createdBy || null };
}
type Actor = { id: string; version: number };
async function administrative<T>(actor: Actor | null, action: (session: ClientSession) => Promise<T>) {
  await memberIndexes();
  const client = await mongoClient(), db = await mongoDatabase(), session = client.startSession();
  try { return await session.withTransaction(async () => {
    // Serialize administration, including simultaneous attempts to disable the last admins.
    await db.collection('member_control').updateOne({ key: 'administration' }, { $inc: { revision: 1 } }, { session });
    if (actor) {
      const admin = await db.collection('users').findOne({ _id: new ObjectId(actor.id), role: 'admin', mustChangePassword: false }, { session });
      if (!activeSession(admin, actor.version)) throw new HttpError(403, 'Administrator access required.');
    }
    return action(session);
  }); } finally { await session.endSession(); }
}
function memberInput(input: Record<string, unknown>) {
  const userId = typeof input.userId === 'string' ? input.userId.trim() : '';
  const name = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!validUserId(userId)) throw new HttpError(400, 'User ID must be 3–30 letters, numbers, dots, underscores or hyphens, starting with a letter or number.');
  if (name.length < 2 || name.length > 100) throw new HttpError(400, 'Enter a full name between 2 and 100 characters.');
  if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith('@members.invalid'))) throw new HttpError(400, 'Enter a valid email address.');
  if (input.role !== undefined && input.role !== 'user' && input.role !== 'admin') throw new HttpError(400, 'Invalid role.');
  return { userId, name, email, role: input.role === 'admin' ? 'admin' : 'user' };
}
export async function provisionMember(actor: Actor | null, input: Record<string, unknown>, bootstrapPassword?: string) {
  legacyOnly();
  const data = memberInput(input), password = bootstrapPassword ?? randomBytes(24).toString('base64url');
  if (!actor && !bootstrapPassword) throw new HttpError(403, 'Local bootstrap password required.');
  const problem = passwordProblem(password); if (problem) throw new HttpError(400, problem);
  const hash = await hashPassword(password), id = new ObjectId(), now = new Date(), db = await mongoDatabase();
  try {
    await administrative(actor, async session => {
      if (!actor && await db.collection('users').findOne({ role: 'admin' }, { session })) throw new HttpError(409, 'An administrator already exists. Bootstrap refused.');
      const user = { _id: id, userId: data.userId, normalizedUserId: normalizeUserId(data.userId), name: data.name,
        // Better Auth requires email. An unrouteable unique internal address is never displayed as contact email.
        email: data.email || `${id.toHexString()}@members.invalid`, emailVerified: false,
        role: actor ? data.role : 'admin', status: 'active', mustChangePassword: Boolean(actor), sessionVersion: 1,
        createdAt: now, updatedAt: now, createdBy: actor?.id || 'local-bootstrap' };
      await db.collection('users').insertOne(user, { session });
      await db.collection('accounts').insertOne({ _id: new ObjectId(), userId: id, accountId: id.toHexString(), providerId: 'credential', password: hash, createdAt: now, updatedAt: now }, { session });
      await db.collection('member_audit').insertOne({ action: actor ? 'create-user' : 'bootstrap-admin', actor: actor?.id || 'local-bootstrap', target: id.toHexString(), at: now }, { session });
    });
  } catch (error) { if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'That User ID or email is already in use.'); throw error; }
  return { id: id.toHexString(), temporaryPassword: actor ? password : undefined };
}
export async function manageMember(actor: Actor, id: string, action: unknown) {
  legacyOnly();
  if (!ObjectId.isValid(id)) throw new HttpError(404, 'User not found.');
  if (!['disable', 'enable', 'reset-password'].includes(String(action))) throw new HttpError(400, 'Invalid administrative action.');
  const db = await mongoDatabase(), userId = new ObjectId(id), temporaryPassword = action === 'reset-password' ? randomBytes(24).toString('base64url') : undefined;
  const password = temporaryPassword ? await hashPassword(temporaryPassword) : undefined;
  await administrative(actor, async session => {
    const user = await db.collection('users').findOne({ _id: userId }, { session });
    if (!user) throw new HttpError(404, 'User not found.');
    if (action === 'disable' && user.role === 'admin' && user.status === 'active' && await db.collection('users').countDocuments({ role: 'admin', status: 'active' }, { session }) <= 1) throw new HttpError(409, 'The final active administrator cannot be disabled.');
    if (password) {
      const result = await db.collection('accounts').updateOne({ userId, providerId: 'credential' }, { $set: { password, updatedAt: new Date() } }, { session });
      if (!result.matchedCount) throw new HttpError(409, 'Credential account is missing; no password was reset.');
    }
    await db.collection('users').updateOne({ _id: userId }, { $set: { updatedAt: new Date(), ...(password ? { mustChangePassword: true } : { status: action === 'disable' ? 'disabled' : 'active' }) }, $inc: { sessionVersion: 1 } }, { session });
    await db.collection('sessions').deleteMany({ userId }, { session });
    await db.collection('member_audit').insertOne({ action, actor: actor.id, target: id, at: new Date() }, { session });
  });
  return { temporaryPassword };
}
export async function changeMemberPassword(actor: Actor, currentPassword: unknown, newPassword: unknown) {
  legacyOnly();
  const problem = passwordProblem(newPassword); if (problem) throw new HttpError(400, problem);
  if (typeof currentPassword !== 'string' || currentPassword.length > 128 || currentPassword === newPassword) throw new HttpError(400, 'Confirm your current password and choose a different new password.');
  const db = await mongoDatabase(), userId = new ObjectId(actor.id);
  const account = await db.collection('accounts').findOne({ userId, providerId: 'credential' });
  if (!account?.password || !await verifyPassword({ hash: account.password, password: currentPassword })) throw new HttpError(400, 'Your current password could not be verified.');
  const password = await hashPassword(newPassword as string), session = (await mongoClient()).startSession();
  try { await session.withTransaction(async () => {
    const result = await db.collection('users').updateOne({ _id: userId, status: 'active', sessionVersion: actor.version }, { $set: { mustChangePassword: false, updatedAt: new Date() }, $inc: { sessionVersion: 1 } }, { session });
    if (!result.matchedCount) throw new HttpError(401, 'Session changed. Please sign in again.');
    const changed = await db.collection('accounts').updateOne({ _id: account._id, password: account.password }, { $set: { password, updatedAt: new Date() } }, { session });
    if (!changed.matchedCount) throw new HttpError(409, 'Password changed. Please sign in again.');
    await db.collection('sessions').deleteMany({ userId }, { session });
    await db.collection('member_audit').insertOne({ action: 'change-password', actor: actor.id, target: actor.id, at: new Date() }, { session });
  }); } finally { await session.endSession(); }
}
export async function loginLimit(userId: string, source: string) {
  legacyOnly();
  await memberIndexes(); const db = await mongoDatabase(), now = new Date();
  for (const [kind, identity, max] of [['user', normalizeUserId(userId), 8], ['ip', source, 30]] as const) {
    const key = `${kind}:${createHash('sha256').update(identity).digest('hex')}`;
    const limits = db.collection('member_login_limits');
    await limits.updateOne({ key, expiresAt: { $lte: now } }, { $set: { count: 0, expiresAt: new Date(Date.now() + 900000) } });
    try { await limits.updateOne({ key }, { $setOnInsert: { count: 0, expiresAt: new Date(Date.now() + 900000) } }, { upsert: true }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
    const consumed = await limits.findOneAndUpdate({ key, count: { $lt: max } }, { $inc: { count: 1 } }, { returnDocument: 'after' });
    if (!consumed) throw new HttpError(429, 'Too many sign-in attempts. Please try again in 15 minutes.');
  }
}
