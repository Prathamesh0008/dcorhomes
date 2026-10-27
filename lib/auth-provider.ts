// One provider per deployment. Never fall back between session systems.
export function authProvider(): 'legacy' | 'clerk' {
  const value = process.env.AUTH_PROVIDER || 'legacy';
  if (value !== 'legacy' && value !== 'clerk') throw new Error('Authentication provider configuration is invalid.');
  return value;
}
export function clerkConfigured() {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const secret = process.env.CLERK_SECRET_KEY || '';
  const live = process.env.VERCEL_ENV === 'production';
  try { const origin = new URL(process.env.SITE_URL || ''); if (live && origin.protocol !== 'https:') return false; }
  catch { return false; }
  return (live ? publishable.startsWith('pk_live_') && secret.startsWith('sk_live_') :
    (publishable.startsWith('pk_test_') && secret.startsWith('sk_test_')) || (publishable.startsWith('pk_live_') && secret.startsWith('sk_live_')));
}
export function clerkAuthorizedParties(requestOrigin: string) {
  const parties = process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : [];
  const request = new URL(requestOrigin);
  if (process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(request.hostname)) parties.push(request.origin);
  return [...new Set(parties)];
}
