"use client";
import { type RefObject, useEffect, useRef, useState } from "react";

export function useComparisonAutoplay({ frame, value, enabled, paused, duration, delay, update }: {
  frame: RefObject<HTMLDivElement | null>;
  value: RefObject<number>;
  enabled: boolean;
  paused: boolean;
  duration: number;
  delay: number;
  update: (value: number) => void;
}) {
  const dragging = useRef(false), focused = useRef(false), idleUntil = useRef(0);
  const direction = useRef(1);
  const controller = useRef({ stop: () => {}, start: () => {} });
  const updateRef = useRef(update);
  updateRef.current = update;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false, disposed = false, raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; clearTimeout(timer); timer = undefined; };
    const allowed = () => !disposed && enabled && !paused && !media.matches && visible && !document.hidden && !dragging.current && !focused.current;
    const start = () => {
      stop();
      if (!allowed()) return;
      const remaining = idleUntil.current - performance.now();
      if (remaining > 0) { timer = setTimeout(start, remaining); return; }
      let from = value.current;
      if (from >= 90) direction.current = -1;
      if (from <= 10) direction.current = 1;
      let target = direction.current > 0 ? 90 : 10;
      let began: number | undefined;
      let travel = Math.max(200, Math.max(200, duration) * Math.abs(target - from) / 80);
      const tick = (now: number) => {
        if (!allowed()) { stop(); return; }
        began ??= now;
        const progress = Math.min(1, (now - began) / travel);
        updateRef.current(from + (target - from) * (1 - Math.cos(Math.PI * progress)) / 2);
        if (progress === 1) {
          from = target;
          direction.current *= -1;
          target = direction.current > 0 ? 90 : 10;
          began = now;
          travel = Math.max(200, duration);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    controller.current = { stop, start };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .15;
      start();
    }, { threshold: [0, .15] });
    const motionChanged = () => { setReduced(media.matches); start(); };
    setReduced(media.matches);
    observer.observe(element);
    media.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", start);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      media.removeEventListener("change", motionChanged);
      document.removeEventListener("visibilitychange", start);
    };
  }, [frame, value, enabled, paused, duration]);

  function interrupt(kind: "pointer" | "focus") {
    if (kind === "pointer") { dragging.current = true; focused.current = false; }
    else focused.current = true;
    controller.current.stop();
  }
  function release(kind: "pointer" | "focus") {
    if (kind === "pointer") dragging.current = false;
    else focused.current = false;
    idleUntil.current = performance.now() + Math.max(0, delay);
    controller.current.start();
  }
  return { interrupt, release, reduced };
}
