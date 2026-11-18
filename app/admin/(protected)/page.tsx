import Link from 'next/link';
import Container from '@/components/ui/Container';
import { typography } from '@/lib/typography';
export default function Admin() {
  return <Container as="section" className="py-12 md:py-20"><h1 className={typography.page}>Atelier <em className="font-serif font-normal text-bronze">administration.</em></h1><p className="my-6 max-w-3xl text-[15px] leading-7 text-muted">Manage private fabric and curtain design drafts, follow up product enquiries, and maintain authorized administrator accounts. Catalogue changes are exported for repository review and deployment.</p><div className="grid gap-5 sm:grid-cols-2">{[['/admin/fabrics','Manage fabrics'],['/admin/designs','Manage curtain designs'],['/admin/enquiries','Manage product enquiries'],['/admin/users','Manage administrators']].map(([href,label])=><Link href={href} key={href} className="rounded-xl border border-[#dce1d7] bg-white p-6 text-lg hover:border-ink">{label}</Link>)}</div></Container>;
}
