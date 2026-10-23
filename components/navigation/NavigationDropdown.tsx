"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
export const navigationLink = "relative min-h-11 items-center whitespace-nowrap text-[14px] font-medium text-[#667064] transition-colors hover:text-ink focus-visible:rounded-sm after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[#b29a79] after:transition-transform hover:after:scale-x-100 aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100";
export const dropdownLink = "flex min-h-11 items-center whitespace-nowrap px-3 text-[14px] text-[#667064] transition-colors hover:bg-[#f3f0e8] hover:text-ink aria-[current=page]:bg-[#f3f0e8] aria-[current=page]:text-ink";
export default function NavigationDropdown({ label, children, active = false, align = "left" }: { label: string; children: ReactNode; active?: boolean; align?: "left" | "right" }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false; };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return <details ref={ref} className="group/dropdown relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && ref.current) ref.current.open = false; }} onClick={event => { if ((event.target as Element).closest("a") && ref.current) ref.current.open = false; }} onKeyDown={event => {
    const element = ref.current; if (!element) return;
    if (event.key === "Escape" && element.open) { event.preventDefault(); event.stopPropagation(); element.open = false; element.querySelector("summary")?.focus(); }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); element.open = true;
      const items = Array.from(element.querySelectorAll<HTMLElement>("a,button:not([disabled])"));
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (index + 1) % items.length : (index <= 0 ? items.length : index) - 1;
      items[next]?.focus();
    }
  }}>
    <summary className={`${navigationLink} inline-flex cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden ${active ? "text-ink after:scale-x-100" : ""}`}>{label}<ChevronDown aria-hidden="true" size={12} strokeWidth={1.5} className="transition-transform group-open/dropdown:rotate-180"/></summary>
    <div className={`absolute top-full z-50 min-w-52 border border-solid border-[#e5e0d5] bg-paper p-2 pt-3 shadow-[0_12px_24px_-16px_#25342f40] ${align === "right" ? "right-0" : "-left-3"}`}><div className="mb-2 ml-3 h-px w-6 bg-[#b29a79]"/>{children}</div>
  </details>;
}
