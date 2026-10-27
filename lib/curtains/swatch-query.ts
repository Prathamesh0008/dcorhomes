import type { FabricRecord, FabricVariant } from './catalogue';
export const facetKeys = ['color','brand','collection','category','pattern','usage','composition','light'] as const;
export type FacetKey = typeof facetKeys[number];
export type SwatchQuery = { q:string; filters:Record<FacetKey,string[]>; sort:'name'|'collection'|'code'|'newest'; direction:'asc'|'desc'; view:'grid'|'list'; page:number; pageSize:number; widthMin?:number; widthMax?:number; gsmMin?:number; gsmMax?:number; rubMin?:number; rubMax?:number };
export type SwatchItem = { fabric:Omit<FabricRecord,'colors'>; variant:FabricVariant };
export type SwatchResult = { items:SwatchItem[]; total:number; page:number; pages:number; pageSize:number; facets:Record<FacetKey,{value:string;count:number}[]>; hasDates:boolean; hasRubData?:boolean; demo:boolean; storage:'repository'|'memory' };
export const numericKeys = ['widthMin','widthMax','gsmMin','gsmMax','rubMin','rubMax'] as const;
export function parseSwatchQuery(input:Record<string,string|string[]|undefined>):SwatchQuery {
 const one=(key:string)=>[input[key]].flat().filter((v):v is string=>typeof v==='string')[0]||'';
 const filters=Object.fromEntries(facetKeys.map(k=>[k,[...new Set([input[k]].flat().filter((v):v is string=>typeof v==='string').flatMap(v=>v.split('|')).map(v=>v.trim().slice(0,150)).filter(Boolean))].slice(0,30)])) as SwatchQuery['filters'];
 const size=Number(one('size')),rawSort=one('sort');
 const q:SwatchQuery={q:one('q').trim().slice(0,160),filters,sort:['collection','code','newest'].includes(rawSort)?rawSort as SwatchQuery['sort']:'name',direction:one('direction')==='desc'||rawSort==='name-desc'?'desc':'asc',view:one('view')==='list'?'list':'grid',page:Math.min(1000000,Math.max(1,Math.floor(Number(one('page')))||1)),pageSize:[12,24,48,90].includes(size)?size:24};
 for(const k of numericKeys){const s=one(k),n=Number(s);if(s&&Number.isFinite(n)&&n>=0&&n<=10000000)q[k]=n;}
 // Keep inverted bounds: zero results communicates the request instead of silently changing it.
 if(one('blackout'))q.filters.usage.push('Blackout');
 return q;
}
export function swatchParams(q:SwatchQuery):URLSearchParams {
 const p=new URLSearchParams();if(q.q)p.set('q',q.q);for(const key of facetKeys)for(const value of q.filters[key])p.append(key,value);
 p.set('sort',q.sort);p.set('direction',q.direction);p.set('view',q.view);p.set('page',String(q.page));p.set('size',String(q.pageSize));
 for(const k of numericKeys)if(q[k]!==undefined)p.set(k,String(q[k]));return p;
}
export const swatchHref=(q:SwatchQuery)=>'/collections?'+swatchParams(q).toString();
