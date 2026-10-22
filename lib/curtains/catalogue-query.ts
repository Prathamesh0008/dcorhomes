import type { FabricRecord } from './catalogue';
import { categoryId, activeVariants } from './categories';
import { technicalMatch, emptyTechnicalFilters } from './catalogue-filters';
export type CatalogueQuery=Record<string,string>;
export function queryFabrics(records:FabricRecord[], q:CatalogueQuery) {
 const technical={...emptyTechnicalFilters,...Object.fromEntries(Object.keys(emptyTechnicalFilters).map(k=>[k,q[k]||'']))};
 const matches=records.filter(f=>f.active!==false&&(!q.category||categoryId(f)===q.category)&&(!q.type||f.category===q.type)&&(!q.usage||f.usage.includes(q.usage as 'main'|'sheer'))&&(!q.color||activeVariants(f).some(c=>c.family===q.color&&c.available!==false))&&(!q.blackout||(f.blackoutPercentage!=null&&f.blackoutPercentage>0)||f.category==='Blackout')&&technicalMatch(f,technical)&&`${f.name} ${f.variety||''} ${f.description} ${f.sku||''} ${f.collection||''} ${f.colors.map(c=>`${c.name} ${c.colorCode} ${c.variantSku||''}`).join(' ')}`.toLowerCase().includes((q.q||'').trim().toLowerCase()));
 matches.sort((a,b)=>q.sort==='name-desc'?b.name.localeCompare(a.name):q.sort==='colors'?activeVariants(b).filter(c=>c.available===true).length-activeVariants(a).filter(c=>c.available===true).length:a.name.localeCompare(b.name));
 const pageSize=12,total=matches.length,pages=Math.max(1,Math.ceil(total/pageSize)),page=Math.min(pages,Math.max(1,Number.parseInt(q.page||'1')||1));
 return {items:matches.slice((page-1)*pageSize,page*pageSize),total,pages,page};
}
