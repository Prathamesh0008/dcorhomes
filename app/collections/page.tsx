import CatalogueBrowser from '@/components/curtains/CatalogueBrowser';
import { categories, fabricRecords } from '@/lib/server/fabric-records';
import { queryFabrics } from '@/lib/curtains/catalogue-query';
import { pageMetadata } from '@/lib/seo';
export const dynamic='force-dynamic';
type Context={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Context){const q=await searchParams,category=categories().find(c=>c.id===q.category);return pageMetadata(category?`${category.name} curtain fabrics`:'Curtain fabric catalogue',category?.description||'Explore curtain fabric varieties, shade references and technical specifications. Contact Dcorhome for availability and quotations.',category?`/collections?category=${category.id}`:'/collections');}
export default async function Collections({searchParams}:Context){const query=Object.fromEntries(Object.entries(await searchParams).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));return <CatalogueBrowser result={queryFabrics(fabricRecords(),query)} query={query} categories={categories()}/>;}
