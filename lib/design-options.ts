export const designOptions = {
  styles: ["Modern", "Classic", "Minimalist", "Luxury", "Contemporary", "Traditional", "Bohemian", "Industrial", "Romantic"],
  patterns: ["Solid", "Striped", "Floral", "Geometric", "Damask", "Paisley", "Chevron", "Plaid", "Ikat", "Toile", "Abstract", "Textured"],
  rooms: ["Living room", "Bedroom", "Dining room", "Kitchen", "Office", "Bathroom", "Kids room", "Nursery", "Guest room", "Media room"],
  headings: ["Wave fold", "Pinch pleat", "Eyelet", "Relaxed linen"],
  lengths: ["Floor length", "Sill length", "Below sill"],
  layers: ["Single curtain", "Layered sheer and drape"],
};
export const sampleScenes = [
  { id: "modern", name: "Modern drapery", image: "/images/residential-room.jpg", fabric: "sienna", style: "Modern" },
  { id: "classic", name: "Classic sheers", image: "/images/curtain-room.jpg", fabric: "solstice", style: "Classic" },
  { id: "layered", name: "Layered warmth", image: "/images/living-drapery.jpg", fabric: "sienna", style: "Luxury" },
];
export type DesignSelection = { fabric: string; style: string; pattern: string; roomType: string; color: string; heading: string; curtainLength: string; fullness: string; layers: string; sheerColor?: string; configuratorFabric?: string; configuratorStyle?: string; sheerFabric?: string; sheerHeading?: string; mainEnabled?: string; sheerEnabled?: string; manual?: string; inspirationPattern?: string; windowArea?: string };
export const defaultSelection: DesignSelection = { fabric: "sienna", style: "Modern", pattern: "Solid", roomType: "Living room", color: "#baa48e", heading: "Wave fold", curtainLength: "Floor length", fullness: "2", layers: "Single curtain" };
export function studioHref(selection: Partial<DesignSelection>) { return `/studio?${new URLSearchParams(Object.entries(selection).filter((entry):entry is [string,string]=>typeof entry[1]==='string')).toString()}`; }
