import CatalogueBrowser from '@/components/curtains/CatalogueBrowser';
import { categories } from '@/lib/server/fabric-records';
import { searchSwatches } from '@/lib/server/swatch-search';
import { parseSwatchQuery } from '@/lib/curtains/swatch-query';
import { pageMetadata } from '@/lib/seo';
export const dynamic='force-dynamic';
export const metadata=pageMetadata('Fabric Swatch Search','Search fabric shades, compare verified specifications and enquire about your selected cloth.','/collections');
export default async function Collections({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=parseSwatchQuery(await searchParams),result=await searchSwatches(query);query.page=result.page;
 return <CatalogueBrowser result={result} query={query} categories={await categories()}/>;
}
