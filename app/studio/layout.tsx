import ServerCatalogueProvider from '@/components/curtains/ServerCatalogueProvider';
import { pageMetadata } from "@/lib/seo";
export const metadata={...pageMetadata("Curtain visualizer","Explore supported main and sheer curtain combinations with an illustrative manual preview.","/studio")};
export default function Layout({children}:{children:React.ReactNode}) {return <ServerCatalogueProvider>{children}</ServerCatalogueProvider>;}
