import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { editorialContent } from "@/lib/server/content";
import { fabricRecords,categories } from '@/lib/server/fabric-records';
export const dynamic="force-dynamic";
export default function sitemap():MetadataRoute.Sitemap{return [...['','/collections','/studio','/measure','/contact','/how-it-works','/faq','/inspiration'],...editorialContent().articles.map(a=>`/inspiration/${a.slug}`),...fabricRecords().map(p=>`/collections/${p.slug}`),...categories().filter(c=>c.active!==false).map(c=>`/collections?category=${c.id}`)].map(path=>({url:siteUrl+path}));}
