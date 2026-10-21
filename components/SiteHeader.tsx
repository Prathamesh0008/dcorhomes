"use client";
﻿import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Container from "@/components/ui/Container";
const navigation = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Fabrics" },
  { href: "/studio", label: "Design Studio" },
  { href: "/measure", label: "Size Guide" },
  { href: "/inspiration", label: "Inspiration" },
];
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Dcorhome home"
      className={`inline-flex flex-col gap-2 ${light ? "text-paper" : "text-ink"}`}
    >
      <span className="flex items-center gap-3 text-[26px] font-semibold leading-none tracking-[-1px] sm:text-[28px]">
        <span aria-hidden="true" className="flex h-7 items-center gap-[3px] text-bronze">
          <span className="h-5 w-px bg-current" />
          <span className="h-7 w-px bg-current" />
          <span className="h-5 w-px bg-current" />
        </span>
        <span>
        DCOR<span className="font-normal">HOME</span>
        </span>
      </span>
      <span
        className={`text-[8px] font-medium uppercase tracking-[2.7px] ${light ? "text-[#aeb8a9]" : "text-[#8a8e7f]"}`}
      >
        Curtain atelier
      </span>
    </Link>
  );
}
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open) mobileMenu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab" && open) {
        const links = mobileMenu.current?.querySelectorAll<HTMLAnchorElement>("a");
        const last = links?.[links.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); toggle.current?.focus();
        } else if (e.shiftKey && document.activeElement === toggle.current) {
          e.preventDefault(); last?.focus();
        }
      }
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header className="sticky top-0 z-50 border-b border-solid border-[#e2dfd5] bg-paper/90 backdrop-blur-xl">
      <Container className="flex h-[78px] items-center justify-between gap-4 xl:grid xl:h-[88px] xl:grid-cols-[1fr_auto_1fr]">
        <Brand />
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 rounded-full border border-solid border-[#e6e1d6] bg-cream/70 p-1 xl:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="flex min-h-11 items-center rounded-full px-4 text-[13px] font-medium text-muted transition-colors hover:bg-sand/60 hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/studio"
          className="group hidden min-h-12 justify-self-end items-center gap-4 rounded-full border border-solid border-[#ffffff20] bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-[#40564a] xl:flex"
        >
          Design Your Space <ArrowUpRight size={16} strokeWidth={1.5} className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
        </Link>
        <button
          ref={toggle}
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
          className="grid h-11 w-11 place-items-center rounded-full border border-solid border-[#d8d5cb] bg-cream text-ink transition-colors hover:bg-sand xl:hidden"
        >
          {open ? (
            <X size={22} strokeWidth={1.4} />
          ) : (
            <Menu size={22} strokeWidth={1.4} />
          )}
        </button>
      </Container>
        <nav
          ref={mobileMenu}
          inert={!open}
          aria-hidden={!open}
          id="mobile-menu"
          aria-label="Mobile navigation"
          className={`absolute inset-x-0 top-full max-h-[calc(100dvh_-_78px)] overflow-y-auto border-b border-solid border-[#d8d5cb] bg-paper px-6 pb-7 pt-3 shadow-lg transition-[opacity,transform,visibility] duration-200 xl:hidden ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}
        >
          {[...navigation, { href: "/contact", label: "Consultation" }].map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { setOpen(false); toggle.current?.focus(); }}
                aria-current={pathname === item.href ? "page" : undefined}
                className="flex min-h-14 items-center justify-between border-b border-solid border-[#e5e2d9] text-[13px] text-muted aria-[current=page]:text-ink"
              >
                {item.label}
                <ArrowUpRight size={15} strokeWidth={1.3} />
              </Link>
            ),
          )}
          <Link href="/studio" onClick={() => setOpen(false)} className="mt-6 flex min-h-12 items-center justify-between rounded-full bg-ink px-6 text-[13px] font-medium text-paper">
            Design Your Space <ArrowUpRight size={16} />
          </Link>
        </nav>
    </header>
  );
}
