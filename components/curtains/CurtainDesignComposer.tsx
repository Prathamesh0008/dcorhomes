"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/ui/Container";
import ImageSelectionRow from "@/components/interactive/ImageSelectionRow";
import { typography } from "@/lib/typography";
import { composerDefault, composerHref, composerPatterns, composerRooms, composerStyles, validateComposer, type ComposerSelection } from "@/lib/curtains/composer";
import { readManual } from "@/lib/curtains/manual-config";
import { useFabricRecords } from "./FabricCatalogueProvider";

const draftKey = "dcorhome-composer-inspiration-v1";
export default function CurtainDesignComposer() {
  const records = useFabricRecords();
  const [selected, setSelected] = useState<ComposerSelection>(composerDefault);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setSelected(validateComposer(JSON.parse(saved)));
      else { const current = readManual(undefined, records); setSelected(validateComposer({ ...composerDefault, pattern: current.pattern, room: current.room })); }
    } catch { /* Preferences are optional; the controls still work without storage. */ }
  }, [records]);
  function choose(key: keyof ComposerSelection, value: string) {
    const next = validateComposer({ ...selected, [key]: value });
    setSelected(next);
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Keep the selection in this page. */ }
  }
  const matching = records.some(f => f.active !== false && f.pattern === selected.pattern);
  const catalogue = matching ? `/collections?${new URLSearchParams({ pattern: selected.pattern })}` : "/collections";
  return <section id="curtain-design-composer" data-home-section="design-composer" aria-labelledby="composer-heading" className="scroll-mt-28 border-b border-solid border-[#dedbd2] bg-cream py-12 md:py-20">
    <Container>
      <div className="mb-9 max-w-3xl md:mb-12"><p className="mb-4 text-[12px] uppercase tracking-[2px] text-[#907356]">A LITTLE INSPIRATION. ENTIRELY YOURS.</p><h2 id="composer-heading" className={`mb-5 ${typography.section}`}>Compose your perfect <em className="font-serif font-normal text-[#907356]">curtains</em></h2><p className="mb-0 text-[16px] leading-7 text-[#626b62]">Choose a style, explore patterns, and find the right look for your space.</p></div>
      <div className="space-y-9 md:space-y-12">
        <ImageSelectionRow title="01 — Style" tone="light" large value={selected.style} choices={composerStyles} onChange={value => choose("style", value)}/>
        <div><ImageSelectionRow title="02 — Pattern" tone="light" large value={selected.pattern} choices={composerPatterns} onChange={value => choose("pattern", value)}/><p className="mb-0 mt-2 max-w-3xl text-[13px] leading-6 text-[#626b62]">Pattern inspiration, including photographs of historic textiles. These references are not our stock catalogue; we’ll check your chosen pattern against your fabric as you continue.</p></div>
        <ImageSelectionRow title="03 — Room" tone="light" large value={selected.room} choices={composerRooms} onChange={value => choose("room", value)}/>
      </div>
      <div data-testid="composer-summary" className="mt-10 bg-ink p-6 text-paper sm:p-9 md:mt-12 md:p-12"><p className="mb-4 text-[12px] uppercase tracking-[2px] text-[#d4be96]">YOUR DESIGN</p><p aria-live="polite" aria-atomic="true" className="mb-5 max-w-4xl text-[25px] font-medium leading-[1.35] tracking-[-.6px] md:text-[36px]">Create your <span className="text-[#e3cfad]">{selected.style} {selected.pattern}</span> curtains for the <span className="text-[#e3cfad]">{selected.room}</span>.</p><p className="mb-7 max-w-2xl text-[15px] leading-7 text-[#d6ddcf]">Next, choose your fabrics and colors. Your existing main curtain and sheer choices stay with you.</p><div className="flex flex-wrap items-center gap-x-7 gap-y-4"><Link data-testid="composer-continue" href={composerHref(selected)} className="inline-flex min-h-14 items-center justify-center gap-6 bg-paper px-6 text-[15px] font-medium text-ink transition-colors hover:bg-sand">Continue Customizing <ArrowUpRight size={18}/></Link><Link data-testid="composer-fabrics" href={catalogue} className="inline-flex min-h-12 items-center gap-6 border-b border-solid border-[#a8b59f] text-[15px]">Explore Fabrics <ArrowUpRight size={18}/></Link></div>{!matching && selected.pattern !== "Solid" && <p className="mb-0 mt-6 text-[13px] leading-6 text-[#d6ddcf]">No verified {selected.pattern.toLowerCase()} fabric is listed yet. Explore the collection or discuss this inspiration with our team.</p>}</div>
    </Container>
  </section>;
}
