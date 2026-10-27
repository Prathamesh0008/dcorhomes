import { pageMetadata } from "@/lib/seo";
import { accountSession } from '@/lib/server/account-session';
import ClerkScope from '@/components/account/ClerkScope';
import { redirect, notFound } from 'next/navigation';
export const metadata={...pageMetadata("Atelier administration","Protected Dcorhome administration.","/admin"),robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){
 const account=await accountSession(true);
 if(!account)redirect('/login');
 if(account.user.mustChangePassword)redirect('/account/change-password');
 if(account.user.role!=='admin')notFound();
 return <ClerkScope>{children}</ClerkScope>;
}
