import { ArrowUpRight } from "lucide-react";
import { business, officeDirectionsUrl } from "@/lib/business";

export default function OfficeDetails({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "text-[#bfccb8]" : "text-muted"}>
    <p className={`mb-3 text-[11px] uppercase tracking-[2px] ${compact ? "text-[#c6b69e]" : "text-bronze"}`}>Our office · Navi Mumbai</p>
    <address className={`m-0 max-w-[440px] font-normal not-italic ${compact ? "text-[13px] leading-6" : "text-[16px] leading-8"}`}>{business.officeAddress}</address>
    <a href={officeDirectionsUrl} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-flex min-h-11 items-center gap-3 border-b border-solid text-[14px] ${compact ? "border-[#819179] text-paper" : "border-[#c8baa6] text-ink"}`}>Get Directions<ArrowUpRight size={15} strokeWidth={1.4} aria-hidden="true"/><span className="sr-only"> (opens Google Maps in a new tab)</span></a>
  </div>;
}
