import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";
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
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
