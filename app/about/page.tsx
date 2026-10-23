import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Photograph from "@/components/ui/Photograph";
import Eyebrow from "@/components/ui/Eyebrow";
import OfficeDetails from "@/components/editorial/OfficeDetails";
import { business } from "@/lib/business";
import { aboutFabricSelections } from "@/lib/about-content";
import { fabricRecords, categories } from "@/lib/server/fabric-records";
import { pageMetadata } from "@/lib/seo";

const title = "About Dcorhome | 20 Years of Curtain Experience";
const description = "Discover Dcorhome's 20-year journey in curtains and window dressing. Now explore our curtain fabrics, colors and personalized service online.";
export const metadata: Metadata = {
  ...pageMetadata(title, description, "/about"),
  title: { absolute: title },
  openGraph: { title, description, url: "/about", type: "website", images: [{ url: "/images/atelier-interior-1920.webp", width: 1920, alt: "Warm curtain folds in an architectural interior" }] },
};
const heading = "text-[34px] font-medium leading-[1.12] tracking-[-1px] sm:text-[44px] lg:text-[52px]";
const prose = "text-[16px] leading-8 text-muted";
const textLink = "inline-flex min-h-12 items-center gap-5 border-b border-solid border-[#b5a084] text-[14px] font-medium transition-colors hover:text-bronze";

