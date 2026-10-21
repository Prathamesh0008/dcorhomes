import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import Image from "@/components/ui/Photograph";
import Container from "@/components/ui/Container";
import { typography } from "@/lib/typography";
import { editorialContent } from "@/lib/server/content";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Curtain inspiration","Practical curtain guidance on fabrics, light, color, headings and measurements.","/inspiration");
export default function Inspiration(){return <Container as="section" className="py-12 md:py-20"><h1 className={typography.page}>Ideas for a <em className="font-serif font-normal text-bronze">considered home.</em></h1><p className={`max-w-2xl text-muted ${typography.body}`}>Explore light, texture and the practical details behind a curtain that belongs in your room.</p><div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{editorialContent().articles.map(article=><article key={article.slug}><Link href={`/inspiration/${article.slug}`} className="group block"><div className="relative aspect-[4/3] overflow-hidden bg-sand"><Image src={article.image} alt="Curtain and fabric reference" fill sizes="(max-width:639px) 100vw,40vw" className="object-cover transition-opacity group-hover:opacity-85"/></div><h2 className={`mt-5 ${typography.card}`}>{article.title}</h2><p className={`text-muted ${typography.body}`}>{article.description}</p><span className="text-[13px] underline underline-offset-4">Read the guide ↗</span></Link></article>)}</div></Container>;}
