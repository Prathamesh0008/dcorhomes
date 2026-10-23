"use client";
import { useEffect, useRef } from "react";

// One RAF lifecycle: settle, reveal curtains, hold, then advance. Resume from the manual position.
export function useHeroTransformationSequence({ enabled, token, read, update, onComplete }: { enabled: boolean; token: number; read: () => number; update: (value: number) => void; onComplete: () => void }) {
  const handlers = useRef({ read, update, onComplete });
  handlers.current = { read, update, onComplete };
  useEffect(() => {
    if (!enabled) return;
    let raf = 0, started: number | null = null;
    const from = handlers.current.read();
    const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
    const frame = (now: number) => {
      started ??= now;
      const elapsed = now - started;
      let value = from;
      if (elapsed < 500) value = from;
      else if (elapsed < 4300) value = from + (95 - from) * ease((elapsed - 500) / 3800);
      else value = 95;
      handlers.current.update(value);
      if (elapsed >= 5800) { handlers.current.onComplete(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, token]);
}
