import type { ImageChoice } from "@/components/interactive/ImageSelectionRow";
import type { FabricRecord } from "./catalogue";
import { fabricFor, manualSelection, patternsFor, type ManualConfig } from "./manual-config";
import { studioHref } from "@/lib/design-options";

export const composerStyles: ImageChoice[] = [
  { value: "Modern", image: "/images/residential-room-640.webp", description: "Clean lines, easy elegance" },
  { value: "Classic", image: "/images/curtain-room-640.webp", description: "A timeless, graceful fall" },
  { value: "Minimalist", image: "/images/sheer-window-640.webp", description: "Quiet details, softer light" },
  { value: "Contemporary", image: "/images/living-drapery-640.webp", description: "Relaxed, layered living" },
  { value: "Luxury", image: "/images/atelier-interior-640.webp", description: "Generous folds, rich tones" },
  { value: "Bohemian", image: "/images/home/green-drapes-640.webp", description: "Earthy texture, personal style" },
  { value: "Romantic", image: "/images/home/daylight-fall-640.webp", description: "Gentle light, flowing sheers" },
  { value: "Traditional", image: "/images/home/bedroom-drapes-640.webp", description: "Warmth with a familiar rhythm" },
];
export const composerPatterns: ImageChoice[] = [
  { value: "Solid", image: "/images/linen-detail-640.webp", description: "A quiet, uninterrupted surface" },
  { value: "Striped", image: "/images/home/green-drapes-640.webp", description: "Lines with a natural rhythm" },
  { value: "Floral", image: "/images/composer/floral.webp", description: "Flowers across the cloth" },
  { value: "Geometric", image: "/images/composer/geometric.webp", description: "Repeating shapes and structure" },
  { value: "Damask", image: "/images/composer/damask.webp", description: "An ornamental woven motif" },
  { value: "Paisley", image: "/images/composer/paisley.webp", description: "Curved, intricate teardrops" },
  { value: "Botanical", image: "/images/composer/botanical.webp", description: "Leaves and organic forms" },
  { value: "Textured", image: "/images/sheer-detail-640.webp", description: "A surface full of character" },
];
export const composerRooms: ImageChoice[] = [
  { value: "Living Room", image: "/images/living-drapery-640.webp", description: "Curtains for everyday living" },
  { value: "Bedroom", image: "/images/home/bedroom-drapes-640.webp", description: "A restful curtain direction" },
  { value: "Dining Room", image: "/images/composer/dining.webp", description: "Frame the place you gather" },
  { value: "Home Office", image: "/images/composer/office.webp", description: "Consider the light as you work" },
  { value: "Guest Room", image: "/images/composer/guest.webp", description: "A warm welcome at the window" },
  { value: "Nursery", image: "/images/composer/nursery.webp", description: "A gentle curtain mood" },
];
export type ComposerSelection = { style: string; pattern: string; room: string };
export const composerDefault: ComposerSelection = { style: "Modern", pattern: "Solid", room: "Living Room" };
export function validateComposer(raw: Partial<ComposerSelection>): ComposerSelection {
  return { style: composerStyles.some(c => c.value === raw.style) ? raw.style! : composerDefault.style, pattern: composerPatterns.some(c => c.value === raw.pattern) ? raw.pattern! : composerDefault.pattern, room: composerRooms.some(c => c.value === raw.room) ? raw.room! : composerDefault.room };
}
export function composerTransfer(intent: ComposerSelection, current: ManualConfig, records: FabricRecord[]) {
  const chosen = validateComposer(intent), main = fabricFor(current.mainFabric, "main", records);
  const compatible = patternsFor(main).includes(chosen.pattern);
  const manual = { ...current, room: chosen.room, pattern: compatible ? chosen.pattern : current.pattern };
  return {
    manual,
    compatible,
    href: studioHref({ ...manualSelection(manual, records), style: chosen.style, inspirationPattern: chosen.pattern }) + "&mode=sample",
    catalogueHref: records.some(f => f.active !== false && f.pattern === chosen.pattern) ? `/collections?${new URLSearchParams({ pattern: chosen.pattern })}` : "/collections",
  };
}
export function composerHref(intent: ComposerSelection) {
  const chosen = validateComposer(intent);
  return studioHref({ style: chosen.style, inspirationPattern: chosen.pattern, roomType: chosen.room === "Home Office" ? "Office" : chosen.room.charAt(0) + chosen.room.slice(1).toLowerCase() }) + "&composer=1&mode=sample";
}
