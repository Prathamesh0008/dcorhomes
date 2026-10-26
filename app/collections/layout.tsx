import ServerCatalogueProvider from '@/components/curtains/ServerCatalogueProvider';
import { pageMetadata } from "@/lib/seo";
export const metadata={...pageMetadata("Curtain fabrics and design directions","Explore fabric textures, palette directions and curtain references.","/collections")};
export default function Layout({children}:{children:React.ReactNode}) {return <ServerCatalogueProvider>{children}</ServerCatalogueProvider>;}
