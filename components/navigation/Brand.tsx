import Link from "next/link";
import Image from "next/image";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Dcorhome home"
      className={`inline-flex flex-col gap-2 ${light ? "text-paper" : "text-ink"}`}
    >
      <span className="flex items-center gap-3 text-[30px] font-semibold leading-none tracking-[-1px] sm:text-[34px]">
        <Image
          src={light ? "/branding/cream.png" : "/branding/green.png"}
          alt=""
          aria-hidden="true"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 object-contain"
        />
        <span className="whitespace-nowrap">
          <span className="text-[1.13em] leading-[0]">D</span>COR{" "}<span className="font-normal">HOME</span>
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
