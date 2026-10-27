import 'server-only';
import { betterAuth } from 'better-auth/minimal';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { username } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { ObjectId } from 'mongodb';
import { mongoConfigured, mongoDatabase } from './mongodb';
import { activeSession, normalizeUserId, validUserId } from './member-policy';
import { AsyncLocalStorage } from 'node:async_hooks';
const credentialAttempt = new AsyncLocalStorage<{ id: string; version: number } | null>();
export async function runMemberLogin<T>(userId: string, action: () => Promise<T>) {
  const user = await (await mongoDatabase()).collection('users').findOne({ normalizedUserId: normalizeUserId(userId) });
  return credentialAttempt.run(user ? { id: String(user._id), version: user.sessionVersion } : null, action);
}

export function customerAuthReady() {
  try {
    const origin = new URL(process.env.SITE_URL || '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && local && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_HTTP === 'true')))) return false;
  } catch { return false; }
  return Boolean(mongoConfigured() && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length >= 32 && process.env.SITE_URL);
}
let instance: ReturnType<typeof createCustomerAuth> | undefined;
export async function customerAuth() {
  if (!customerAuthReady()) throw Error('Member authentication is awaiting configuration.');
  return instance ||= createCustomerAuth().catch(error => { instance = undefined; throw error; });
}
async function createCustomerAuth() {
  const db = await mongoDatabase();
  return betterAuth({
    appName: 'Dcorhome', baseURL: process.env.SITE_URL, secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db), logger: { disabled: true },
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12, maxPasswordLength: 128, autoSignIn: false },
    plugins: [username({ usernameNormalization: normalizeUserId, usernameValidator: validUserId, immutableUsername: true,
      schema: { user: { fields: { username: 'normalizedUserId', displayUsername: 'userId' } } } })],
    user: { modelName: 'users', additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
      status: { type: 'string', defaultValue: 'disabled', input: false },
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false },
      sessionVersion: { type: 'number', defaultValue: 0, input: false },
    } },
    account: { modelName: 'accounts' },
    session: { modelName: 'sessions', expiresIn: 60 * 60 * 24, updateAge: 60 * 60,
      cookieCache: { enabled: false }, additionalFields: { sessionVersion: { type: 'number', input: false } } },
    verification: { modelName: 'verification' },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30,
      // The explicit member limiter enforces 8/User ID and 30/source per 15 minutes.
      // Keep the library's additional source ceiling above those limits.
      customRules: { '/sign-in/username': { window: 900, max: 60 } } },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      ipAddress: { ipAddressHeaders: process.env.TRUST_PROXY === 'true' ? ['x-forwarded-for'] : [] },
    },
    databaseHooks: { session: { create: {
      before: async session => {
        const attempt = credentialAttempt.getStore();
        if (!attempt || attempt.id !== session.userId) throw new APIError('UNAUTHORIZED', { message: 'Unable to sign in.' });
        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId), status: 'active', sessionVersion: attempt.version });
        if (!user) throw new APIError('UNAUTHORIZED', { message: 'Unable to sign in. Check your User ID and password.' });
        return { data: { ...session, sessionVersion: attempt.version } };
      },
      after: async session => { await db.collection('users').updateOne({ _id: new ObjectId(session.userId) }, { $set: { lastLoginAt: new Date() } }); },
    } } },
  });
}
export function hasCustomerSessionCookie(requestHeaders: Headers) {
  return /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(requestHeaders.get('cookie') || '');
}
export async function validatedCustomerSession(requestHeaders: Headers, allowPasswordChange = false) {
  if (!hasCustomerSessionCookie(requestHeaders)) return null;
  if (!customerAuthReady()) throw Error('Member authentication is awaiting configuration.');
  const result = await (await customerAuth()).api.getSession({ headers: requestHeaders });
  if (!result || !ObjectId.isValid(result.user.id)) return null;
  const current = await (await mongoDatabase()).collection('users').findOne({ _id: new ObjectId(result.user.id) });
  if (!activeSession(current, result.session.sessionVersion)) return null;
  if (current!.mustChangePassword && !allowPasswordChange) return null;
  return { ...result, user: { ...result.user, name: String(current!.name),
    userId: String(current!.userId), email: String(current!.email || ''),
    role: current!.role === 'admin' ? 'admin' as const : 'user' as const,
    mustChangePassword: Boolean(current!.mustChangePassword), sessionVersion: Number(current!.sessionVersion) } };
}
