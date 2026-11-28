import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import Container from '@/components/ui/Container';
import HomeFabricCollection from './HomeFabricCollection';
import HomeContactForm from './HomeContactForm';
import contactStyles from './HomeContact.module.css';
import { homepageCatalogue } from '@/lib/server/homepage-catalogue';
import { editorialContent } from '@/lib/server/content';

const questions = [
  ['What types of curtain fabrics do you offer?', 'Explore sheer, linen, silk, velvet, textured and other curtain fabrics in our collection.'],
  ['Can I request fabric samples?', 'Contact our team to discuss fabric samples and confirm the colour and texture before deciding.'],
  ['How do I choose the right fabric?', 'Consider the light, privacy and atmosphere you want in your room. Our team can help you explore suitable options.'],
  ['Can you help with measurements?', 'Our measurement guide is a useful place to start. Contact us if you would like assistance with your window.'],
  ['Are your fabrics suitable for commercial spaces?', 'Contact our team to discuss fabric options for your project and its requirements.'],
  ['How do I enquire about a fabric?', 'Explore the collection and contact us with the fabrics and colours you are interested in.'],
];
const button = 'inline-flex min-h-12 items-center justify-center gap-8 bg-[#34563e] px-6 text-sm font-medium text-white transition-colors hover:bg-[#243f2d]';

export default async function HomeBelowHero() {
  const [{ records }, { articles }] = await Promise.all([homepageCatalogue(), editorialContent()]);
  const featured = records.filter(f => f.active !== false && f.images?.length).slice(0, 5);
  return <>
    <Container as="section" className="py-6 md:py-8">
      <div className="grid items-center overflow-hidden bg-[#505f80] text-white md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <img src="/images/9.png" alt="Dcorhome curtains" width={320} height={320} className="mx-auto h-auto w-full max-w-[320px] object-contain" />
        <div className="px-7 py-6 md:px-8 md:py-8"><h2 className="mb-3 text-3xl font-semibold md:text-4xl">Discover beautiful curtains for your home</h2><p className="mb-6 max-w-2xl leading-7 text-white/90">Explore fabrics, colours and designs that bring warmth, comfort and style to your space.</p><Link href="/contact" className="inline-flex min-h-12 items-center bg-white px-6 text-sm font-semibold text-[#505f80]">Get in touch <ArrowRight size={16} className="ml-5" /></Link></div>
      </div>
    </Container>
    <Container as="section" className="pb-8 md:pb-10">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10"><img src="/images/8.png" alt="Dcorhome curtain fabric sample books" width={1536} height={1024} className="h-auto w-full object-contain" /><div><p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#53705b]">About us</p><h2 className="mb-5 text-3xl font-semibold leading-tight md:text-4xl">Curtain fabrics for a home that feels like yours.</h2><p className="mb-6 text-base leading-7 text-muted">At Dcorhome, we bring style, comfort and character to interiors with a selection of curtain and upholstery fabrics. Explore colours, textures and designs for homes and commercial spaces, and let our team help you find the right fabric for your needs.</p><Link href="/about" className={button}>Learn more <ArrowRight size={16}/></Link></div></div>
      <div className="mt-8 grid gap-6 text-center md:grid-cols-2 md:gap-10"><div><h3 className="mb-2 text-lg font-semibold">Our mission</h3><p className="m-0 leading-7 text-muted">To make beautiful interiors more accessible with thoughtful fabric choices and personal service.</p></div><div><h3 className="mb-2 text-lg font-semibold">Our vision</h3><p className="m-0 leading-7 text-muted">To help create beautiful spaces through quality fabrics, considered design and honest service.</p></div></div>
    </Container>
    <HomeFabricCollection />
    <Container as="section" className="py-8 md:py-10"><div className="mb-8 flex items-end justify-between gap-4"><h2 className="m-0 text-3xl font-semibold">Explore curtain designs</h2><Link href="/collections" className="shrink-0 underline underline-offset-4">View all</Link></div><div className="grid grid-cols-2 gap-4 md:grid-cols-5">{featured.map(fabric => <Link href={`/collections/${fabric.slug}`} key={fabric.id} className="group"><div className="aspect-[4/5] overflow-hidden bg-[#eeeae2]"><img src={fabric.images[0]} alt={fabric.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><h3 className="mt-3 text-sm font-medium">{fabric.name}</h3></Link>)}</div></Container>
    <Container as="section" className="pb-6 md:pb-8"><div className="grid items-center gap-8 bg-[#eeeae1] md:grid-cols-2"><img src="/images/10.png" alt="Designer curtains in a dining room" loading="lazy" width={1640} height={924} className="h-auto w-full object-contain"/><div className="px-7 pb-9 md:px-10 md:py-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#53705b]">Here to help</p><h2 className="mb-4 text-3xl font-semibold">Let's find the right fabric together.</h2><p className="mb-6 leading-7 text-muted">Tell us about your space and explore the colours, textures and details that matter to you.</p><Link href="/contact" className={button}>Contact us <ArrowRight size={16}/></Link></div></div></Container>
    <section className="bg-[#f7f6f2] py-8 md:py-10"><Container><h2 className="mb-9 text-center text-3xl font-semibold text-[#34563e]">Good questions.<br/>Thoughtful answers.</h2><div className="grid items-start gap-3 md:grid-cols-2">{questions.map(([question, answer]) => <details key={question} className="group border border-solid border-[#c3c9c1] bg-white px-5"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">{question}<Plus size={18} className="shrink-0 transition-transform group-open:rotate-45"/></summary><p className="mb-5 leading-7 text-muted">{answer}</p></details>)}</div><div className="mt-6 text-center"><Link href="/faq" className="underline underline-offset-4">View all FAQs</Link></div></Container></section>
    <Container as="section" className="py-8 md:py-10"><div className="mb-8 flex items-end justify-between gap-4"><h2 className="m-0 text-3xl font-semibold">From our journal</h2><Link href="/inspiration" className="shrink-0 underline underline-offset-4">View all</Link></div><div className="grid gap-7 md:grid-cols-3">{articles.slice(0, 3).map(article => <Link key={article.slug} href={`/inspiration/${article.slug}`} className="group"><div className="aspect-[4/3] overflow-hidden bg-[#eeeae2]"><img src={article.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><h3 className="mb-2 mt-4 text-xl font-medium">{article.title}</h3><p className="text-sm leading-6 text-muted">{article.description}</p></Link>)}</div></Container>
    <section aria-labelledby="home-enquiry-heading" className={`${contactStyles.section} py-8 text-[#3b2113] md:py-10`}>
      <Container className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#1c0c05]">A personal conversation</p>
          <h2 id="home-enquiry-heading" className="m-0 text-3xl font-medium leading-tight md:text-4xl">
            Let&apos;s create something<br />
            <em className="font-serif font-normal italic text-[#4b2817]">beautiful for your windows.</em>
          </h2>
        </div>
        <HomeContactForm />
      </Container>
    </section>
  </>;
}



