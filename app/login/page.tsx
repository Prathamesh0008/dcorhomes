import AuthPage from '@/components/account/AuthPage';
import { redirect } from 'next/navigation';
import { accountAuthState } from '@/lib/server/account-session';
export const metadata = { title: 'Welcome back.', robots: { index: false, follow: false } };
export default async function Page() {
  const state = await accountAuthState(true);
  if (state.status === 'authenticated') redirect('/account');
  return <AuthPage mode="login" title="Welcome back." description="Sign in with the User ID provided by your Dcorhome administrator." notice={state.status === 'unavailable' ? 'Authentication is temporarily unavailable. Please try again later.' : undefined}/>;
}
