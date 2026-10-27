"use client";
import { SignIn, UserProfile, useClerk, useAuth, useSession, TaskChooseOrganization, TaskResetPassword, TaskSetupMFA } from '@clerk/nextjs';
import { useState } from 'react';
import { clerkLoginView } from '@/lib/auth-navigation';
export function ClerkLogin() {
  const identity = useAuth({ treatPendingAsSignedOut: false });
  const { session, isLoaded } = useSession();
  const view = clerkLoginView(identity.isLoaded && isLoaded, Boolean(identity.sessionId || session), session?.status === 'pending' || Boolean(session?.currentTask));
  if (view === 'loading') return <p role="status">Checking your sign-in…</p>;
  if (view === 'tasks') {
    if (session?.currentTask?.key === 'reset-password') return <TaskResetPassword redirectUrlComplete="/login"/>;
    if (session?.currentTask?.key === 'setup-mfa') return <TaskSetupMFA redirectUrlComplete="/login"/>;
    if (session?.currentTask?.key === 'choose-organization') return <TaskChooseOrganization redirectUrlComplete="/login"/>;
    return <div role="status"><p>Your sign-in needs additional verification. Please finish the verification requested by your account provider or contact Dcorhome.</p><ClerkLogout/></div>;
  }
  if (view === 'session_mismatch') return <div role="alert"><p className="leading-7">Your browser is signed in, but this website could not verify that session. Check your sign-in again or sign out and try again.</p><button className="min-h-11 underline" type="button" onClick={() => window.location.reload()}>Check sign-in</button><ClerkLogout/></div>;
  return <SignIn routing="hash" withSignUp={false} fallbackRedirectUrl="/account" appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full shadow-none', card: 'shadow-none border-0', headerTitle: 'hidden', headerSubtitle: 'hidden', footerAction: 'hidden' } }} />;
}
export function ClerkSecurity() { return <UserProfile routing="hash" />; }
export function ClerkLogout() {
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  return <div><button type="button" className="min-h-11 px-2 text-[14px] underline" disabled={busy} onClick={async () => {
    setBusy(true); setFailed(false);
    try { await signOut({ redirectUrl: '/login' }); }
    catch { setFailed(true); setBusy(false); }
  }}>Logout</button>{failed && <p role="alert">Could not log out. Please try again.</p>}</div>;
}
