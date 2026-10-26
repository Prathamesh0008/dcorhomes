import ServerCatalogueProvider from '@/components/curtains/ServerCatalogueProvider';
import { pageMetadata } from "@/lib/seo";
export const metadata={...pageMetadata("Your curtain design studio","Upload your room, customize curtains and compare an AI design when available.","/studio")};
export default function Layout({children}:{children:React.ReactNode}) {return <ServerCatalogueProvider>{children}</ServerCatalogueProvider>;}
