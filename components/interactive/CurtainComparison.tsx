"use client";
import { CSSProperties, ReactNode, useRef, useState, useEffect } from "react";
import Image from "@/components/ui/Photograph";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useComparisonAutoplay } from "./useComparisonAutoplay";

type Props = {
  before: string;
  after: string;
  label?: string;
  priority?: boolean;
  children?: ReactNode;
  caption?: string;
  variant?: "default" | "hero" | "showcase";
  beforeLabel?: string;
  afterLabel?: string;
  autoPlay?: boolean;
  autoResumeDelay?: number;
  autoPlayDuration?: number;
};
export default function CurtainComparison({
  before,
  after,
  label = "Curtain before and after comparison",
  priority = false,
  caption = "Compare your room and curtain design.",
  children,
  variant = "default",
  beforeLabel = "Original room",
  afterLabel = "Edited room",
  autoPlay = false,
  autoResumeDelay = 4500,
  autoPlayDuration = 4500,
}: Props) {
  const frame = useRef<HTMLDivElement>(null),
    value = useRef(50),
    active = useRef<number | null>(null),
    bounds = useRef<DOMRect | null>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const placeholder = before === after;
  const beforeImage = before;
  const afterImage = after;
  useEffect(() => {
    setFailed(false);
  }, [beforeImage, afterImage]);
  function update(next: number) {
    value.current = Math.max(0, Math.min(100, next));
    frame.current?.style.setProperty("--reveal", `${value.current}%`);
    const slider = frame.current?.querySelector('[role="slider"]');
    slider?.setAttribute("aria-valuenow", String(Math.round(value.current)));
    slider?.setAttribute(
      "aria-valuetext",
      `${Math.round(value.current)}% curtain view`,
    );
  }
  function position(clientX: number) {
    const r = bounds.current;
    if (r && r.width) update(((clientX - r.left) / r.width) * 100);
  }
  const playback = useComparisonAutoplay({
    frame, value, enabled: autoPlay && !placeholder && beforeImage !== afterImage && !failed,
    paused, duration: autoPlayDuration, delay: autoResumeDelay, update,
  });
  if (placeholder) return <figure className="m-0 min-w-0"><div className="relative aspect-[4/3] overflow-hidden bg-sand"><Image src={beforeImage} alt="Room reference" fill sizes="(max-width:1023px) 100vw,55vw" className="object-cover" unoptimized={beforeImage.startsWith("blob:") || beforeImage.startsWith("data:")}/></div><figcaption className="mt-3 text-[12px] text-muted">Room reference</figcaption></figure>;
  return (
    <figure className="min-w-0 m-0">
      <div
        ref={frame}
        className={`group/comparison relative cursor-ew-resize select-none overflow-hidden bg-sand touch-pan-y ${variant === "hero" ? "h-[420px] rounded-[22px] shadow-[0_16px_50px_#25342f12] sm:h-[550px] lg:h-[580px] xl:h-[610px]" : "aspect-[4/3]"}`}
        data-testid="curtain-comparison"
        style={{ "--reveal": "50%" } as CSSProperties}
        onPointerDown={(e) => {
          if (!e.isPrimary || e.button !== 0) return;
          playback.interrupt("pointer");
          active.current = e.pointerId;
          bounds.current = e.currentTarget.getBoundingClientRect();
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.dataset.dragging = "true";
          position(e.clientX);
        }}
        onPointerMove={(e) => {
          if (active.current === e.pointerId) position(e.clientX);
        }}
        onPointerUp={(e) => {
          if (active.current === e.pointerId) {
            active.current = null;
            playback.release("pointer");
            delete e.currentTarget.dataset.dragging;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          playback.release("pointer");
          active.current = null;
          if (frame.current) delete frame.current.dataset.dragging;
        }}
        onLostPointerCapture={() => {
          if (active.current !== null) playback.release("pointer");
          active.current = null;
          if (frame.current) delete frame.current.dataset.dragging;
        }}
      >
        <Image
          className="absolute w-full h-full object-cover inset-0"
          src={beforeImage}
          alt={
            placeholder
              ? "Room reference photograph; no transformation shown"
              : "Original room photograph"
          }
          draggable={false}
          fill
          sizes="(max-width: 1023px) 100vw, 55vw"
          priority={priority}
          unoptimized={
            beforeImage.startsWith("blob:") || beforeImage.startsWith("data:")
          }
          onError={() => setFailed(true)}
        />
        <div className="absolute w-full h-full object-cover [clip-path:inset(0_calc(100%_-_var(--reveal))_0_0)] inset-0">
          <Image
            className="absolute w-full h-full object-cover inset-0"
            src={afterImage}
            alt={
              placeholder
                ? "Same room reference photograph, aligned exactly"
                : "Edited curtain design for the same room"
            }
            draggable={false}
            fill
            sizes="(max-width: 1023px) 100vw, 55vw"
            priority={priority}
            unoptimized={
              afterImage.startsWith("blob:") || afterImage.startsWith("data:")
            }
            onError={() => setFailed(true)}
          />
          {children}
        </div>
        {failed && (
          <p
            className="absolute bg-paper text-ink z-[5] text-[14px] leading-[1.8] pointer-events-none p-[25px] inset-y-[20%] inset-x-[12%]"
            role="status"
          >
            Room imagery is unavailable. Explore curtain options in the studio.
          </p>
        )}
        <span className="absolute bottom-[22px] text-[9px] text-ink tracking-[1.5px] bg-[#fffdf0df] pointer-events-none left-[18px] py-[9px] px-3">
          {placeholder ? "REFERENCE" : afterLabel}
        </span>
        <span className="absolute bottom-[22px] text-[9px] text-ink tracking-[1.5px] bg-[#fffdf0df] pointer-events-none right-[18px] py-[9px] px-3">
          {placeholder ? "REFERENCE" : beforeLabel}
        </span>
        <div className="absolute left-[var(--reveal)] w-px bg-white pointer-events-none inset-y-0" />
          <div
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            aria-valuetext="50% curtain view"
            aria-orientation="horizontal"
            onFocus={() => { if (active.current === null) playback.interrupt("focus"); }}
            onBlur={() => playback.release("focus")}
            className="absolute left-[clamp(22px,var(--reveal),calc(100%_-_22px))] top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-solid border-[#d9d4c7] bg-paper text-ink shadow-md transition-colors hover:bg-cream group-data-[dragging]/comparison:bg-cream pointer-events-auto"
            onKeyDown={(e) => {
              let next = value.current;
              switch (e.key) {
                case "ArrowLeft":
                case "ArrowDown":
                  next -= e.shiftKey ? 10 : 2;
                  break;
                case "ArrowRight":
                case "ArrowUp":
                  next += e.shiftKey ? 10 : 2;
                  break;
                case "Home":
                  next = 0;
                  break;
                case "End":
                  next = 100;
                  break;
                default:
                  return;
              }
              e.preventDefault();
              update(next);
            }}
          >
            <ChevronLeft size={14} strokeWidth={1.4} />
            <ChevronRight size={14} strokeWidth={1.4} />
          </div>
        {autoPlay && !placeholder && beforeImage !== afterImage && (
          <button
            type="button"
            aria-label={paused || playback.reduced ? "Play automatic comparison" : "Pause automatic comparison"}
            disabled={playback.reduced}
            title={playback.reduced ? "Automatic motion is disabled by your reduced-motion preference" : undefined}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setPaused(!paused)}
            className="absolute right-4 top-4 flex min-h-11 items-center gap-2 rounded-full border border-solid border-[#d9d4c7] bg-paper/95 px-4 text-[12px] font-medium text-ink shadow-sm transition-colors hover:bg-cream disabled:cursor-default"
          >
            {paused || playback.reduced ? <Play size={14} /> : <Pause size={14} />}
            {playback.reduced ? "Motion off" : paused ? "Play" : "Pause"}
          </button>
        )}
        <noscript>
          <span className="absolute bg-paper text-ink z-[5] text-[14px] leading-[1.8] pointer-events-none p-[25px] inset-y-[20%] inset-x-[12%]">
            Static reference shown. Enable JavaScript to use the comparison
            control.
          </span>
        </noscript>
      </div>
      {caption && (
        <figcaption className="flex justify-between text-[9px] text-inherit leading-[1.6] mt-[13px] gap-[15px] max-[761px]:text-[8px] max-[761px]:flex-wrap max-[761px]:gap-[5px]">
          {caption}
          <span className="whitespace-nowrap tracking-[1px]">
            DRAG TO COMPARE
          </span>
        </figcaption>
      )}
    </figure>
  );
}
