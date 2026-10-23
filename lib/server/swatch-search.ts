import { createHash } from 'node:crypto';
import { catalogueSql as sql, databaseReady, transaction } from './db';
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
// Safe fallback when durable storage is not configured; filtering/paging still occurs on the server.
export function memorySwatchSearch(records:FabricRecord[],q:SwatchQuery):SwatchResult{
 const rows=indexSwatches(records),facets={} as SwatchResult['facets'];
 for(const key of facetKeys){const counts=new Map<string,number>();for(const row of rows.filter(r=>matches(r,q,key)))for(const value of row.facets[key])counts.set(value,(counts.get(value)||0)+1);facets[key]=[...counts].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value));}
 const selected=rows.filter(r=>matches(r,q));selected.sort((a,b)=>{if(q.sort==='newest'&&(a.published===null)!==(b.published===null))return a.published===null?1:-1;const av=q.sort==='newest'?a.published??0:a[q.sort],bv=q.sort==='newest'?b.published??0:b[q.sort];return ((typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv)))*(q.direction==='desc'?-1:1))||a.id.localeCompare(b.id);});
 const total=selected.length,pages=Math.max(1,Math.ceil(total/q.pageSize)),page=Math.min(q.page,pages);
 return {items:selected.slice((page-1)*q.pageSize,page*q.pageSize).map(r=>r.item),total,pages,page,pageSize:q.pageSize,facets,hasDates:rows.some(r=>r.published!==null),demo:records.some(f=>f.source==='demo'),storage:'memory'};
}
async function synchronize(records:FabricRecord[]){
 const digest=createHash('sha256').update(JSON.stringify(records)).digest('hex');
 await transaction(async()=>{
  await sql('CREATE TABLE IF NOT EXISTS swatch_parents (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  await sql('CREATE TABLE IF NOT EXISTS swatch_variants (id TEXT PRIMARY KEY, fabric_id TEXT NOT NULL, data TEXT NOT NULL, name TEXT NOT NULL, collection TEXT NOT NULL, code TEXT NOT NULL, published DOUBLE PRECISION, width DOUBLE PRECISION, gsm DOUBLE PRECISION, rub DOUBLE PRECISION, search TEXT NOT NULL)');
  await sql('CREATE TABLE IF NOT EXISTS swatch_facets (variant_id TEXT NOT NULL, facet TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(variant_id,facet,value))');
  await sql('CREATE INDEX IF NOT EXISTS swatch_facet_lookup ON swatch_facets(facet,value,variant_id)');
  for(const column of ['name','collection','code','published','width','gsm','rub','fabric_id'])await sql(`CREATE INDEX IF NOT EXISTS swatch_${column} ON swatch_variants(${column},id)`);
  await sql('CREATE TABLE IF NOT EXISTS swatch_revision (id TEXT PRIMARY KEY, digest TEXT NOT NULL)');
  const prior=await sql<{digest:string}>('SELECT digest FROM swatch_revision WHERE id=?',['catalogue']);if(prior[0]?.digest===digest)return;
  await sql('DELETE FROM swatch_facets');await sql('DELETE FROM swatch_variants');await sql('DELETE FROM swatch_parents');
  for(const f of records){const {colors,...parent}=f;await sql('INSERT INTO swatch_parents(id,data) VALUES (?,?)',[f.id,JSON.stringify(parent)]);}
  for(const row of indexSwatches(records)){
   await sql('INSERT INTO swatch_variants(id,fabric_id,data,name,collection,code,published,width,gsm,rub,search) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[row.id,row.fabricId,JSON.stringify(row.item.variant),row.name,row.collection,row.code,row.published,row.width,row.gsm,row.rub,row.search]);
   for(const key of facetKeys)for(const value of new Set(row.facets[key]))await sql('INSERT INTO swatch_facets(variant_id,facet,value) VALUES (?,?,?)',[row.id,key,value]);
  }
  await sql('INSERT INTO swatch_revision(id,digest) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET digest=excluded.digest',['catalogue',digest]);
 });
}
function where(q:SwatchQuery,exclude?:FacetKey){
 const clauses:string[]=[],values:(string|number|null)[]=[];
 if(q.q){clauses.push("v.search LIKE ? ESCAPE '!' ");values.push('%'+q.q.toLowerCase().replace(/[!%_]/g,c=>'!'+c)+'%');}
 for(const key of facetKeys)if(key!==exclude&&q.filters[key].length){clauses.push(`EXISTS (SELECT 1 FROM swatch_facets f WHERE f.variant_id=v.id AND f.facet=? AND f.value IN (${q.filters[key].map(()=>'?').join(',')}))`);values.push(key,...q.filters[key]);}
 for(const [column,min,max]of [['width',q.widthMin,q.widthMax],['gsm',q.gsmMin,q.gsmMax],['rub',q.rubMin,q.rubMax]] as const){if(min!==undefined){clauses.push(`v.${column}>=?`);values.push(min);}if(max!==undefined){clauses.push(`v.${column}<=?`);values.push(max);}}
 return {text:clauses.length?' WHERE '+clauses.join(' AND '):'',values};
}
export async function searchSwatches(q:SwatchQuery):Promise<SwatchResult>{
 const records=await fabricRecords();if(!databaseReady())return memorySwatchSearch(records,q);await synchronize(records);
 // A snapshot transaction prevents an admin update changing counts between queries.
 return transaction(async()=>{
  const filter=where(q),count=await sql<{total:number}>('SELECT COUNT(*) AS total FROM swatch_variants v'+filter.text,filter.values),total=Number(count[0].total),pages=Math.max(1,Math.ceil(total/q.pageSize)),page=Math.min(q.page,pages);
  const column={name:'name',collection:'collection',code:'code',newest:'published'}[q.sort],direction=q.direction==='desc'?'DESC':'ASC';
  const data=await sql<{parent:string;variant:string}>(`SELECT p.data AS parent,v.data AS variant FROM swatch_variants v JOIN swatch_parents p ON p.id=v.fabric_id${filter.text} ORDER BY ${q.sort==='newest'?'CASE WHEN v.published IS NULL THEN 1 ELSE 0 END, ':''}v.${column} ${direction},v.id ASC LIMIT ? OFFSET ?`,[...filter.values,q.pageSize,(page-1)*q.pageSize]);
  const facets={} as SwatchResult['facets'];for(const key of facetKeys){const w=where(q,key);facets[key]=(await sql<{value:string;count:number}>(`SELECT facet.value,COUNT(*) AS count FROM swatch_variants v JOIN swatch_facets facet ON facet.variant_id=v.id${w.text}${w.text?' AND':' WHERE'} facet.facet=? GROUP BY facet.value ORDER BY facet.value`,[...w.values,key])).map(r=>({...r,count:Number(r.count)}));}
  return {items:data.map(r=>({fabric:JSON.parse(r.parent),variant:JSON.parse(r.variant)})),total,pages,page,pageSize:q.pageSize,facets,hasDates:records.some(f=>Boolean(f.publishedAt)),demo:records.some(f=>f.source==='demo'),storage:'database'};
 });
}
