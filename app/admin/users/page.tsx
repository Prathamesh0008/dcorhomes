import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { accountSession } from '@/lib/server/account-session';
import Container from '@/components/ui/Container';
import UserManagement from '@/components/account/UserManagement';
export const metadata = { title: 'Manage users', robots: { index: false, follow: false } };
export default async function Page() {
  const account = await accountSession(true); if (!account) redirect('/login');
  if (account.user.mustChangePassword) redirect('/account/change-password');
  if (account.user.role !== 'admin') notFound();
  if (account.provider === 'clerk') return <Container className="py-14 md:py-20"><p className="text-[12px] uppercase tracking-[3px] text-muted">Private administration</p><h1 className="mb-8 mt-4 text-[38px] font-medium">Authorized members</h1><p className="max-w-2xl leading-7">Dcorhome accounts are managed in the Clerk Dashboard by an authorized dashboard administrator. Create users with their assigned User ID, approve their access, manage recovery and ban or restore accounts there. Website roles do not grant access to the Clerk Dashboard.</p><a href="https://dashboard.clerk.com" className="inline-flex min-h-12 items-center underline" target="_blank" rel="noopener noreferrer">Open Clerk Dashboard</a></Container>;
  return <Container className="py-14 md:py-20"><p className="text-[12px] uppercase tracking-[3px] text-muted">Private administration</p><h1 className="mb-8 mt-4 text-[38px] font-medium">Authorized members</h1><UserManagement/></Container>;
}
