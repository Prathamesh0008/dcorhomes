"use client";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export type ImageChoice = { value: string; image?: string; description: string };

export default function ImageSelectionRow({ title, value, choices, onChange, tone = "dark", large = false }: {
  title: string; value: string; choices: ImageChoice[]; onChange: (value: string) => void; tone?: "dark" | "light"; large?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const light = tone === "light";
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element!.clientWidth : 1);
      if ((delta > 0 && element!.scrollLeft + element!.clientWidth < element!.scrollWidth - 2) || (delta < 0 && element!.scrollLeft > 0)) {
        event.preventDefault(); element!.scrollLeft += delta;
      }
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  function move(direction: number) {
    rail.current?.scrollBy({ left: direction * 220, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="mb-4 text-[21px] font-medium tracking-[-.4px]">{title}</legend>
    <div className="mb-3 flex items-center justify-between gap-3">
      <span aria-live="polite" className={`text-[14px] ${light ? "text-[#626b62]" : "text-[#d6ddcf]"}`}>{value}</span>
      {choices.length > 1 && <div className="flex gap-2">
        <button type="button" aria-label={`Previous ${title} choices`} onClick={() => move(-1)} className={`grid h-11 w-11 place-items-center rounded-full border border-solid border-[#82917c] bg-transparent ${light ? "text-ink hover:bg-sand" : "text-paper"}`}><ArrowLeft size={17}/></button>
        <button type="button" aria-label={`Next ${title} choices`} onClick={() => move(1)} className={`grid h-11 w-11 place-items-center rounded-full border border-solid border-[#82917c] bg-transparent ${light ? "text-ink hover:bg-sand" : "text-paper"}`}><ArrowRight size={17}/></button>
      </div>}
    </div>
    <div ref={rail} role="group" aria-label={title} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain p-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {choices.map((choice, index) => <button key={choice.value} type="button" aria-pressed={choice.value === value} onClick={() => onChange(choice.value)} onKeyDown={event => {
        const next = event.key === "ArrowRight" ? (index + 1) % choices.length : event.key === "ArrowLeft" ? (index + choices.length - 1) % choices.length : event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        const button = rail.current?.children[next] as HTMLButtonElement | undefined;
        button?.focus({ preventScroll: true });
        button?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        onChange(choices[next].value);
      }} className={`group relative shrink-0 snap-start overflow-hidden border-2 border-solid border-transparent p-0 text-left transition-colors focus-visible:outline-offset-[-3px] ${large ? "w-[224px] sm:w-[248px]" : "w-[156px] sm:w-[174px]"} ${light ? "bg-paper text-ink hover:border-[#c7bca8] aria-pressed:border-[#907356]" : "bg-[#354b3e] text-paper aria-pressed:border-[#d4be96]"}`}>
        <span className="relative block aspect-[4/5] overflow-hidden">
          {choice.image ? <img src={choice.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"/> : <span className="flex h-full items-center justify-center p-4 text-[14px]">Pattern photograph pending</span>}
          {value === choice.value && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper text-ink"><Check size={17} aria-hidden="true"/></span>}
        </span>
        <span className="block px-3 pb-4 pt-4"><span className="mb-1 block text-[17px] font-medium">{choice.value}</span><span className={`block text-[14px] leading-6 ${light ? "text-[#626b62]" : "text-[#d6ddcf]"}`}>{choice.description}</span></span>
      </button>)}
    </div>
  </fieldset>;
}
