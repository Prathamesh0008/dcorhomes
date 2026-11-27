import { logDatabaseFailure } from '@/lib/server/database-diagnostics';
import { NextRequest, NextResponse } from 'next/server';
import { customerAuth, runMemberLogin, hasCustomerSessionCookie, validatedCustomerSession } from '@/lib/server/customer-auth';
import { loginLimit } from '@/lib/server/members';
import { failure, HttpError, jsonInput, mutation, privateHeaders } from '@/lib/server/security';
import { normalizeUserId, validUserId } from '@/lib/server/member-policy';
import { authConfiguration } from '@/lib/server/auth-configuration';
export const runtime = 'nodejs';
async function handler(request: NextRequest) {
  const endpoint = request.nextUrl.pathname.slice('/api/auth'.length);
  // Explicit allowlist also closes old signup, email-login, reset and account-linking endpoints.
  if (!['/sign-in/username', '/get-session', '/sign-out'].includes(endpoint)) return NextResponse.json({ message: 'Public registration is unavailable. Contact sales@dcorhome.com for account assistance.' }, { status: 403, headers: privateHeaders });
  try {
    if (endpoint === '/get-session' && request.method === 'GET' && !hasCustomerSessionCookie(request.headers)) return NextResponse.json(null, { headers: privateHeaders });
    const { origin, issues } = authConfiguration();
    if (!origin || issues.length) {
      console.error(JSON.stringify({ event: 'admin_auth_configuration', settings: issues }));
      throw new HttpError(503, 'Administrator authentication is awaiting configuration. Contact the site operator.');
    }
    if (endpoint === '/get-session') {
      if (request.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      const result = await validatedCustomerSession(request.headers, true);
      // Do not expose session tokens in client JSON.
      return NextResponse.json(result ? { user: result.user, session: { expiresAt: result.session.expiresAt } } : null, { headers: privateHeaders });
    }
    if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    let forwarded = request;
    let loginUserId = '';
    if (endpoint === '/sign-in/username') {
      const input = await jsonInput(request, 2048, origin);
      const userId = typeof input.username === 'string' ? normalizeUserId(input.username) : '';
      loginUserId = userId;
      if (!validUserId(userId) || typeof input.password !== 'string' || !input.password.length || input.password.length > 128) throw new HttpError(401, 'Unable to sign in. Check your User ID and password.');
      const source = process.env.TRUST_PROXY === 'true' ? (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim() : 'shared';
      await loginLimit(userId, source);
      forwarded = new NextRequest(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify({ username: userId, password: input.password }) });
    } else {
      mutation(request, undefined, origin);
    }
    const auth = await customerAuth();
    const result = loginUserId ? await runMemberLogin(loginUserId, () => auth.handler(forwarded)) : await auth.handler(forwarded);
    if (!result.ok && endpoint === '/sign-in/username') return NextResponse.json({ message: result.status === 429 ? 'Too many sign-in attempts. Please try again later.' : 'Unable to sign in. Check your User ID and password.' }, { status: result.status === 429 ? 429 : result.status >= 500 ? 503 : 401, headers: privateHeaders });
    if (result.ok && endpoint === '/sign-in/username') {
      // Preserve Better Auth's HttpOnly cookie; return neither password nor bearer token.
      const headers = new Headers(result.headers); headers.set('Cache-Control', 'private, no-store');
      return new NextResponse(JSON.stringify({ success: true }), { status: 200, headers });
    }
    result.headers.set('Cache-Control', 'private, no-store'); return result;
  } catch (error) {
    if (error instanceof HttpError) return failure(error);
    logDatabaseFailure('authentication', error);
    return failure(new HttpError(503, 'Authentication is temporarily unavailable. Please try again later.'));
  }
}
export { handler as GET, handler as POST };
