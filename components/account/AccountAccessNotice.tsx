import Link from 'next/link';
import { ClerkLogout } from './ClerkAccount';
export default function AccountAccessNotice({ unavailable = false, canSignOut = false }: { unavailable?: boolean; canSignOut?: boolean }) {
  return <div role="alert"><h2 className="my-6 text-2xl">{unavailable ? 'Sign-in is temporarily unavailable.' : 'Account access unavailable.'}</h2><p className="leading-7">{unavailable ? 'We could not verify your account. Please try again later.' : 'Your account is not currently authorized for Dcorhome. Please contact our team for assistance.'} <a className="underline" href="mailto:sales@dcorhome.com">sales@dcorhome.com</a></p><Link href="/login" className="inline-flex min-h-11 items-center underline">Check sign-in</Link>{canSignOut && <ClerkLogout/>}</div>;
}
