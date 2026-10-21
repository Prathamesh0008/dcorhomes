"use client";
import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

// Locally encoded derivatives avoid an image-processing round trip at request time.
function photographLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith("/images/") || !src.endsWith(".jpg")) return src;
  const size = width <= 640 ? 640 : width <= 1280 ? 1280 : 1920;
  return src.replace(/\.jpg$/, `-${size}.webp`);
}

export default function Photograph(props: ImageProps) {
  const hasDerivatives = typeof props.src === "string" && props.src.startsWith("/images/") && props.src.endsWith(".jpg");
  return <Image {...props} loader={hasDerivatives ? photographLoader : undefined} unoptimized={props.unoptimized || !hasDerivatives} />;
}
