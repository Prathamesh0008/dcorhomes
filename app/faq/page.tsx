import { pageMetadata } from "@/lib/seo";
import Container from "@/components/ui/Container";
import FAQ from "@/components/editorial/FAQ";
import { typography } from "@/lib/typography";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Frequently asked questions","Understand visualization, fabric choices, privacy, saving and consultation.","/faq");
export default function FAQPage(){return <Container as="section" className="py-12 md:py-20"><h1 className={typography.page}>A few useful <em className="font-serif font-normal text-bronze">answers.</em></h1><FAQ/></Container>;}
