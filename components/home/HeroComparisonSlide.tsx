"use client";
import Image, { type ImageLoaderProps } from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroComparisonSlide as Slide } from "@/lib/hero-comparisons";
import { useHeroTransformationSequence } from "./useHeroTransformationSequence";
function pairedImageLoader({ src, width }: ImageLoaderProps) {
  return width <= 640 ? src.replace(/\.webp$/, "-640.webp") : width <= 1280 ? src.replace(/\.webp$/, "-1280.webp") : src;
}

export default function HeroComparisonSlide({ slide, active, priority, onReady, onError, onInteraction, autoRun, sequenceToken, onSequenceEnd, onKeyboardInteraction }: { slide: Slide; active: boolean; priority: boolean; onReady: () => void; onError: () => void; onInteraction: (dragging: boolean) => void; autoRun: boolean; sequenceToken: number; onSequenceEnd: () => void; onKeyboardInteraction: () => void }) {
  const frame = useRef<HTMLDivElement>(null), slider = useRef<HTMLDivElement>(null), pointer = useRef<number | null>(null), value = useRef(5), loaded = useRef(new Set<string>());
  function update(next: number) {
    value.current = Math.max(0, Math.min(100, next));
    frame.current?.style.setProperty("--reveal", `${value.current}%`);
    slider.current?.setAttribute("aria-valuenow", String(Math.round(value.current)));
    slider.current?.setAttribute("aria-valuetext", `${Math.round(value.current)}% after view`);
  }
  useEffect(() => { if (active) update(5); }, [active]);
  useHeroTransformationSequence({ enabled: active && autoRun, token: sequenceToken, read: () => value.current, update, onComplete: onSequenceEnd });
  function position(x: number) { const rect = frame.current?.getBoundingClientRect(); if (rect?.width) update((x - rect.left) / rect.width * 100); }
  function release() { if (pointer.current !== null) { pointer.current = null; onInteraction(false); } }
  function imageLoaded(which: string) { loaded.current.add(which); if (loaded.current.size === 2) onReady(); }
  return <div ref={frame} aria-hidden={!active} inert={!active} data-comparison-pair={slide.id} style={{ "--reveal": "5%" } as CSSProperties} className={`absolute inset-0 touch-pan-y select-none transition-opacity duration-700 motion-reduce:transition-none ${active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`} onPointerDown={event => {
    if (!active || !event.isPrimary || event.button !== 0) return;
    pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); onInteraction(true); position(event.clientX);
  }} onPointerMove={event => { if (pointer.current === event.pointerId) position(event.clientX); }} onPointerUp={event => { if (pointer.current === event.pointerId) { release(); event.currentTarget.releasePointerCapture(event.pointerId); } }} onPointerCancel={release} onLostPointerCapture={release}>
    <Image src={slide.beforeSrc} loader={/^\/images\/hero\/hero-\d+-before\.webp$/.test(slide.beforeSrc) ? pairedImageLoader : undefined} alt={`${slide.alt} — curtain-free view`} fill priority={priority} sizes="(max-width: 1023px) 100vw, 52vw" draggable={false} className="object-cover" onLoad={() => imageLoaded("before")} onError={onError}/>
    <div className="pointer-events-none absolute inset-0 [clip-path:inset(0_calc(100%_-_var(--reveal))_0_0)]"><Image src={slide.afterSrc} loader={/^\/images\/hero\/hero-\d+-after\.webp$/.test(slide.afterSrc) ? pairedImageLoader : undefined} alt={`${slide.alt} — layered curtain concept`} fill priority={priority} sizes="(max-width: 1023px) 100vw, 52vw" draggable={false} className="object-cover" onLoad={() => imageLoaded("after")} onError={onError}/></div>
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[var(--reveal)] w-px bg-white shadow-sm"/>
    <div ref={slider} role="slider" tabIndex={active ? 0 : -1} aria-label={`Compare ${slide.label || "curtain transformation"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={5} aria-valuetext="5% after view" aria-orientation="horizontal" aria-describedby="hero-comparison-instructions" className="absolute left-[clamp(22px,var(--reveal),calc(100%_-_22px))] top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-solid border-[#d9d4c7] bg-paper text-ink shadow-md" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.currentTarget.blur(); return; }
      let next = value.current;
      if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= event.shiftKey ? 10 : 2;
      else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += event.shiftKey ? 10 : 2;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      else return;
      event.preventDefault(); onKeyboardInteraction(); onInteraction(false); update(next);
    }}><ChevronLeft aria-hidden="true" size={14}/><ChevronRight aria-hidden="true" size={14}/></div>
  </div>;
}
