"use client";
import Image, { type ImageLoaderProps } from "next/image";
import type { HeroSlide } from "@/lib/hero-showcase";
function heroLoader({ src, width }: ImageLoaderProps) {
  const size = width <= 640 ? 640 : width <= 1280 ? 1280 : 1448;
  if (src.endsWith(".jpg")) return src.replace(/\.jpg$/, `-${size}.webp`);
  return src.replace(/-(640|1280|1448)\.webp$/, `-${size}.webp`);
}
export default function HeroShowcaseSlide({ slide, active, priority, requested, onLoad, onError }: { slide: HeroSlide; active: boolean; priority: boolean; requested: boolean; onLoad: () => void; onError: () => void }) {
  return <div aria-hidden={!active} className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${active ? "z-10 opacity-100" : "z-0 opacity-0"}`}>
    <Image src={slide.src} alt={slide.alt} fill loader={heroLoader} priority={priority} loading={priority ? undefined : requested ? "eager" : "lazy"} sizes="(max-width: 681px) calc(100vw - 36px), (max-width: 1023px) calc(100vw - 72px), (max-width: 1600px) 52vw, 750px" className="object-cover" style={{ objectPosition: slide.objectPosition || "50% 50%" }} onLoad={onLoad} onError={onError}/>
  </div>;
}
