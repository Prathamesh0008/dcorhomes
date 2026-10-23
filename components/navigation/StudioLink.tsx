import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function StudioLink({ className = "", tabletOnly = false, onClick }: { className?: string; tabletOnly?: boolean; onClick?: () => void }) {
  return <Link href="/studio" onClick={onClick} className={`${tabletOnly ? "hidden sm:inline-flex" : "inline-flex"} min-h-11 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#40564a] min-[1440px]:px-5 min-[1440px]:text-[14px] ${className}`}>Design Your Space<ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true"/></Link>;
}
