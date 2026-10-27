import 'server-only';
import { cache } from 'react';
import { authProvider, clerkConfigured } from '@/lib/auth-provider';
import { HttpError } from './http';
import { clerkAccountRole } from './clerk-policy';

const clerkSession = cache(async () => {
  if (!clerkConfigured()) return { status: 'unavailable' as const, account: null };
  try {
    const { auth, clerkClient } = await import('@clerk/nextjs/server');
    // Pending sessions must be distinguished from truly signed-out visitors.
    const identity = await auth({ treatPendingAsSignedOut: false });
    if (!identity.userId || !identity.sessionId) return { status: 'signed_out' as const, account: null };
    const client = await clerkClient();
    // Fresh provider reads enforce bans, revocation and role changes without trusting stale JWT metadata.
    const [user, session] = await Promise.all([client.users.getUser(identity.userId), client.sessions.getSession(identity.sessionId)]);
    if (session.userId !== user.id || user.banned || user.locked) return { status: 'denied' as const, account: null };
    if (session.status === 'pending') return { status: 'pending' as const, account: null };
    const role = clerkAccountRole(user);
    if (!role || session.status !== 'active' || session.expireAt <= Date.now()) return { status: 'denied' as const, account: null };
    return { status: 'authenticated' as const, account: { provider: 'clerk' as const, user: { id: user.id, name: user.fullName || user.username!, userId: user.username!,
      email: user.primaryEmailAddress?.emailAddress || '', role, mustChangePassword: false, sessionVersion: 0 }, session: { expiresAt: new Date(session.expireAt) } } };
  } catch {
    // No provider error bodies, tokens, request headers or user identifiers in logs.
    console.error(JSON.stringify({ event: 'authentication_failure', provider: 'clerk', operation: 'validate_session' }));
    return { status: 'unavailable' as const, account: null };
  }
});

export async function accountAuthState(allowPasswordChange = false) {
  if (authProvider() === 'clerk') return { ...await clerkSession(), provider: 'clerk' as const };
  // Retained only until a real Clerk development/Preview login is verified and cutover approved.
  const legacy = await (await import('./customer-auth')).customerSession(allowPasswordChange);
  return legacy ? { status: 'authenticated' as const, account: { ...legacy, provider: 'legacy' as const }, provider: 'legacy' as const } : { status: 'signed_out' as const, account: null, provider: 'legacy' as const };
}
export async function accountSession(allowPasswordChange = false) {
  const state = await accountAuthState(allowPasswordChange);
  if (state.status === 'unavailable') throw new HttpError(503, 'Account access is temporarily unavailable. Please try again later.');
  return state.account;
}
export async function requireAccountAdmin() {
  const account = await accountSession();
  if (!account) throw new HttpError(401, 'Administrator sign-in required.');
  if (account.user.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  return account;
}
