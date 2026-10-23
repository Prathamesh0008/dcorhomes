import type { ImageChoice } from "@/components/interactive/ImageSelectionRow";

// Licensed editorial mood references; never presented as stock or selected products.
// Provenance: lib/assets.ts (existing Pexels assets).
export const visualizerStyles: ImageChoice[] = [
  { value: "Modern", image: "/images/residential-room-640.webp", description: "Clean lines, easy elegance" },
  { value: "Classic", image: "/images/curtain-room-640.webp", description: "Timeless, softly gathered" },
  { value: "Minimalist", image: "/images/sheer-window-640.webp", description: "Airy light, quiet details" },
  { value: "Luxury", image: "/images/atelier-interior-640.webp", description: "Generous folds, rich tones" },
  { value: "Contemporary", image: "/images/living-drapery-640.webp", description: "Relaxed, layered living" },
  { value: "Traditional", image: "/images/curtain-room-640.webp", description: "A familiar, graceful fall" },
];
