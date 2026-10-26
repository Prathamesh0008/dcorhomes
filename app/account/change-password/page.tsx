import { redirect } from 'next/navigation';
import { customerSession } from '@/lib/server/customer-auth';
import Container from '@/components/ui/Container';
import ChangePassword from '@/components/account/ChangePassword';
export const metadata = { title: 'Change password', robots: { index: false, follow: false } };
export default async function Page() {
  const account = await customerSession(true); if (!account) redirect('/login');
  return <Container className="py-14 md:py-24"><h1 className="mb-6 text-[38px] font-medium">Change your password</h1>{account.user.mustChangePassword && <p className="mb-8 max-w-lg text-muted">Before accessing your account, replace the temporary password supplied by your administrator.</p>}<ChangePassword userId={account.user.userId}/></Container>;
}
