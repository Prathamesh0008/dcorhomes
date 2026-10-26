import ServerCatalogueProvider from '@/components/curtains/ServerCatalogueProvider';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { customerSession } from '@/lib/server/customer-auth';
import { rows } from '@/lib/server/db';
import { Logout } from '@/components/account/AccountActions';
import Container from '@/components/ui/Container';
import AccountSavedDesigns from '@/components/account/AccountSavedDesigns';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My account', robots: { index: false, follow: false } };
export default async function Account() {
  const session = await customerSession(true); if (!session) redirect('/login');
  if (session.user.mustChangePassword) redirect('/account/change-password');
  const enquiries = await rows('account-enquiry', session.user.id);
  const contactEmail = session.user.email.endsWith('@members.invalid') ? '' : session.user.email;
  return <Container className="py-14 md:py-24"><p className="text-[12px] uppercase tracking-[3px] text-muted">Your personal atelier</p><div className="flex flex-wrap items-center justify-between gap-5"><h1 className="my-5 break-words text-[38px] font-medium leading-tight tracking-[-1px] sm:text-[56px]">Welcome, {session.user.name}.</h1><Logout/></div><p className="break-all text-muted">User ID: {session.user.userId}{contactEmail ? ` · ${contactEmail}` : ''}</p><div className="mt-8 flex flex-wrap gap-6 text-[15px] underline"><Link href="/account/change-password">Change password</Link>{session.user.role === 'admin' && <Link href="/admin/users">Manage users</Link>}</div><div className="mt-12 grid gap-14 border-t border-solid border-[#d8dcd3] pt-10 lg:grid-cols-2"><section id="saved-designs"><h2 className="mb-5 text-[28px] font-medium">Saved curtain designs</h2><ServerCatalogueProvider><AccountSavedDesigns/></ServerCatalogueProvider><Link href="/designs" className="inline-flex min-h-12 items-center underline">View designs on this device</Link></section><section><h2 className="mb-5 text-[28px] font-medium">Your enquiries</h2>{enquiries.length ? <ul className="divide-y divide-[#d8dcd3]">{enquiries.map(item => { const enquiry = JSON.parse(item.data); return <li key={item.id} className="py-5"><p className="font-medium">{enquiry.interest || 'Curtain enquiry'}</p><p className="text-[14px] text-muted">{new Date(item.created).toLocaleDateString('en-IN')} · Reference {item.id}</p><p className="whitespace-pre-wrap text-[15px] leading-7">{enquiry.message}</p></li>; })}</ul> : <p className="text-[15px] leading-7 text-muted">No enquiries submitted while signed in yet. Earlier guest enquiries remain private to their original session.</p>}<Link href="/contact" className="inline-flex min-h-12 items-center underline">Start a conversation</Link></section></div></Container>;
}
