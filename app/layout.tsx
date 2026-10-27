import { ShowroomContactProvider } from '@/components/curtains/FabricCatalogueProvider';
import { siteUrl } from "@/lib/seo";
import seo from "@/data/site/seo.json";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";
// Catalogue queries are scoped to the routes that consume them.
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata: Metadata = {
  title: {
    default: seo.defaultTitle,
    template: "%s | Dcorhome",
  },
  description:
    seo.description,
  metadataBase: new URL(siteUrl),
  robots: process.env.SITE_URL ? {index:true,follow:true} : {index:false,follow:false},
  openGraph:{siteName:"Dcorhome",type:"website",title:"Dcorhome curtain design studio",description:"Explore fabrics and visualize a curtain direction in your own room."},
  icons: { icon: "/dcorhome-mark.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-pt-[100px]">
      <body>
        <ShowroomContactProvider whatsappNumber={process.env.DCORHOME_WHATSAPP_NUMBER}><SiteHeader />
        <main>{children}</main>
        <SiteFooter /></ShowroomContactProvider>
      </body>
    </html>
  );
}
