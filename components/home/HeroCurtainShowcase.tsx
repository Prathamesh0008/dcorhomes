"use client";
import { useEffect, useRef, useState } from "react";
import CurtainComparison from "@/components/interactive/CurtainComparison";
import type { HeroSlide } from "@/lib/hero-showcase";
import HeroShowcaseSlide from "./HeroShowcaseSlide";
import HeroShowcaseControls from "./HeroShowcaseControls";

export default function HeroCurtainShowcase({ slides, comparison }: { slides: HeroSlide[]; comparison: { before: string; after: string } }) {
  const root = useRef<HTMLDivElement>(null), failed = useRef(new Set<number>()), loaded = useRef(new Set<number>()), manualRequest = useRef(false);
  const [index, setIndex] = useState(0), [previous, setPrevious] = useState<number | null>(null), [pending, setPending] = useState<number | null>(null);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true), [visible, setVisible] = useState(true), [inView, setInView] = useState(false);
  const [compare, setCompare] = useState(false), [announcement, setAnnouncement] = useState(""), [error, setError] = useState("");
  const count = slides.length;
  const canCompare = comparison.before !== comparison.after;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches), visibility = () => setVisible(!document.hidden);
    motion(); visibility(); media.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), reducedMotion ? 0 : 750);
    return () => window.clearTimeout(timer);
  }, [previous, reducedMotion]);
  useEffect(() => {
    if (count < 2 || reducedMotion || paused || hovered || focused || !visible || !inView || compare || pending !== null || error) return;
    const timer = window.setTimeout(() => { manualRequest.current = false; setPending((index + 1) % count); }, 5000);
    return () => window.clearTimeout(timer);
  }, [index, count, reducedMotion, paused, hovered, focused, visible, inView, compare, pending, error]);
  useEffect(() => {
    if (pending === null) return;
    if (failed.current.has(pending)) { setPending(null); setError("This curtain image could not load. Please choose another view."); return; }
    if (!loaded.current.has(pending)) return;
    setPrevious(index); setIndex(pending); setPending(null);
    if (manualRequest.current) setAnnouncement(`Curtain image ${pending + 1} of ${count}. ${slides[pending].alt}`);
  }, [pending, index, count, slides]);
  function imageLoaded(i: number) {
    loaded.current.add(i);
    if (pending === i) {
      setPrevious(index); setIndex(i); setPending(null);
      if (manualRequest.current) setAnnouncement(`Curtain image ${i + 1} of ${count}. ${slides[i].alt}`);
    }
  }
  function select(i: number) { if (i === index) return; manualRequest.current = true; setError(""); setPending(i); }
  if (!count) return <CurtainComparison before={comparison.before} after={comparison.after} variant="hero" priority caption="AI-created room illustration, not a product photograph."/>;
  const rendered = Array.from(new Set([index, (index + 1) % count, ...(previous === null ? [] : [previous]), ...(pending === null ? [] : [pending])]));
  return <div ref={root} data-testid="hero-curtain-showcase" data-active-slide={index} data-mode={compare ? "comparison" : "gallery"} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    {compare ? <CurtainComparison before={comparison.before} after={comparison.after} variant="hero" priority={false} autoPlay={false} beforeLabel="Original illustration" afterLabel="Curtain illustration" caption="Interactive AI-created room illustration, not a photographed installation."/> : <section role="region" aria-roledescription="carousel" aria-label="Curtain image showcase" onKeyDown={event => { if ((event.target as Element).tagName === "SELECT") return; if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); select((index + (event.key === "ArrowRight" ? 1 : count - 1)) % count); } }} className="overflow-hidden rounded-[22px] border border-solid border-[#ded8cb] bg-[#f8f5ed] shadow-[0_16px_50px_#25342f0d]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {rendered.map(i => <HeroShowcaseSlide key={i} slide={slides[i]} active={i === index} priority={i === 0} requested={pending === i} onLoad={() => imageLoaded(i)} onError={() => { failed.current.add(i); if (pending === i || index === i) { setPending(null); setError("This curtain image could not load. Please choose another view."); } }}/>) }
        <span className="pointer-events-none absolute left-5 top-5 z-20 rounded-full border border-solid border-white/25 bg-[#183026e6] px-3.5 py-2 text-[10px] uppercase tracking-[1.7px] text-white">Curtain view</span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#13271ed9] to-transparent px-5 pb-5 pt-16"><p className="mb-0 text-[12px] leading-6 text-white">{slides[index].caption}</p></div>
      </div>
      <HeroShowcaseControls index={index} count={count} paused={paused} reducedMotion={reducedMotion} onSelect={select} onPause={() => setPaused(value => !value)}/>
    </section>}
    {canCompare && <button type="button" onClick={() => setCompare(value => !value)} aria-pressed={compare} className="mt-3 min-h-11 bg-transparent px-1 text-[12px] text-[#666e61] underline decoration-[#b6a58c] underline-offset-4">{compare ? "Back to curtain gallery" : "Explore the interactive room illustration"}</button>}
    {error && <p role="status" className="mt-2 text-[13px] leading-6 text-ink">{error}</p>}
    <p aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>
  </div>;
}
