import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: "500", display: "swap" });

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="DCOR HOME — home"
      className={`inline-flex flex-col gap-2 ${light ? "text-paper" : "text-ink"}`}
    >
      <span aria-hidden="true" className="flex items-center gap-3 leading-none">
        <Image
          src={light ? "/branding/cream.png" : "/branding/green.png"}
          alt=""
          aria-hidden="true"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 object-contain"
        />
        <span className={`${inter.className} whitespace-nowrap text-[30px] font-medium tracking-[-0.03em] [word-spacing:-2px] [font-kerning:normal]`}>
          <span className="text-[1.075em]">D</span>COR HOME
        </span>
      </span>
      <span
        className={`text-[10px] font-medium uppercase tracking-[2.7px] ${light ? "text-[#aeb8a9]" : "text-[#8a8e7f]"}`}
      >
        Curtain atelier
      </span>
    </Link>
  );
}
