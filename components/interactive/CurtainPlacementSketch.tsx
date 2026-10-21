import type { CSSProperties } from "react";
/** Deliberately schematic placement aid, shown only after an explicit sketch selection. */
export default function CurtainPlacementSketch({
  x,
  width,
  top,
  length,
  opening,
  color,
  heading,
  pattern,
}: {
  x: number;
  width: number;
  top: number;
  length: number;
  opening: number;
  color: string;
  heading: string;
  pattern: string;
}) {
  const style = {
    left: `${x - width / 2}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${Math.min(length, 100 - top)}%`,
    "--sketch-color": color,
    "--panel-width": `${(100 - opening) / 2}%`,
  } as CSSProperties;
  return (
    <div
      data-heading={heading}
      data-pattern={pattern}
      className="pointer-events-none absolute border-t-2 border-solid border-white"
      style={style}
    >
      <div className="absolute left-0 top-0 h-full w-[var(--panel-width)] border border-dashed border-white bg-[var(--sketch-color)] opacity-50" />
      <div className="absolute right-0 top-0 h-full w-[var(--panel-width)] border border-dashed border-white bg-[var(--sketch-color)] opacity-50" />
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap bg-paper px-3 py-2 text-[8px] tracking-[1px] text-ink">
        PLACEMENT SKETCH
      </span>
    </div>
  );
}
