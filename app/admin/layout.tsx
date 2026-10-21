import { pageMetadata } from "@/lib/seo";
export const metadata={...pageMetadata("Atelier administration","Protected Dcorhome administration.","/admin"),robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return children;}
