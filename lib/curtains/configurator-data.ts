import type { CurtainConfig, PreviewLook } from "./types";
import type { DesignSelection } from "@/lib/design-options";

export const curtainStyles = ["Wave Pleat", "Pinch Pleat", "Eyelet", "Pencil Pleat", "Goblet Pleat", "Rod Pocket", "Tab Top"];
export const curtainFabrics = [
  { name: "Linen", catalogueId: "sienna", patterns: ["Solid", "Textured", "Striped"] },
  { name: "Velvet", catalogueId: "clay", patterns: ["Solid"] },
  { name: "Blackout", catalogueId: "noir", patterns: ["Solid", "Textured"] },
  { name: "Cotton Blend", catalogueId: "sienna", patterns: ["Solid", "Striped", "Floral", "Geometric"] },
  { name: "Sheer Weave", catalogueId: "solstice", patterns: ["Solid", "Striped"] },
  { name: "Textured Weave", catalogueId: "olive", patterns: ["Solid", "Textured"] },
  { name: "Jacquard", catalogueId: "olive", patterns: ["Solid", "Damask", "Geometric", "Textured"] },
];
export const mainColors = [
  { name: "Warm Ivory", hex: "#e9dfca" }, { name: "Soft Beige", hex: "#cbb99f" },
  { name: "Taupe", hex: "#9d8b7a" }, { name: "Olive", hex: "#747a50" },
  { name: "Dusty Rose", hex: "#bc9292" }, { name: "Charcoal", hex: "#454743" },
  { name: "Slate Grey", hex: "#78838b" }, { name: "Sand", hex: "#ccb58c" },
  { name: "Mocha", hex: "#806654" }, { name: "Off White", hex: "#f1eee4" },
];
export const sheerColors = [
  { name: "Pure White", hex: "#ffffff" }, { name: "Soft Ivory", hex: "#f3efdf" },
  { name: "Cream", hex: "#eee3c9" }, { name: "Warm Beige", hex: "#d5c5aa" },
  { name: "Pale Grey", hex: "#d9dddf" }, { name: "Blush White", hex: "#f1e5e3" },
];
export const curtainRooms = ["Living Room", "Bedroom", "Dining Room", "Home Office", "Guest Room", "Nursery"];
export const curtainPatterns = ["Solid", "Striped", "Floral", "Geometric", "Damask", "Textured"];
const look = (id: string, room: string, style: string, fabric: string, mainColor: string, sheerColor: string, pattern: string): PreviewLook => ({ id, room, style, fabric, mainColor, sheerColor, pattern, image: `/images/curtains/${id}.webp`, thumbnail: `/images/curtains/${id}-thumb.webp`, alt: `${room} sample illustration with ${mainColor.toLowerCase()} ${fabric.toLowerCase()} ${style.toLowerCase()} curtains, ${sheerColor.toLowerCase()} sheers and ${pattern.toLowerCase()} surface` });
export const previewLooks: PreviewLook[] = [
  look("ivory-wave", "Living Room", "Wave Pleat", "Linen", "Warm Ivory", "Soft Ivory", "Solid"),
  look("olive-pinch", "Bedroom", "Pinch Pleat", "Velvet", "Olive", "Cream", "Solid"),
  look("taupe-eyelet", "Dining Room", "Eyelet", "Cotton Blend", "Taupe", "Pure White", "Striped"),
  look("slate-pencil", "Home Office", "Pencil Pleat", "Blackout", "Slate Grey", "Pale Grey", "Solid"),
  look("mocha-pocket", "Guest Room", "Rod Pocket", "Textured Weave", "Mocha", "Warm Beige", "Textured"),
  look("rose-tab", "Nursery", "Tab Top", "Sheer Weave", "Dusty Rose", "Blush White", "Solid"),
  look("sand-goblet", "Living Room", "Goblet Pleat", "Jacquard", "Sand", "Cream", "Damask"),
  look("beige-wave", "Bedroom", "Wave Pleat", "Linen", "Soft Beige", "Pure White", "Textured"),
  look("charcoal-pinch", "Home Office", "Pinch Pleat", "Jacquard", "Charcoal", "Pale Grey", "Geometric"),
  look("white-pocket", "Dining Room", "Rod Pocket", "Cotton Blend", "Off White", "Soft Ivory", "Floral"),
];
export const defaultCurtainConfig: CurtainConfig = { ...previewLooks[0] };
const fields: (keyof CurtainConfig)[] = ["room", "style", "fabric", "mainColor", "sheerColor", "pattern"];
export function nearestPreview(config: CurtainConfig, changed?: keyof CurtainConfig): PreviewLook {
  const weights = { room: 6, style: 5, fabric: 4, mainColor: 4, sheerColor: 3, pattern: 2 };
  const candidates = changed ? previewLooks.filter(item => item[changed] === config[changed]) : previewLooks;
  return [...(candidates.length ? candidates : previewLooks)].sort((a, b) => fields.reduce((score, field) => score + (a[field] === config[field] ? -weights[field] : 0) + (b[field] === config[field] ? weights[field] : 0), 0))[0];
}
export function compatibleConfig(config: CurtainConfig): CurtainConfig {
  const fabric = curtainFabrics.find(f => f.name === config.fabric) || curtainFabrics[0];
  return { ...config, pattern: fabric.patterns.includes(config.pattern) ? config.pattern : "Solid" };
}
export function sameConfig(a: CurtainConfig, b: CurtainConfig) { return fields.every(field => a[field] === b[field]); }
export function colorHex(name: string, sheer = false) { return /^#[0-9a-f]{6}$/i.test(name) ? name : (sheer ? sheerColors : mainColors).find(c => c.name === name)?.hex || (sheer ? "#f3efdf" : "#e9dfca"); }
export function toStudioSelection(config: CurtainConfig): Partial<DesignSelection> {
  return { fabric: curtainFabrics.find(f => f.name === config.fabric)?.catalogueId || "sienna", configuratorFabric: config.fabric, configuratorStyle: config.style, heading: config.style, color: colorHex(config.mainColor), sheerColor: colorHex(config.sheerColor, true), pattern: config.pattern, roomType: config.room === "Home Office" ? "Office" : config.room.charAt(0) + config.room.slice(1).toLowerCase(), layers: "Layered sheer and drape" };
}
export function fromStudioSelection(selection: Partial<DesignSelection>): CurtainConfig {
  const room = selection.roomType === "Office" ? "Home Office" : curtainRooms.find(r => r.toLowerCase() === selection.roomType?.toLowerCase()) || "Living Room";
  return compatibleConfig({ style: curtainStyles.includes(selection.configuratorStyle || selection.heading || "") ? selection.configuratorStyle || selection.heading! : "Wave Pleat", fabric: curtainFabrics.some(f => f.name === selection.configuratorFabric) ? selection.configuratorFabric! : curtainFabrics.find(f => f.catalogueId === selection.fabric)?.name || "Linen", mainColor: mainColors.find(c => c.hex.toLowerCase() === selection.color?.toLowerCase())?.name || selection.color || "Warm Ivory", sheerColor: sheerColors.find(c => c.hex.toLowerCase() === selection.sheerColor?.toLowerCase())?.name || selection.sheerColor || "Soft Ivory", pattern: selection.pattern || "Solid", room });
}
