import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { editorialContent } from "@/lib/server/content";
import { catalogue } from "@/lib/server/catalogue";
export const dynamic="force-dynamic";
export default function sitemap():MetadataRoute.Sitemap{return [...['','/collections','/studio','/measure','/contact','/how-it-works','/faq','/inspiration'],...editorialContent().articles.map(a=>`/inspiration/${a.slug}`),...catalogue().map(p=>`/collections/${p.id}`)].map(path=>({url:siteUrl+path}));}
