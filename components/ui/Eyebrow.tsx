import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & { compact?: boolean };

export default function Eyebrow({
  compact = false,
  className = "",
  ...props
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[2.3px] max-[681px]:tracking-[1.65px] ${compact ? "max-[761px]:text-[8px]" : "max-[681px]:text-[9px]"} ${className}`}
      {...props}
    />
  );
}
