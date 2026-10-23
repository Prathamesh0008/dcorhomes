import CurtainDesignComposer from "@/components/curtains/CurtainDesignComposer";
import HomeBelowHero from "@/components/home/HomeBelowHero";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Curtains, beautifully reimagined","Explore curtain fabrics, compose a design direction and visualize your own room.","/");
import { homepagePair } from "@/lib/server/showcase";
export const dynamic="force-dynamic";
import { typography } from "@/lib/typography";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import ActionLink from "@/components/ui/ActionLink";
import HeroComparisonSlider from "@/components/home/HeroComparisonSlider";
import { heroComparisonSlides } from "@/lib/hero-comparisons";
import heroStyles from "@/components/interactive/HeroEntrance.module.css";
export default async function HomePage() {
  const pair=(await homepagePair());
  return (
    <>
      <section className="bg-[#f3efe6]">
        <Container className="grid items-center gap-8 py-8 md:gap-10 md:py-12 lg:grid-cols-[.94fr_1.06fr] lg:gap-12 lg:py-14">
          <div className={`order-2 min-w-0 lg:order-1 ${heroStyles.entrance}`}>
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
            <p className="mb-0 mt-5 text-[11px] leading-relaxed text-[#777c6e]">AI-edited curtain concepts shown for inspiration.</p>
          </div>
          <div className={`order-1 min-w-0 lg:order-2 ${heroStyles.entrance}`}>
            <HeroComparisonSlider slides={heroComparisonSlides} illustration={{id:"existing-room-illustration",beforeSrc:pair.before,afterSrc:pair.after,alt:"Living room curtain illustration",label:"Room illustration"}}/>
          </div>
        </Container>
      </section>
      <CurtainDesignComposer />
      <HomeBelowHero />
    </>
  );
}
