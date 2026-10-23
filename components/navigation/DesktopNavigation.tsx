"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavigationDropdown, { dropdownLink, navigationLink } from "./NavigationDropdown";
export const mainLinks = [{ href: "/", label: "Home" }, { href: "/collections", label: "Fabrics" }, { href: "/studio", label: "Design Studio" }];
export const aboutLinks = [{ href: "/about", label: "About Us" }, { href: "/contact", label: "Contact Us" }];
export const exploreLinks = [{ href: "/measure", label: "Size Guide" }, { href: "/inspiration", label: "Inspiration" }, { href: "/faq", label: "FAQ" }];
export function routeActive(pathname: string, href: string) { return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"); }
export default function DesktopNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-5 min-[1440px]:gap-6">
    {mainLinks.map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className={`${navigationLink} inline-flex`}>{item.label}</Link>)}
    <NavigationDropdown label="Explore" active={exploreLinks.some(item => routeActive(pathname, item.href))}>
      {exploreLinks.map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className={dropdownLink}>{item.label}</Link>)}
      <div className="mt-2 border-t border-solid border-[#e5e0d5] pt-2 xl:hidden">{aboutLinks.map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className={dropdownLink}>{item.label}</Link>)}</div>
    </NavigationDropdown>
    {aboutLinks.map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className={`${navigationLink} hidden xl:inline-flex`}>{item.label}</Link>)}
  </nav>;
}
