import Link from "next/link";
import Image from "next/image";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="DCOR HOME — home"
      className="inline-flex items-center align-middle"
    >
      <Image
        src="/branding/dcorhome-logo.png"
        alt="Dcorhome"
        width={2933}
        height={560}
        sizes="(min-width: 1024px) 225px, 180px"
        className={`h-auto w-[180px] lg:w-[225px] ${light ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
}
