import AuthPage from '@/components/account/AuthPage';
import { redirect } from 'next/navigation';
import { accountAuthState } from '@/lib/server/account-session';
export const metadata = { title: 'Administrator sign in.', robots: { index: false, follow: false } };
export default async function Page() {
  const state = await accountAuthState(true);
  if (state.status === 'authenticated') redirect(state.account.user.mustChangePassword ? '/admin/change-password' : '/admin');
  return <AuthPage mode="login" title="Welcome back." description="Private access for authorized Dcorhome administrators." notice={state.status === 'unavailable' ? 'Authentication is temporarily unavailable. Please try again later.' : undefined}/>;
}
