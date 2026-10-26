import ServerCatalogueProvider from '@/components/curtains/ServerCatalogueProvider';
import { pageMetadata } from "@/lib/seo";
export const metadata={...pageMetadata("Saved curtain designs","Reopen private guest-session and browser-local curtain directions.","/designs"),robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}) {return <ServerCatalogueProvider>{children}</ServerCatalogueProvider>;}
