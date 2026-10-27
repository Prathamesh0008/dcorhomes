import type { MetadataRoute } from "next";
import { canonicalUrl, indexingAllowed } from "@/lib/seo";
import { seoInventory } from '@/lib/server/seo-inventory';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{if(!indexingAllowed())return [];return (await seoInventory()).map(item=>({url:canonicalUrl(item.path),...(item.lastModified?{lastModified:item.lastModified}:{})}));}
