import 'server-only';
import { cache } from 'react';
import { customerSession } from '@/lib/server/customer-auth';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Session validation is shared per request and cannot block the public page shell.
// These links grant no access; private routes always validate the session again.
const chromeSession = cache(() => customerSession(true));
export async function SessionHeader() {
  const customer = await chromeSession();
  return <SiteHeader signedIn={Boolean(customer)} isAdmin={customer?.user.role === 'admin' && !customer.user.mustChangePassword} />;
}
export async function SessionFooter() {
  return <SiteFooter signedIn={Boolean(await chromeSession())} />;
}
