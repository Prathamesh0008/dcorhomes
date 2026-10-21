import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & { as?: "div" | "section" };

/** The established atelier page width, shared across all routes. */
export default function Container({
  as: Element = "div",
  className = "",
  ...props
}: Props) {
  return (
    <Element
      className={`mx-auto w-[min(1440px,calc(100%_-_100px))] max-[1271px]:w-[min(1440px,calc(100%_-_72px))] max-[681px]:w-[calc(100%_-_36px)] ${className}`}
      {...props}
    />
  );
}
