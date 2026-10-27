import Link from 'next/link';
import { redirect } from 'next/navigation';
import { customerSession } from '@/lib/server/customer-auth';
import { Logout } from '@/components/account/AccountActions';
import Container from '@/components/ui/Container';
export const dynamic='force-dynamic';
export const metadata={title:'My account',robots:{index:false,follow:false}};
export default async function Account(){
 const session=await customerSession(true);if(!session)redirect('/login');
 if(session.user.mustChangePassword)redirect('/account/change-password');
 const email=session.user.email.endsWith('@members.invalid')?'':session.user.email;
 return <Container className="py-14 md:py-24"><p className="text-[12px] uppercase tracking-[3px] text-muted">Your personal atelier</p><div className="flex flex-wrap items-center justify-between gap-5"><h1 className="my-5 break-words text-[38px] font-medium leading-tight tracking-[-1px] sm:text-[56px]">Welcome, {session.user.name}.</h1><Logout/></div><p className="break-all text-muted">User ID: {session.user.userId}{email?` ? ${email}`:''}</p><div className="mt-8 flex flex-wrap gap-6 text-[15px] underline"><Link href="/account/change-password">Change password</Link>{session.user.role==='admin'&&<Link href="/admin/users">Manage users</Link>}</div><section id="saved-designs" className="mt-12 border-t border-solid border-[#d8dcd3] pt-10"><h2 className="mb-5 text-[28px] font-medium">Saved curtain designs</h2><p>New designs are saved in this browser/device, without account synchronization. Clearing browser storage removes them. Earlier cloud designs have not been deleted. Contact Dcorhome for a private export; the export can be imported on My Saved Designs.</p><Link href="/designs" className="inline-flex min-h-12 underline">My Saved Designs</Link><p>Enquiries are sent by email. Please keep your email confirmation or download a copy of your design.</p></section></Container>;
}
