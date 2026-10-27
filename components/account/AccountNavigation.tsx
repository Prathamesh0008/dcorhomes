"use client";
import Link from "next/link";
import { Logout } from "./AccountActions";
import NavigationDropdown, { dropdownLink, navigationLink } from "@/components/navigation/NavigationDropdown";
export default function AccountNavigation({ signedIn, isAdmin = false, resolved = true }: { signedIn: boolean; isAdmin?: boolean; resolved?: boolean }) {
  if (!resolved) return <Link href="/account" className={navigationLink}>Account</Link>;
  return <div className="shrink-0">
    {!signedIn && <div className="hidden items-center gap-4 min-[1440px]:flex"><Link href="/login" className={`${navigationLink} inline-flex`}>Login</Link></div>}
    <div className={signedIn ? "" : "min-[1440px]:hidden"}><NavigationDropdown label={signedIn ? "My Account" : "Account"} align="right">
      {signedIn ? <><Link href="/account" className={dropdownLink}>My Account</Link>{isAdmin ? <Link href="/admin/users" className={dropdownLink}>Manage Users</Link> : <Link href="/account#saved-designs" className={dropdownLink}>Saved Designs</Link>}<div className="mt-2 border-t border-solid border-[#e5e0d5] px-1 pt-2"><Logout/></div></> : <><Link href="/login" className={dropdownLink}>Login</Link></>}
    </NavigationDropdown></div>
  </div>;
}
