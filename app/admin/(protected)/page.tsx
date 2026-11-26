import Link from 'next/link';
import { ArrowUpRight, Layers3, PanelsTopLeft, Mail, Users } from 'lucide-react';
import Container from '@/components/ui/Container';
const sections = [
  ['/admin/fabrics', 'Fabrics', 'Manage and export private fabric drafts.', Layers3],
  ['/admin/designs', 'Curtain Designs', 'Manage and export curtain design drafts.', PanelsTopLeft],
  ['/admin/enquiries', 'Enquiries', 'Review customer requests and follow-ups.', Mail],
  ['/admin/users', 'Administrators', 'Manage team members and account access.', Users],
] as const;
export default function Admin() {
  return <Container as="section" className="py-8 md:py-10"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Administration</p><h1 className="text-3xl font-medium tracking-tight">Overview</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted">Manage your private drafts, customer enquiries and administrator accounts in one place. Catalogue changes are exported for review and deployment.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{sections.map(([href, title, description, Icon]) => <Link href={href} key={href} className="group rounded-xl border border-[#DFE4DA] bg-white p-5 shadow-sm transition-colors hover:border-[#849B89]"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-lg bg-[#E8F0E3] text-[#20372E]"><Icon size={20} strokeWidth={1.6}/></span><ArrowUpRight size={18} className="text-[#738377]"/></div><h2 className="mt-5 text-base font-medium">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></Link>)}</div></Container>;
}
