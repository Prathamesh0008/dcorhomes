"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers3, PanelsTopLeft, Mail, Users, KeyRound } from 'lucide-react';
import { Logout } from '@/components/account/AccountActions';
const links = [
  ['/admin', 'Overview', LayoutDashboard], ['/admin/fabrics', 'Fabrics', Layers3],
  ['/admin/designs', 'Curtain Designs', PanelsTopLeft], ['/admin/enquiries', 'Enquiries', Mail],
  ['/admin/users', 'Administrators', Users], ['/admin/change-password', 'Change password', KeyRound],
] as const;
export default function AdminNavigation() {
  const pathname = usePathname();
  return <div className="border-b border-[#DFE4DA] bg-white"><nav aria-label="Administration" className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-2 px-[18px] py-4 sm:px-9 lg:px-[50px]">{links.map(([href, label, Icon]) => {
    const active = href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(href + '/');
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors sm:px-4 ${active ? 'border-[#20372E] bg-[#20372E] text-white' : 'border-[#DFE4DA] bg-white text-[#52665A] hover:bg-[#F5F6F2]'}`}><Icon size={16} strokeWidth={1.6}/>{label}</Link>;
  })}<div className="ml-auto px-2 text-[#52665A]"><Logout/></div></nav></div>;
}
