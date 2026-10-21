import { typography } from "@/lib/typography";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
type Props = ComponentProps<typeof Link> & {
  variant?: "dark" | "light" | "text";
};
export default function ActionLink({
  variant = "dark",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      className={`group inline-flex min-h-12 items-center justify-center gap-4 ${typography.button} tracking-[.3px] transition-colors duration-200 sm:gap-7 ${variant === "text" ? "border-b border-solid border-current py-2 hover:text-bronze" : variant === "light" ? "bg-paper px-4 text-ink hover:bg-sand sm:px-6" : "bg-ink px-4 text-paper hover:bg-[#40564a] sm:px-6"} ${className}`}
    >
      {children}
      <ArrowUpRight size={16} strokeWidth={1.4} className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
    </Link>
  );
}
