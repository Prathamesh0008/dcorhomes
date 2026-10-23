"use client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Brand } from "./Brand";
import { mainLinks, aboutLinks, exploreLinks, routeActive } from "./DesktopNavigation";
import StudioLink from "./StudioLink";
import { Logout } from "@/components/account/AccountActions";
export default function MobileNavigation({ open, signedIn, onClose }: { open: boolean; signedIn: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), close = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current; if (!element) return;
    element.showModal(); close.current?.focus();
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previous; };
  }, [open]);
  if (!open) return null;
  return createPortal(<dialog ref={dialog} id="mobile-menu" aria-label="Dcorhome navigation" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-ink backdrop:bg-transparent">
    <button type="button" tabIndex={-1} aria-label="Close navigation backdrop" onClick={onClose} className="absolute inset-0 h-full w-full border-0 bg-[#172b2366]"/>
    <div className="absolute inset-y-0 right-0 w-full max-w-[440px] overflow-y-auto overscroll-contain bg-paper px-6 pb-9 sm:px-8" onClick={event => { if ((event.target as Element).closest("a")) onClose(); }}>
      <div className="flex min-h-[88px] items-center justify-between gap-3 border-b border-solid border-[#e5e0d5]"><Brand/><button ref={close} type="button" aria-label="Close navigation" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center bg-transparent"><X size={23} strokeWidth={1.3}/></button></div>
      <p className="mb-3 mt-7 text-[10px] uppercase tracking-[2.7px] text-[#9c896e]">The curtain atelier</p>
      <nav aria-label="Mobile navigation" className="grid">{[...mainLinks, ...aboutLinks].map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className="flex min-h-12 items-center text-[21px] font-medium tracking-[-.3px] text-[#667064] transition-colors hover:text-ink aria-[current=page]:text-ink">{item.label}<span aria-hidden="true" className={`ml-auto h-px w-6 bg-[#b29a79] ${routeActive(pathname, item.href) ? "" : "invisible"}`}/></Link>)}</nav>
      <nav aria-label="Explore" className="my-5 grid grid-cols-2 gap-x-5 border-y border-solid border-[#e5e0d5] py-3">{exploreLinks.map(item => <Link key={item.href} href={item.href} aria-current={routeActive(pathname, item.href) ? "page" : undefined} className="flex min-h-11 items-center text-[14px] text-muted aria-[current=page]:text-ink">{item.label}</Link>)}</nav>
      <nav aria-label="Customer account" className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px]">{(signedIn ? [{ href: "/account", label: "My Account" }, { href: "/account#saved-designs", label: "Saved Designs" }] : [{ href: "/login", label: "Login" }, { href: "/signup", label: "Sign Up" }]).map(item => <Link key={item.href} href={item.href} className="flex min-h-11 items-center">{item.label}</Link>)}{signedIn && <Logout/>}</nav>
      <StudioLink className="w-full min-h-12"/>
      <p className="mb-0 mt-6 text-[13px] font-serif italic text-muted">Curtains, considered. A home, beautifully yours.</p>
    </div>
  </dialog>, document.body);
}