export default async function About() {
  const [records, categoryRecords] = await Promise.all([fabricRecords(), categories()]);
  const selections = aboutFabricSelections(records, categoryRecords);
  return <>
    <section aria-labelledby="story-title" className="border-b border-solid border-[#e3dfd4] bg-cream">
      <Container className="grid items-center gap-10 py-12 md:gap-12 md:py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-20">
        <div className="max-w-[680px]">
          <Eyebrow>OUR STORY · DCORHOME</Eyebrow>
          <h1 id="story-title" className="mb-7 mt-7 text-[42px] font-semibold leading-[1.06] tracking-[-1.5px] sm:text-[58px] xl:text-[68px]">Two decades of trust.<br/><em className="font-serif font-normal text-[#97836b]">A new way to discover.</em></h1>
          <p className={`${prose} mb-0 max-w-[540px]`}>For {business.experienceYears} years, Dcorhome has been part of the world of curtains and window dressing. Built on experience, attention to detail, and a personal approach, we’re now bringing our curtain collections and expertise online — making it easier to explore fabrics, discover colors, and find the right look for your windows.</p>
        </div>
        <div className="relative h-[370px] overflow-hidden rounded-t-[160px] bg-sand sm:h-[460px] lg:h-[620px] lg:rounded-t-[240px]">
          <Photograph src="/images/atelier-interior.jpg" alt="Architectural interior with long, softly gathered brown curtains and warm natural light" fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover"/>
        </div>
      </Container>
    </section>

    <Container as="section" aria-labelledby="journey-title" className="grid gap-10 py-16 md:grid-cols-[.7fr_1.3fr] md:gap-16 md:py-24 lg:gap-28 lg:py-28">
      <div className="flex items-center gap-7 md:block">
        <p className="mb-0 font-serif text-[140px] font-normal leading-[.85] tracking-[-6px] text-ink md:text-[190px] lg:text-[230px]">20</p>
        <div className="mt-4 border-l border-solid border-[#c9b89f] pl-5 md:mt-8"><p className="mb-2 text-[15px] uppercase tracking-[4px]">Years</p><p className="mb-0 max-w-[220px] text-[14px] leading-6 text-muted">A personal understanding<br/>of curtains and window dressing.</p></div>
      </div>
      <div>
        <Eyebrow>20 YEARS OF EXPERIENCE</Eyebrow>
        <h2 id="journey-title" className={`${heading} mb-7 mt-5`}>Rooted in experience.<br/><em className="font-serif font-normal text-[#97836b]">Ready for what comes next.</em></h2>
        <p className={prose}>Over the past two decades, we’ve seen how the right curtains can transform the feeling of a space. From soft sheers that welcome natural light to rich fabrics that bring warmth and character, every window presents its own possibilities.</p>
        <p className={`${prose} mb-0`}>Our experience has taught us that choosing curtains is about more than selecting a color. It’s about understanding fabric, texture, light, privacy, and the way people live.</p>
      </div>
    </Container>

    <section aria-labelledby="chapter-title" className="bg-[#efede4]">
      <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20 lg:py-20">
        <div className="relative h-[320px] overflow-hidden sm:h-[440px] lg:h-[580px]"><Photograph src="/images/living-drapery.jpg" alt="A warmly furnished living room framed by sheer curtains and full-length outer drapes" fill sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover"/></div>
        <div className="max-w-[540px]">
          <Eyebrow>THE NEXT CHAPTER</Eyebrow>
          <h2 id="chapter-title" className={`${heading} mb-7 mt-5`}>Years of experience.<br/><em className="font-serif font-normal text-[#97836b]">Now at your fingertips.</em></h2>
          <p className={prose}>While our experience began offline, our next chapter is digital.</p>
          <p className={prose}>Through Dcorhome’s online platform, we’re making curtain discovery more convenient and accessible. Explore fabric varieties, compare colors, review fabric details, and share your preferences with us — all from wherever you are.</p>
          <p className={prose}>The way you discover Dcorhome is evolving. Our commitment to personal service remains.</p>
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3"><Link href="/collections" className={textLink}>Explore Our Fabrics<ArrowUpRight size={16} aria-hidden="true"/></Link><Link href="/studio" className={textLink}>Design Your Curtains<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
        </div>
      </Container>
    </section>

    <Container as="section" aria-labelledby="offer-title" className="py-16 md:py-24 lg:py-28">
      <div className="mb-12 grid gap-5 md:grid-cols-2 md:items-end md:gap-16"><div><Eyebrow>THE FABRIC EDIT</Eyebrow><h2 id="offer-title" className={`${heading} mb-0 mt-5`}>Thoughtfully chosen.<br/><em className="font-serif font-normal text-[#97836b]">Beautifully considered.</em></h2></div><p className={`${prose} mb-0 max-w-[430px] md:justify-self-end`}>A starting point for your own ideas. Explore the fabric directions in our library, then let’s talk about the details of your windows.</p></div>
      <div className="grid gap-x-7 gap-y-12 md:grid-cols-6">
        {selections.map((selection, index) => <article key={selection.id} className={index < 2 ? "min-w-0 md:col-span-3" : "min-w-0 md:col-span-2"}>
          <Link href={selection.href} className="group block" data-about-category={selection.id}>
            <div className={`relative overflow-hidden bg-sand ${index < 2 ? "h-[310px] sm:h-[380px]" : "h-[260px]"}`}><Photograph src={selection.image} alt={selection.alt} fill sizes={index < 2 ? "(max-width: 767px) 100vw, 45vw" : "(max-width: 767px) 100vw, 30vw"} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"/></div>
            <div className="mt-5 flex items-start justify-between gap-5"><h3 className="mb-3 text-[23px] font-medium leading-tight tracking-[-.5px] sm:text-[27px]">{selection.title}</h3><ArrowUpRight className="mt-1 shrink-0" size={18} strokeWidth={1.4} aria-hidden="true"/></div>
            <p className="mb-3 max-w-[460px] text-[14px] leading-7 text-muted">{selection.description}</p><span className="inline-flex min-h-11 items-center border-b border-solid border-[#c9b89f] text-[13px]">{selection.action}</span>
          </Link>
        </article>)}
      </div>
      <p className="mb-0 mt-10 max-w-[760px] text-[13px] leading-6 text-muted">Curtain and texture photography shown for inspiration. Explore the library for individual fabric details, and contact us to confirm current availability.</p>
    </Container>

    <section aria-labelledby="approach-title" className="border-y border-solid border-[#e3dfd4] bg-cream">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.2fr_.8fr] md:items-center md:gap-16 md:py-20 lg:gap-28">
        <div className="max-w-[650px]"><Eyebrow>OUR APPROACH</Eyebrow><h2 id="approach-title" className={`${heading} mb-7 mt-5`}>Every window<br/>deserves <em className="font-serif font-normal text-[#97836b]">attention.</em></h2><p className={prose}>We believe beautiful curtains begin with understanding the details. The fall of the fabric. The movement of natural light. The balance between privacy and openness. The colors and textures that make a space feel personal.</p><p className={`${prose} mb-0`}>Our approach is to make these choices easier, with thoughtful fabric selections, useful product information, and personal guidance when you need it.</p></div>
        <div className="relative mx-auto h-[360px] w-full max-w-[400px] overflow-hidden rounded-t-[180px] bg-sand md:h-[440px]"><Photograph src="/images/linen-detail.jpg" alt="An understated close-up of woven linen cloth in soft natural folds" fill sizes="(max-width: 767px) 100vw, 35vw" className="object-cover"/></div>
      </Container>
    </section>

    <Container as="section" aria-labelledby="office-title" className="grid gap-10 py-16 md:grid-cols-2 md:gap-20 md:py-24 lg:py-28">
      <div><Eyebrow>FIND US IN NAVI MUMBAI</Eyebrow><h2 id="office-title" className={`${heading} mb-6 mt-5`}>Closer than you think.<br/><em className="font-serif font-normal text-[#97836b]">Always happy to connect.</em></h2><p className={`${prose} mb-0 max-w-[460px]`}>A fabric in mind or a room taking shape? Connect with us online, or find directions to our Navi Mumbai office.</p></div>
      <div className="border-l border-solid border-[#c9b89f] pl-6 md:pl-10"><OfficeDetails/><a href={`mailto:${business.email}`} className="mt-6 flex min-h-11 break-all items-center text-[20px] font-medium">{business.email}</a><div className="mt-2 flex flex-wrap gap-x-7 gap-y-3"><a href={`mailto:${business.email}`} className={textLink}>Email Us<ArrowUpRight size={16} aria-hidden="true"/></a><Link href="/contact" className={textLink}>Contact Dcorhome<ArrowUpRight size={16} aria-hidden="true"/></Link></div></div>
    </Container>

    <section aria-labelledby="closing-title" className="bg-[#1b3027] text-paper">
      <Container className="grid gap-10 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-24 lg:py-28">
        <div><p className="mb-7 text-[11px] uppercase tracking-[3px] text-[#c6b69e]">A BEAUTIFUL NEXT CHAPTER</p><h2 id="closing-title" className="mb-0 text-[40px] font-medium leading-[1.08] tracking-[-1px] sm:text-[54px] lg:text-[64px]">Your windows.<br/>Our experience.<br/><em className="font-serif font-normal text-[#d7c5a7]">Something beautiful ahead.</em></h2></div>
        <div className="max-w-[450px]"><p className="mb-8 text-[16px] leading-8 text-[#c1ccbf]">Explore the possibilities with Dcorhome. Discover fabrics, find your preferred colors, and connect with our team about your curtains.</p><div className="flex flex-wrap gap-x-7 gap-y-4"><Link href="/collections" className="inline-flex min-h-13 items-center gap-5 bg-paper px-6 text-[14px] font-medium text-ink transition-colors hover:bg-[#e5dfd1]">Explore Fabrics<ArrowUpRight size={16} aria-hidden="true"/></Link><Link href="/contact" className="inline-flex min-h-13 items-center gap-4 border-b border-solid border-[#819179] text-[14px]">Contact Us<ArrowUpRight size={16} aria-hidden="true"/></Link></div></div>
      </Container>
    </section>
  </>;
}
