import PageIntro from "@/components/editorial/PageIntro";
import ActionLink from "@/components/ui/ActionLink";
import { pageMetadata } from "@/lib/seo";
import Container from "@/components/ui/Container";
import FAQ from "@/components/editorial/FAQ";
import { typography } from "@/lib/typography";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Frequently asked questions", "Understand visualization, fabric choices, privacy, saving and consultation.", "/faq");
export default function FAQPage() { return <><PageIntro eyebrow="HERE TO HELP" title={<>A few useful <em className="font-serif font-normal text-bronze">answers.</em></>} description="From choosing a shade to saving your room design. Find a little clarity before taking the next step." image="/images/linen-detail.jpg" alt="Close view of woven curtain fabric texture"/><Container as="section" className="max-w-4xl py-12 md:py-20"><FAQ /><div className="mt-12 bg-cream p-7 md:p-10"><h2 className={typography.card}>Something else on your mind?</h2><p className="text-[15px] leading-7 text-muted">Our team can help with fabric, fit and the details of your room.</p><ActionLink href="/contact">Ask our team</ActionLink></div></Container></>; }
