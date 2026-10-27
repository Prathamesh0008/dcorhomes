import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
import { authProvider, clerkConfigured, clerkAuthorizedParties } from './lib/auth-provider';

const clerk = clerkMiddleware(() => NextResponse.next(), request => {
  // SITE_URL is also the public SEO canonical. In local development, permit only
  // the actual loopback origin as well; never broaden Production authorization.
  return { authorizedParties: clerkAuthorizedParties(request.nextUrl.origin) };
});
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    if (authProvider() === 'legacy') return NextResponse.next();
    // Missing configuration never opens private access. Resource helpers independently authorize.
    if (!clerkConfigured()) {
      if (request.nextUrl.pathname === '/login') return NextResponse.next();
      return NextResponse.json({ error: 'Account access is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
    }
    return await clerk(request, event);
  } catch {
    return NextResponse.json({ error: 'Account access is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
// Public routes, assets, catalogue, designs and SEO never run Clerk middleware.
export const config = { matcher: ['/login', '/account/:path*', '/admin/:path*', '/api/account/:path*', '/api/admin/:path*'] };
