import AuthPage from "@/components/account/AuthPage";
import { authProvider, clerkConfigured } from '@/lib/auth-provider';
import { ClerkLogin } from '@/components/account/ClerkAccount';
import { Brand } from '@/components/navigation/Brand';
import { redirect } from 'next/navigation';
import { accountAuthState } from '@/lib/server/account-session';
import AccountAccessNotice from '@/components/account/AccountAccessNotice';
import { authDestination, authNavigationDiagnostic } from '@/lib/auth-navigation';
export const metadata = { title: "Welcome back.", robots: { index: false, follow: false } };
export default async function Page() {
  const state = await accountAuthState(true);
  authNavigationDiagnostic('/login', state.provider, state.status);
  const destination = authDestination('/login', state.status);
  if (destination) redirect(destination);
  if (authProvider() !== 'clerk') return <AuthPage mode="login" title="Welcome back." description="Sign in with the User ID provided by your Dcorhome administrator."/>;
  if (state.status === 'denied' || state.status === 'unavailable') return <section className="mx-auto max-w-lg px-6 py-20"><Brand/><AccountAccessNotice unavailable={state.status === 'unavailable'} canSignOut={clerkConfigured()}/></section>;
  return <section className="bg-paper px-6 py-16 text-ink sm:py-24"><div className="mx-auto w-full max-w-md"><Brand/><h1 className="mb-4 mt-12 text-[40px] font-medium tracking-[-1px]">Welcome back.</h1><p className="mb-8 leading-7 text-muted">Sign in with your authorized Dcorhome account.</p>{clerkConfigured() ? <ClerkLogin/> : <p role="alert">Member sign-in is temporarily unavailable. Please contact <a className="underline" href="mailto:sales@dcorhome.com">sales@dcorhome.com</a>.</p>}<p className="mt-8 text-sm leading-6 text-muted">Accounts are authorized by Dcorhome. For access or account recovery, contact <a className="underline" href="mailto:sales@dcorhome.com">sales@dcorhome.com</a>.</p></div></section>;
}
