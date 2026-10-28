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
  return <Container className="py-8 md:py-12"><UserManagement currentUserId={account.user.id}/></Container>;
}
