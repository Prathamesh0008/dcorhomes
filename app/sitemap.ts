import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { editorialContent } from "@/lib/server/content";
import { fabricRecords,categories } from '@/lib/server/fabric-records';
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{return [...['','/collections','/studio','/measure','/contact','/about','/how-it-works','/faq','/inspiration'],...(await editorialContent()).articles.map(a=>`/inspiration/${a.slug}`),...(await fabricRecords()).map(p=>`/collections/${p.slug}`),...(await categories()).filter(c=>c.active!==false).map(c=>`/collections?category=${c.id}`)].map(path=>({url:siteUrl+path}));}
