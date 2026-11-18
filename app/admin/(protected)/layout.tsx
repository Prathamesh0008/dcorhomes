import { pageMetadata } from "@/lib/seo";
import { accountSession } from '@/lib/server/account-session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { Logout } from '@/components/account/AccountActions';
export const metadata={...pageMetadata("Atelier administration","Protected Dcorhome administration.","/admin"),robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){
 const account=await accountSession(true);
 if(!account)redirect('/admin/login');
 if(account.user.mustChangePassword)redirect('/admin/change-password');
 if(account.user.role!=='admin')notFound();
 return <><Container className="border-b border-[#dce1d7] py-4"><nav aria-label="Administration" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">{[['/admin','Overview'],['/admin/fabrics','Fabrics'],['/admin/designs','Curtain designs'],['/admin/enquiries','Enquiries'],['/admin/users','Administrators'],['/admin/change-password','Change password']].map(([href,label])=><Link key={href} href={href} className="inline-flex min-h-11 items-center underline">{label}</Link>)}<Logout/></nav></Container>{children}</>;
}
