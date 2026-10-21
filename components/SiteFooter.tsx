import Link from "next/link";
import Container from "@/components/ui/Container";
import { Brand } from "./SiteHeader";
export default function SiteFooter() {
  return (
    <footer className="bg-[#1d2d25] text-paper">
      <Container className="grid gap-12 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:py-20">
        <div>
          <Brand light />
          <p className="mb-0 mt-6 max-w-[240px] font-sans text-[24px] font-medium leading-[1.3] tracking-[-.5px] text-[#c3c8b8]">
            Light, texture, and a home
            <br />
            that feels like yours.
          </p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-[2px] text-[#9ba893]">
            Explore
          </span>
          <div className="mt-5 flex flex-col items-start gap-1 text-[13px] text-[#d2d8ca]">
            {[
              ["/collections", "The fabric library"],
              ["/studio", "Your design studio"],
              ["/measure", "Measurement guide"],
              ["/designs", "Saved designs"],
              ["/inspiration", "Inspiration"],
              ["/how-it-works", "How it works"],
              ["/faq", "Questions & answers"],
            ].map(([href, title]) => (
              <Link
                className="flex min-h-11 items-center hover:text-white"
                key={href}
                href={href}
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-[2px] text-[#9ba893]">
            A personal approach
          </span>
          <p className="mb-4 mt-5 max-w-[250px] text-[15px] leading-[1.8] text-[#b4c0ad]">
            Discuss fabric samples, a room in progress or the details of your
            window.
          </p>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center border-b border-solid border-[#7b8975] text-[13px]"
          >
            Begin a conversation ↗
          </Link>
        </div>
      </Container>
      <Container className="flex flex-col justify-between gap-3 border-t border-solid border-[#ffffff24] py-6 text-[8px] uppercase leading-[1.8] tracking-[1px] text-[#9aa992] sm:flex-row">
        <span>© {new Date().getFullYear()} Dcorhome. All rights reserved.</span>
        <span className="flex flex-wrap gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span>
        <span>
          Editorial photography for inspiration ·{" "}
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Pexels
          </a>
        </span>
      </Container>
    </footer>
  );
}
