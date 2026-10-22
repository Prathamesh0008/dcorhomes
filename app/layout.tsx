import { fabricRecords } from '@/lib/server/fabric-records';
import FabricCatalogueProvider from '@/components/curtains/FabricCatalogueProvider';
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";
// Admin catalogue changes must reach direct Studio visits as well as collection navigation.
export const dynamic='force-dynamic';
export const metadata: Metadata = {
  title: {
    default: "Dcorhome | Curtains, beautifully considered",
    template: "%s | Dcorhome",
  },
  description:
    "Discover beautifully considered curtains. Explore custom drapery, experiment in our curtain design studio, and find the perfect fit for your home.",
  metadataBase: new URL(siteUrl),
  robots: process.env.SITE_URL ? {index:true,follow:true} : {index:false,follow:false},
  openGraph:{siteName:"Dcorhome",type:"website",title:"Dcorhome curtain design studio",description:"Explore fabrics and visualize a curtain direction in your own room."},
  icons: { icon: "/dcorhome-mark.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <FabricCatalogueProvider records={fabricRecords()} whatsappNumber={process.env.DCORHOME_WHATSAPP_NUMBER}><SiteHeader />
        <main>{children}</main>
        <SiteFooter /></FabricCatalogueProvider>
      </body>
    </html>
  );
}
