
import { fabricRecords } from './fabric-records';
import { categoryId } from '@/lib/curtains/categories';
import { facetKeys, type FacetKey, type SwatchItem, type SwatchQuery, type SwatchResult } from '@/lib/curtains/swatch-query';
import type { FabricRecord } from '@/lib/curtains/catalogue';
type Indexed={id:string;fabricId:string;item:SwatchItem;name:string;collection:string;code:string;published:number|null;width:number|null;gsm:number|null;rub:number|null;search:string;facets:Record<FacetKey,string[]>};
export function indexSwatches(records:FabricRecord[]):Indexed[]{return records.filter(f=>f.active!==false).flatMap(f=>{
 const {colors,...fabric}=f,verified=f.source==='supplier';
 return colors.filter(v=>v.active!==false).map(variant=>({id:JSON.stringify([f.id,variant.id]),fabricId:f.id,item:{fabric,variant},name:(f.name+' '+variant.name).toLowerCase(),collection:f.collection||'',code:variant.variantSku||variant.colorCode||f.sku||'',published:f.publishedAt?Date.parse(f.publishedAt)||null:null,width:verified?f.fabricWidthCm??null:null,gsm:verified?f.weightGsm??null:null,rub:verified?f.abrasionRubCount??null:null,search:[f.name,f.variety,f.sku,f.collection,f.brand,variant.name,variant.variantSku,variant.colorCode].filter(Boolean).join(' ').toLowerCase(),facets:{color:variant.family?[variant.family]:[],brand:verified&&f.brand?[f.brand]:[],collection:verified&&f.collection?[f.collection]:[],category:[categoryId(f)],pattern:verified&&f.pattern?[f.pattern]:[],usage:verified?[...new Set([...(f.applications||[]),...f.usage.map(u=>u==='sheer'?'Sheer curtains':'Main curtains'),...(f.blackoutPercentage&&f.blackoutPercentage>0?['Blackout']:[])])]:[],composition:verified&&f.composition?[f.composition]:[],light:verified&&(f.lightFiltering||f.opacity)?[f.lightFiltering||f.opacity!]:[]}}));
 });}
function matches(row:Indexed,q:SwatchQuery,exclude?:FacetKey){
 if(q.q&&!row.search.includes(q.q.toLowerCase()))return false;
 for(const key of facetKeys)if(key!==exclude&&q.filters[key].length&&!q.filters[key].some(v=>row.facets[key].includes(v)))return false;
 for(const [field,min,max]of [['width',q.widthMin,q.widthMax],['gsm',q.gsmMin,q.gsmMax],['rub',q.rubMin,q.rubMax]] as const){const value=row[field];if((min!==undefined||max!==undefined)&&(value===null||(min!==undefined&&value<min)||(max!==undefined&&value>max)))return false;}return true;
}
// Pure catalogue projection: filtering, faceting, sorting and paging need no persistence.
export function memorySwatchSearch(records:FabricRecord[],q:SwatchQuery):SwatchResult{
 const rows=indexSwatches(records),facets={} as SwatchResult['facets'];
 for(const key of facetKeys){const counts=new Map<string,number>();for(const row of rows.filter(r=>matches(r,q,key)))for(const value of row.facets[key])counts.set(value,(counts.get(value)||0)+1);facets[key]=[...counts].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value));}
 const selected=rows.filter(r=>matches(r,q));selected.sort((a,b)=>{if(q.sort==='newest'&&(a.published===null)!==(b.published===null))return a.published===null?1:-1;const av=q.sort==='newest'?a.published??0:a[q.sort],bv=q.sort==='newest'?b.published??0:b[q.sort];return ((typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv)))*(q.direction==='desc'?-1:1))||a.id.localeCompare(b.id);});
 const total=selected.length,pages=Math.max(1,Math.ceil(total/q.pageSize)),page=Math.min(q.page,pages);
 return {items:selected.slice((page-1)*q.pageSize,page*q.pageSize).map(r=>r.item),total,pages,page,pageSize:q.pageSize,facets,hasDates:rows.some(r=>r.published!==null),hasRubData:records.some(f=>f.source==='supplier'&&f.abrasionRubCount!==undefined),demo:records.some(f=>f.source==='demo'),storage:'memory'};
}
// Version-controlled products and embedded variants are the source of truth.
// Faceting is a pure request-local projection; no second mutable SQL index exists.
export async function searchSwatches(q:SwatchQuery):Promise<SwatchResult>{
 const result=memorySwatchSearch(await fabricRecords(),q);
 return {...result,storage:'repository'};
}
