"use client";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
export default function HeroShowcaseControls({ index, count, paused, reducedMotion, onSelect, onPause, kind = "image", animateSingle = false }: { animateSingle?: boolean; kind?: "image" | "comparison"; index: number; count: number; paused: boolean; reducedMotion: boolean; onSelect: (index: number) => void; onPause: () => void }) {
  const control = "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-transparent text-ink transition-colors hover:bg-[#e9e5da] disabled:opacity-40";
  return <div className="flex items-center gap-1 px-2 sm:gap-2 sm:px-3">
    <select aria-label={`Choose curtain ${kind}`} value={index} onChange={event => onSelect(Number(event.target.value))} className="h-11 w-[76px] shrink-0 cursor-pointer border-0 bg-transparent pl-2 text-[12px] tabular-nums text-ink">{Array.from({ length: count }, (_, i) => <option key={i} value={i}>{String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</option>)}</select>
    <div aria-hidden="true" className="mx-1 flex min-w-0 flex-1 gap-1">{Array.from({ length: count }, (_, i) => <span key={i} className={`h-px min-w-0 flex-1 transition-colors ${i === index ? "bg-ink" : "bg-[#c9c7bb]"}`}/>)}</div>
    <button type="button" onClick={() => onSelect((index - 1 + count) % count)} aria-label={`Previous curtain ${kind}`} disabled={count < 2} className={control}><ChevronLeft size={17} strokeWidth={1.4}/></button>
    <button type="button" onClick={onPause} aria-label={reducedMotion ? "Autoplay disabled for reduced motion" : paused ? "Play curtain slideshow" : "Pause curtain slideshow"} aria-pressed={paused || reducedMotion} disabled={reducedMotion || (!animateSingle && count < 2)} className={control}>{paused || reducedMotion ? <Play size={14} strokeWidth={1.4}/> : <Pause size={14} strokeWidth={1.4}/>}</button>
    <button type="button" onClick={() => onSelect((index + 1) % count)} aria-label={`Next curtain ${kind}`} disabled={count < 2} className={control}><ChevronRight size={17} strokeWidth={1.4}/></button>
  </div>;
}
