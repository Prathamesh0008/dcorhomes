import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Curtains, beautifully reimagined","Explore curtain fabrics, compose a design direction and visualize your own room.","/");
import { homepagePair } from "@/lib/server/showcase";
export const dynamic="force-dynamic";
import DesignComposer from "@/components/interactive/DesignComposer";
import FAQ from "@/components/editorial/FAQ";
import { typography } from "@/lib/typography";
import Image from "@/components/ui/Photograph";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import ActionLink from "@/components/ui/ActionLink";
import FabricSelector from "@/components/interactive/FabricSelector";
import CurtainComparison from "@/components/interactive/CurtainComparison";
import { images } from "@/lib/urls";
import heroStyles from "@/components/interactive/HeroEntrance.module.css";
export default function HomePage() {
  const pair=homepagePair();
  return (
    <>
      <section className="bg-[#f3efe6]">
        <Container className="grid items-center gap-8 py-8 md:gap-10 md:py-12 lg:grid-cols-[.94fr_1.06fr] lg:gap-12 lg:py-14">
          <div className={`min-w-0 ${heroStyles.entrance}`}>
            <Eyebrow>DESIGN YOUR SPACE WITH DCORHOME</Eyebrow>
            <h1 className={`mb-5 mt-5 ${typography.hero}`}>
              Your room.<br />Your curtains.<br />
              <em className="font-serif text-[1.09em] font-normal text-[#907356]">Beautifully<br className="hidden xl:block" /> reimagined.</em>
            </h1>
            <p className={`mb-6 max-w-[440px] text-[#666e61] ${typography.body}`}>
              See how beautiful curtains transform your own space. Upload a photo,
              explore stunning fabrics, and find a look you’ll love.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ActionLink href="/studio" className="rounded-full ">Try the curtain visualizer</ActionLink>
              <ActionLink href="/collections" variant="text" className="">Explore fabrics</ActionLink>
            </div>
            <p className="mb-0 mt-5 text-[11px] leading-relaxed text-[#777c6e]">Your photograph. Your fabric choices. A new view of home.</p>
          </div>
          <div className={`min-w-0 ${heroStyles.entrance}`}>
            <CurtainComparison
              before={pair.before}
              after={pair.after}
              variant="hero"
              autoPlay
              priority
              // beforeLabel="BEFORE"
              // afterLabel="AFTER"
              caption="Linen · warm ivory — AI-created room illustration, not a product photograph."
            />
          </div>
        </Container>
      </section>
      <Container className="grid gap-4 border-b border-solid border-[#dedbd2] py-7 text-[12px] text-muted sm:grid-cols-3"><span>Your own room photograph</span><span>Fabric and heading choices</span><span>Personal measurement guidance</span></Container>
      <DesignComposer />
      <Container as="section" className="py-14 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-end">
          <div>
            <Eyebrow>EXPLORE THE FEEL OF YOUR NEXT ROOM</Eyebrow>
            <h2 className={`mb-0 mt-4 ${typography.section}`}>
              Find the fabric that<br className="hidden sm:block" /> <em className="font-serif font-normal text-[#907356]">feels like home.</em>
            </h2>
          </div>
          <Link href="/collections" className="min-h-11 self-start border-b border-solid border-ink py-3 text-[13px] md:self-end">The fabric collection ↗</Link>
        </div>
        <FabricSelector />
      </Container>
      <Container
        as="section"
        className="grid items-center gap-12 py-20 md:grid-cols-2 md:gap-20 md:py-28"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          <Image
            src={images.editorial}
            alt="Soft daylight filtering through a white sheer curtain at an open window"
            fill
            sizes="(max-width: 767px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        <div>
          <Eyebrow>03 / THE DCORHOME APPROACH</Eyebrow>
          <h2 className={`mb-8 mt-5 ${typography.section}`}>
            Your next design begins
            <br />
            with <em className="font-serif font-normal text-[#97836b]">your room.</em>
          </h2>
          {[
            [
              "Upload",
              "Photograph the whole window in daylight. Preview the file before choosing to generate.",
            ],
            [
              "Design",
              "Choose a material direction, palette, pattern, heading and length. Adjust the details in your studio.",
            ],
            [
              "Compare & keep",
              "When generation is available, compare the returned edit with your original, save it privately and enquire with your measurements.",
            ],
          ].map(([title, copy], i) => (
            <div
              key={title}
              className="flex gap-6 border-t border-solid border-[#ddd9cf] py-6"
            >
              <span className="pt-1 text-[9px] tracking-[1px] text-[#a28b6e]">
                0{i + 1}
              </span>
              <div>
                <h3 className="mb-2 text-[14px] font-medium">{title}</h3>
                <p className={`mb-0 max-w-[320px] text-muted ${typography.body}`}>
                  {copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
      <section className="bg-[#ebe7dd]">
        <Container className="grid items-center gap-10 py-16 md:grid-cols-[1.1fr_.9fr] md:gap-20 md:py-20">
          <div>
            <Eyebrow>04 / MADE FOR YOUR WINDOW</Eyebrow>
            <h2 className={`mb-5 mt-4 ${typography.section}`}>
              Precision in the details.
              <br />
              <em className="font-serif font-normal text-[#97836b]">
                Ease in the everyday.
              </em>
            </h2>
            <p className={`max-w-[400px] text-muted ${typography.body}`}>
              Track width, finished drop and the right amount of fullness. Start
              with our measurement guide and bring the details to your
              consultation.
            </p>
            <ActionLink href="/measure" variant="text" className="mt-3">
              Find your perfect fit
            </ActionLink>
          </div>
          <div className="relative h-[330px] overflow-hidden bg-sand md:h-[390px]">
            <Image
              src="/images/atelier-interior.jpg"
              alt="Gathered drapery at a tall window, showing the importance of finished drop"
              fill
              sizes="(max-width: 767px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>
      <section className="bg-cream py-14 md:py-20"><Container><Eyebrow>A MATERIAL POINT OF VIEW</Eyebrow><h2 className={`mb-8 mt-4 ${typography.section}`}>A little more <em className="font-serif font-normal text-bronze">inspiration.</em></h2><div className="grid gap-8 md:grid-cols-2">{[{image:'/images/velvet-detail.jpg',title:'Depth, texture and the finished fall',href:'/inspiration/curtain-pleats-and-lengths',alt:'Brown velvet folds showing depth and drape'},{image:'/images/dark-textile.jpg',title:'A quieter palette for your room',href:'/inspiration/curtain-colors-modern-homes',alt:'Dark textile folds as a tonal palette reference'}].map(item=><Link key={item.href} href={item.href} className="group"><div className="relative aspect-[16/9] overflow-hidden bg-sand"><Image src={item.image} alt={item.alt} fill sizes="(max-width:767px) 100vw,50vw" className="object-cover transition-opacity group-hover:opacity-90"/></div><h3 className={`mt-5 ${typography.card}`}>{item.title}</h3><span className="text-[13px] underline underline-offset-4">Read the guide ?</span></Link>)}</div></Container></section>
      <Container as="section" className="py-14 md:py-20"><h2 className={`mb-8 ${typography.section}`}>Before your next <em className="font-serif font-normal text-bronze">beautiful view.</em></h2><FAQ /><div className="mt-8 flex flex-wrap gap-6"><ActionLink href="/how-it-works" variant="text">How visualization works</ActionLink><ActionLink href="/inspiration" variant="text">Explore curtain inspiration</ActionLink></div></Container>
      <Container
        as="section"
        className="flex flex-col justify-between gap-8 py-20 md:flex-row md:items-end md:py-24"
      >
        <div>
          <Eyebrow>YOUR NEXT CHAPTER AT HOME</Eyebrow>
          <h2 className={`mb-0 mt-4 ${typography.section}`}>
            Let’s consider
            <br />
            <em className="font-serif font-normal text-[#97836b]">your windows.</em>
          </h2>
        </div>
        <div>
          <p className={`mb-6 max-w-[320px] text-muted ${typography.body}`}>
            A considered choice starts with a conversation. Share your room,
            your ideas and your questions.
          </p>
          <ActionLink href="/contact">Arrange a consultation</ActionLink>
        </div>
      </Container>
    </>
  );
}
