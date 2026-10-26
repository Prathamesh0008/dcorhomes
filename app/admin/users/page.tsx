import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { customerSession } from '@/lib/server/customer-auth';
import Container from '@/components/ui/Container';
import UserManagement from '@/components/account/UserManagement';
export const metadata = { title: 'Manage users', robots: { index: false, follow: false } };
export default async function Page() {
  const account = await customerSession(true); if (!account) redirect('/login');
  if (account.user.mustChangePassword) redirect('/account/change-password');
  if (account.user.role !== 'admin') notFound();
  return <Container className="py-14 md:py-20"><p className="text-[12px] uppercase tracking-[3px] text-muted">Private administration</p><h1 className="mb-8 mt-4 text-[38px] font-medium">Authorized members</h1><UserManagement/></Container>;
}
