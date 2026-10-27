import CatalogueBrowser from '@/components/curtains/CatalogueBrowser';
import { categories, fabricRecords } from '@/lib/server/fabric-records';
import { categoryFabrics } from '@/lib/seo-catalogue';
import guidance from '@/data/site/category-guidance.json';
import Container from '@/components/ui/Container';
import Link from 'next/link';
import { searchSwatches } from '@/lib/server/swatch-search';
import { parseSwatchQuery } from '@/lib/curtains/swatch-query';
import { pageMetadata } from '@/lib/seo';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams, keys=Object.keys(params).filter(key=>!key.startsWith('utm_')&&key!=='gclid');
 const query=parseSwatchQuery(params),paginationOnly=keys.every(key=>['page','sort','direction','view','size'].includes(key))&&query.sort==='name'&&query.direction==='asc'&&query.pageSize===24;
 const page=paginationOnly?(await searchSwatches(query)).page:1,hasPage=paginationOnly&&page>1;
 return pageMetadata(hasPage?`Curtain fabric references — page ${page}`:'Fabric Swatch Search','Browse illustrative curtain fabric shades and enquire for confirmed specifications.','/collections'+(hasPage?`?page=${page}`:''),{index:keys.length===0,override:hasPage?{}:undefined});
}
export default async function Collections({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=parseSwatchQuery(await searchParams),result=await searchSwatches(query);query.page=result.page;
 const collectionCategories=await categories(),records=await fabricRecords();
 const eligible=collectionCategories.filter(category=>category.active!==false&&category.id in guidance&&categoryFabrics(records,category.id).length);
 return <><CatalogueBrowser result={result} query={query} categories={collectionCategories}/><Container as="section" className="py-10"><h2 className="text-2xl">Choose a curtain direction with confidence.</h2><div className="flex flex-wrap gap-6">{eligible.map(category=><Link className="inline-flex min-h-11 items-center underline" key={category.id} href={`/collections/category/${category.id}`}>{category.name} curtain fabrics</Link>)}<Link className="inline-flex min-h-11 items-center underline" href="/inspiration/linen-vs-velvet-curtains">Compare linen and velvet textures</Link><Link className="inline-flex min-h-11 items-center underline" href="/inspiration/layer-sheer-main-curtains">Plan sheer and main curtain layers</Link><Link className="inline-flex min-h-11 items-center underline" href="/measure">Measure your window for curtains</Link></div></Container></>;
}
