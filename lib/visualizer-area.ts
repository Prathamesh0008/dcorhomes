export type WindowArea = { x: number; y: number; width: number; height: number };
export function validWindowArea(value: unknown): value is WindowArea {
  if (!value || typeof value !== "object") return false;
  const a = value as WindowArea;
  return [a.x,a.y,a.width,a.height].every(v => typeof v === "number" && Number.isFinite(v)) && a.x >= 0 && a.y >= 0 && a.width >= .03 && a.height >= .03 && a.x + a.width <= 1.000001 && a.y + a.height <= 1.000001;
}
export function areaPixels(area: WindowArea, width: number, height: number) {
  const left = Math.floor(area.x * width), top = Math.floor(area.y * height);
  return { left, top, width: Math.min(width-left, Math.max(1, Math.round(area.width*width))), height: Math.min(height-top, Math.max(1, Math.round(area.height*height))) };
}
