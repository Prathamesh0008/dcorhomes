import { pageMetadata } from "@/lib/seo";
import { accountSession } from '@/lib/server/account-session';
import { redirect, notFound } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
export const metadata={...pageMetadata("Atelier administration","Protected Dcorhome administration.","/admin"),robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){
 const account=await accountSession(true);
 if(!account)redirect('/admin/login');
 if(account.user.mustChangePassword)redirect('/admin/change-password');
 if(account.user.role!=='admin')notFound();
 return <div className="min-h-screen bg-[#F5F6F2] text-[#20372E]"><AdminNavigation/>{children}</div>;
}
