"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Brand } from "@/components/navigation/Brand";
import DesktopNavigation from "@/components/navigation/DesktopNavigation";
import MobileNavigation from "@/components/navigation/MobileNavigation";
import StudioLink from "@/components/navigation/StudioLink";
import AccountNavigation from "@/components/account/AccountNavigation";
export { Brand } from "@/components/navigation/Brand";
export default function SiteHeader({ signedIn = false, isAdmin = false }: { signedIn?: boolean; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setOpen(false); requestAnimationFrame(() => toggle.current?.focus()); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12); update();
    window.addEventListener("scroll", update, { passive: true });
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", resize);
    return () => { window.removeEventListener("scroll", update); desktop.removeEventListener("change", resize); };
  }, []);
  return <header data-scrolled={scrolled} className={`sticky top-0 z-50 border-b border-solid transition-[background-color,border-color,backdrop-filter] duration-200 ${scrolled ? "border-[#e2dfd5] bg-paper/95 backdrop-blur-md" : "border-[#e2dfd580] bg-paper"}`}>
    <div className="mx-auto flex h-[80px] max-w-[1840px] flex-nowrap items-center gap-5 px-[18px] sm:h-[84px] sm:px-7 lg:gap-4 xl:gap-6 xl:px-10 min-[1600px]:px-14">
      <div className="shrink-0"><Brand/></div>
      <DesktopNavigation/>
      <div className="ml-auto hidden shrink-0 items-center gap-5 lg:flex xl:gap-6"><AccountNavigation signedIn={signedIn} isAdmin={isAdmin}/><span aria-hidden="true" className="h-5 w-px bg-[#d6ccba]"/><StudioLink/></div>
      <div className="ml-auto flex items-center gap-5 lg:hidden"><StudioLink tabletOnly/><button ref={toggle} type="button" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "mobile-menu" : undefined} onClick={() => setOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center bg-transparent text-ink"><Menu size={25} strokeWidth={1.25}/></button></div>
    </div>
    <MobileNavigation open={open} signedIn={signedIn} isAdmin={isAdmin} onClose={close}/>
  </header>;
}
