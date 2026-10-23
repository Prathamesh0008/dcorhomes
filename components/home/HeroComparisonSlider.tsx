"use client";
import { useEffect, useRef, useState } from "react";
import type { HeroComparisonSlide as Slide } from "@/lib/hero-comparisons";
import HeroComparisonSlide from "./HeroComparisonSlide";

export default function HeroComparisonSlider({ slides, illustration }: { slides: Slide[]; illustration: Slide }) {
  const valid = slides.filter(slide => slide.beforeSrc && slide.afterSrc && slide.beforeSrc !== slide.afterSrc);
  const fallback = valid.length === 0;
  const pairs = fallback ? [illustration] : valid;
  const count = pairs.length;
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<string[]>([]);
  const [index, setIndex] = useState(0), [pending, setPending] = useState<number | null>(null), [previous, setPrevious] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false), [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true), [visible, setVisible] = useState(false), [inView, setInView] = useState(false), [idleUntil, setIdleUntil] = useState(0), [waiting, setWaiting] = useState(false);
  const [sequenceToken, setSequenceToken] = useState(0), [error, setError] = useState("");
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setReduced(motion.matches); setVisible(!document.hidden); };
    update(); motion.addEventListener("change", update); document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .15), { threshold: [0, .15] });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); motion.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => { if (previous === null) return; const timer = setTimeout(() => setPrevious(null), reduced ? 0 : 750); return () => clearTimeout(timer); }, [previous, reduced]);
  useEffect(() => { const delay = Math.max(0, idleUntil - Date.now()); setWaiting(delay > 0); if (!delay) return; const timer = setTimeout(() => setWaiting(false), delay); return () => clearTimeout(timer); }, [idleUntil]);
  function commit(target: number) {
    setPrevious(index); setIndex(target); setPending(null); setSequenceToken(value => value + 1);
  }
  useEffect(() => { if (pending !== null && ready.includes(pairs[pending].id)) commit(pending); }, [pending, ready]);
  function interaction(active: boolean) { setDragging(active); if (active) { setPending(null); setFocused(false); } setIdleUntil(Date.now() + 5000); }
  function sequenceEnd() {
    if (count < 2) { setSequenceToken(value => value + 1); return; }
    setPending((index + 1) % count);
  }
  const autoRun = !dragging && !focused && !reduced && visible && inView && !waiting && Date.now() >= idleUntil && pending === null && !error && ready.includes(pairs[index].id);
  const rendered = Array.from(new Set([index, (index + 1) % count, ...(previous === null ? [] : [previous]), ...(pending === null ? [] : [pending])]));
  return <div ref={root} data-testid="hero-comparison-slider" data-active-pair={index} data-pair-count={count} data-illustration={fallback} data-autoplay={autoRun} onFocusCapture={event => { const keyboardFocus = (event.target as HTMLElement).matches(":focus-visible"); setFocused(keyboardFocus); if (keyboardFocus) setPending(null); }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setFocused(false); setIdleUntil(Date.now() + 5000); } }}>
    <section role="region" aria-roledescription="carousel" aria-label="Curtain transformation scenes" className="overflow-hidden rounded-[22px] border border-solid border-[#ded8cb] bg-[#f8f5ed] shadow-[0_16px_50px_#25342f0d]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">{rendered.map(i => <HeroComparisonSlide key={pairs[i].id} slide={pairs[i]} active={i === index} priority={i === 0} autoRun={autoRun && i === index} sequenceToken={sequenceToken} onSequenceEnd={sequenceEnd} onKeyboardInteraction={() => { setFocused(true); setPending(null); }} onInteraction={interaction} onReady={() => setReady(current => current.includes(pairs[i].id) ? current : [...current, pairs[i].id])} onError={() => { setPending(null); setError("This curtain image pair could not load. Please reload the page."); }}/>)}</div>
    </section>
    <p id="hero-comparison-instructions" className="sr-only">AI-edited curtain design concepts. Use arrow keys to adjust the divider. Home shows the before view; End shows the after view. Autoplay pauses during keyboard focus. Press Escape to leave the comparison and resume after five seconds.</p>
    {error && <p role="status" className="sr-only">{error}</p>}
  </div>;
}
