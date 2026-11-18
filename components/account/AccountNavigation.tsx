"use client";
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { navigationLink } from '@/components/navigation/NavigationDropdown';
export default function AccountNavigation({ administrator = false, className = '' }: { administrator?: boolean; className?: string }) {
  return <Link href={administrator ? '/admin' : '/admin/login'} className={`${navigationLink} inline-flex shrink-0 gap-2 ${className}`}><UserRound size={17} strokeWidth={1.4} aria-hidden="true"/><span>{administrator ? 'My Account' : 'Login'}</span></Link>;
}
