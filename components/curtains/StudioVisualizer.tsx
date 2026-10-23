"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useDesignOptions } from "@/lib/useDesignOptions";
import { studioHref, type DesignSelection } from "@/lib/design-options";
import { visualizerStyles } from "@/lib/visualizer";
import { composerPatterns } from "@/lib/curtains/composer";
import { fabricFor, manualDefault, manualSelection, manualSummary, normalizeManual, patternsFor, readManual, storageKey, type ManualConfig } from "@/lib/curtains/manual-config";
import { variantPhotos } from "@/lib/curtains/categories";
import { whatsappHref } from "@/lib/curtains/enquiry";
import ImageSelectionRow from "@/components/interactive/ImageSelectionRow";
import { useFabricRecords, useShowroomWhatsApp } from "./FabricCatalogueProvider";
import ManualPreview from "./ManualPreview";

type Props = { selection: Partial<DesignSelection>; onManualChange: (config: ManualConfig) => void; onStyleChange: (style: string) => void; onTryRoom: () => void; onUseAvailablePattern?: () => void };
const field = "mt-2 h-12 w-full min-w-0 border border-solid border-[#82917c] bg-[#31443a] px-3 text-[15px] text-paper";

export default function StudioVisualizer({ selection, onManualChange, onStyleChange, onTryRoom, onUseAvailablePattern }: Props) {
  const records = useFabricRecords(), number = useShowroomWhatsApp(), options = useDesignOptions();
  const [config, setConfig] = useState(() => normalizeManual(manualDefault, records));
  const [palette, setPalette] = useState(false), [notice, setNotice] = useState("");
  useEffect(() => { setConfig(readManual(selection, records)); }, [records, selection.manual, selection.fabric, selection.color, selection.heading, selection.sheerFabric, selection.sheerColor]);
  const main = fabricFor(config.mainFabric, "main", records), sheer = fabricFor(config.sheerFabric, "sheer", records);
  const style = selection.style || "Modern";
  const styles = visualizerStyles.filter(choice => options.styles.includes(choice.value));
  const extraStyles = options.styles.filter(name => !visualizerStyles.some(choice => choice.value === name)).map(value => ({ value, image: "/images/living-drapery-640.webp", description: "Explore this curtain mood" }));
  const inspiration = composerPatterns.find(choice => choice.value === selection.inspirationPattern)?.value;
  const incompatible = Boolean(inspiration && !patternsFor(main).includes(inspiration));
  const message = `Style: ${style}\n${incompatible ? `Pattern inspiration: ${inspiration} (availability to confirm)\n` : ""}${manualSummary(config, records)}`;
  const contact = `/contact?${new URLSearchParams({ interest: "Curtain design consultation", room: config.room, message })}`;
  const whatsapp = whatsappHref(number, message);

  function choose<K extends keyof ManualConfig>(key: K, value: ManualConfig[K]) {
    const requested = { ...config, [key]: value }, next = normalizeManual(requested, records);
    setConfig(next);
    setNotice(next.pattern !== requested.pattern ? `The pattern has been updated to ${next.pattern} to match this fabric.` : "");
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setNotice("Your choices are kept while this page stays open."); }
    onManualChange(next);
  }

  function layer(layer: "main" | "sheer") {
    const fabric = layer === "main" ? main : sheer, fabricKey = layer === "main" ? "mainFabric" : "sheerFabric", colorKey = layer === "main" ? "mainColor" : "sheerColor";
    return <div className="pb-5">
      <label className="block text-[15px]">{layer === "main" ? "Main curtain fabric" : "Sheer fabric"}<select aria-label={`${layer} fabric`} value={fabric.id} onChange={event => choose(fabricKey, event.target.value)} className={field}>{records.filter(f => f.active !== false && f.usage.includes(layer) && f.colors.some(c => c.active !== false && c.available !== false) && f.compatibleHeadingStyles.length).map(f => <option value={f.id} key={f.id}>{f.name}</option>)}</select></label>
      <fieldset className="m-0 mt-5 min-w-0 border-0 p-0"><legend className="mb-3 text-[15px]">{layer === "main" ? "Main curtain color" : "Sheer color"}</legend><div role="group" aria-label={`${layer} colors`} className="flex flex-wrap gap-2">{fabric.colors.filter(c => c.active !== false).map(color => <button key={color.id} type="button" disabled={color.available === false} aria-label={`${layer} color: ${color.name}`} aria-pressed={config[colorKey] === color.id} onClick={() => choose(colorKey, color.id)} className="inline-flex min-h-12 max-w-full items-center gap-2 border border-solid border-[#82917c] bg-transparent px-3 py-2 text-left text-[14px] text-paper aria-pressed:border-[#d4be96] aria-pressed:bg-[#40564a] disabled:opacity-40"><span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-sand">{color.swatchImage || color.digitalSwatchImage ? <img src={color.swatchImage || color.digitalSwatchImage} alt="" className="h-full w-full object-cover"/> : <span className="block h-full w-full" style={color.hexPreview ? { backgroundColor: color.hexPreview } : undefined}/>}</span><span>{color.name}</span>{config[colorKey] === color.id && <Check size={15} aria-hidden="true"/>}</button>)}</div></fieldset>
    </div>;
  }

  const patterns = patternsFor(main);
  const patternPhoto = variantPhotos(main, config.mainColor).find(p => p.mode !== "reference");
  return <div data-testid="restored-visualizer" className="min-w-0 bg-ink text-paper">
    <div className="mb-7 border-b border-solid border-[#647366] pb-6"><p className="mb-3 text-[12px] uppercase tracking-[2px] text-[#d4be96]">YOUR LAYERED CURTAIN STUDY</p><p className="mb-0 max-w-2xl text-[16px] leading-7 text-[#d6ddcf]">A style you love. A fabric that feels right. Bring your main curtains and sheers together, one considered choice at a time.</p></div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-10 xl:gap-14">
      <div className="order-2 min-w-0 lg:order-1">
        <ImageSelectionRow title="01 — Choose your style" value={style} choices={[...styles, ...extraStyles]} onChange={onStyleChange}/>
        <p className="mb-7 mt-2 text-[13px] leading-6 text-[#d6ddcf]">Editorial style inspiration. Pleat and heading choices are separate in Advanced Settings.</p>
        {incompatible && <div data-testid="pattern-compatibility" className="mb-6 border border-solid border-[#a8b59f] p-5"><p className="mb-3 text-[17px] font-medium">Your {inspiration} inspiration is saved.</p><p className="mb-4 text-[15px] leading-7 text-[#d6ddcf]">{main.name} currently supports {patterns.join(" or ")}. Your fabrics and shades are unchanged. Choose an available pattern below, or ask us to help find your preferred look.</p><button type="button" onClick={onUseAvailablePattern} className="min-h-12 border-b border-solid border-[#d4be96] bg-transparent px-0 text-left text-[15px] text-paper">Use {config.pattern} with my selected fabric</button><Link href={contact} className="mt-3 block min-h-11 py-2 text-[14px] underline underline-offset-4">Ask about {inspiration} curtains</Link></div>}
        <ImageSelectionRow title="02 — Choose your pattern" value={config.pattern} choices={patterns.map(value => ({ value, image: patternPhoto?.src, description: main.source === "demo" ? "Illustrative fabric study" : `${main.name} pattern` }))} onChange={value => { choose("pattern", value); onUseAvailablePattern?.(); }}/>
        <p className="mb-7 mt-2 text-[13px] leading-6 text-[#d6ddcf]">{main.source === "demo" ? "Demo palette; supplier patterns and availability require confirmation." : "Patterns follow the selected fabric's catalogue record."}</p>
        <details open className="border-t border-solid border-[#647366] pt-1"><summary className="min-h-14 cursor-pointer py-4 text-[20px]">03 — Main curtain <span className="block pl-5 text-[14px] text-[#d6ddcf]">{main.name} / {main.colors.find(c => c.id === config.mainColor)?.name}</span></summary>{layer("main")}</details>
        <details className="border-y border-solid border-[#647366] pt-1"><summary className="min-h-14 cursor-pointer py-4 text-[20px]">04 — Add a sheer <span className="block pl-5 text-[14px] text-[#d6ddcf]">{config.sheerEnabled ? `${sheer.name} / ${sheer.colors.find(c => c.id === config.sheerColor)?.name}` : "Main curtains only"}</span></summary><label className="mb-5 flex min-h-12 items-center gap-3 text-[15px]"><input type="checkbox" aria-label="Enable sheer layer" checked={config.sheerEnabled} onChange={event => choose("sheerEnabled", event.target.checked)} className="h-5 w-5 accent-[#d4be96]"/>Add light-filtering sheers</label>{config.sheerEnabled && layer("sheer")}</details>
        <details data-testid="advanced-customization" className="border-b border-solid border-[#647366]"><summary className="min-h-14 cursor-pointer py-4 text-[16px]">Advanced Settings</summary><div className="space-y-5 pb-6">
          <label className="flex min-h-12 items-center gap-3 text-[15px]"><input type="checkbox" checked={config.mainEnabled} onChange={event => choose("mainEnabled", event.target.checked)} className="h-5 w-5 accent-[#d4be96]"/>Include main curtains</label>
          {(["main", "sheer"] as const).map(layer => <label key={layer} className="block text-[15px]">{layer === "main" ? "Main curtain" : "Sheer"} heading<select aria-label={`${layer} heading`} value={layer === "main" ? config.heading : config.sheerHeading} onChange={event => choose(layer === "main" ? "heading" : "sheerHeading", event.target.value)} className={field}>{(layer === "main" ? main : sheer).compatibleHeadingStyles.map(heading => <option key={heading}>{heading}</option>)}</select></label>)}
          <label className="block text-[15px]">Finished length<select value={config.curtainLength} onChange={event => choose("curtainLength", event.target.value)} className={field}>{["Floor length", "Sill length", "Below sill"].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="block text-[15px]">Fullness<select value={config.fullness} onChange={event => choose("fullness", event.target.value)} className={field}><option value="1.5">Relaxed — 1.5×</option><option value="2">Full — 2×</option><option value="2.5">Extra full — 2.5×</option></select></label>
          <label className="block text-[15px]">Panels<select value={config.panels} onChange={event => choose("panels", event.target.value as "Single" | "Pair")} className={field}><option value="Pair">Two panels</option><option value="Single">One panel</option></select></label>
          <label className="block text-[15px]">Reference room<select aria-label="Room preview" value={config.room} onChange={event => choose("room", event.target.value)} className={field}>{["Living Room", "Bedroom", "Dining Room", "Home Office", "Guest Room", "Nursery"].map(room => <option key={room}>{room}</option>)}</select></label>
          <p className="text-[14px] leading-6 text-[#d6ddcf]">Our team can advise on lining, hardware and manufacturer details.</p>
        </div></details>
        <p role="status" className="mt-4 text-[14px] leading-6 text-[#e0d0b4]">{notice}</p>
      </div>
      <div className="contents lg:sticky lg:top-28 lg:order-2 lg:block">
        <div className="order-1 min-w-0">
        <div role="group" aria-label="Curtain preview" className="mb-4 flex flex-wrap gap-2">{[[false, "Room color study"], [true, "Selected fabrics"]].map(([enabled, label]) => <button key={String(label)} type="button" aria-pressed={palette === enabled} onClick={() => setPalette(enabled as boolean)} className="min-h-11 rounded-full border border-solid border-[#82917c] bg-transparent px-4 text-[14px] text-paper aria-pressed:bg-paper aria-pressed:text-ink">{label}</button>)}</div>
        <div className="bg-paper p-3 text-ink sm:p-4"><ManualPreview config={config} referenceStudy={!palette}/></div>
        </div>
        <section data-testid="curtain-config-summary" aria-label="Your curtain design" className="order-3 mt-6 min-w-0 border-t border-solid border-[#647366] pt-6"><h2 className="mb-4 text-[12px] uppercase tracking-[2px] text-[#d4be96]">YOUR CURTAIN DESIGN</h2><dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-[15px] leading-6"><dt className="text-[#d6ddcf]">Style</dt><dd className="m-0">{style}</dd><dt className="text-[#d6ddcf]">Pattern</dt><dd className="m-0">{config.pattern}</dd><dt className="text-[#d6ddcf]">Main curtain</dt><dd className="m-0">{config.mainEnabled ? `${main.name} / ${main.colors.find(c => c.id === config.mainColor)?.name}` : "Not included"}</dd><dt className="text-[#d6ddcf]">Sheer curtain</dt><dd className="m-0">{config.sheerEnabled ? `${sheer.name} / ${sheer.colors.find(c => c.id === config.sheerColor)?.name}` : "Not included"}</dd></dl>
          <button type="button" onClick={onTryRoom} className="mt-6 flex min-h-14 w-full items-center justify-center gap-5 bg-paper px-5 text-[15px] text-ink">Preview My Curtains <ArrowUpRight size={18}/></button><Link data-testid="design-enquiry" href={contact} className="mt-3 flex min-h-14 w-full items-center justify-center border border-solid border-[#82917c] px-4 text-center text-[15px]">Enquire About This Design</Link>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-[14px] underline">Enquire on WhatsApp</a>}
          <Link href={`${studioHref({ ...manualSelection(config, records), style })}&mode=upload`} className="mt-3 inline-flex min-h-11 items-center text-[14px] underline underline-offset-4">Open these choices in my room</Link>
        </section>
      </div>
    </div>
  </div>;
}
