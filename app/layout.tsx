import { ShowroomContactProvider } from '@/components/curtains/FabricCatalogueProvider';
import { siteUrl, indexingAllowed } from "@/lib/seo";
import seo from "@/data/site/seo.json";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";
// Catalogue queries are scoped to the routes that consume them.
// Preserve the in-progress authentication work's request-time rendering boundary.
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
  robots: {index:indexingAllowed(),follow:indexingAllowed()},
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  twitter: {card:'summary_large_image',title:seo.defaultTitle,description:seo.description,images:[seo.socialImage]},
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
