export type AuthStatus = 'authenticated' | 'signed_out' | 'pending' | 'denied' | 'unavailable';
export function authDestination(route: '/login' | '/account', status: AuthStatus) {
  if (route === '/login' && status === 'authenticated') return '/account';
  if (route === '/account' && status === 'signed_out') return '/login';
  return null;
}
export function clerkLoginView(loaded: boolean, hasSession: boolean, pending: boolean) {
  if (!loaded) return 'loading';
  if (pending) return 'tasks';
  // Mounting SignIn with a browser-only active session causes its automatic redirect.
  if (hasSession) return 'session_mismatch';
  return 'sign_in';
}
export function authNavigationDiagnostic(route: '/login' | '/account', provider: 'clerk' | 'legacy', status: AuthStatus) {
  if (process.env.NODE_ENV !== 'development' || process.env.AUTH_NAVIGATION_DIAGNOSTICS !== 'true') return;
  console.info(JSON.stringify({ event: 'auth_navigation', route, provider, resolved: true, authenticated: status === 'authenticated', pending: status === 'pending', requiredTasks: status === 'pending', permissionPassed: status === 'authenticated', redirect: authDestination(route, status) }));
}
