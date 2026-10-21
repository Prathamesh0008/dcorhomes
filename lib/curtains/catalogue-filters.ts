import type { FabricRecord } from './catalogue';
export type TechnicalFilters={ composition:string;pattern:string;opacity:string;widthMin:string;widthMax:string;gsmMin:string;gsmMax:string };
export const emptyTechnicalFilters:TechnicalFilters={composition:'',pattern:'',opacity:'',widthMin:'',widthMax:'',gsmMin:'',gsmMax:''};
export function technicalMatch(record:FabricRecord|undefined,filters:TechnicalFilters){
  for(const key of ['composition','pattern','opacity'] as const)if(filters[key]&&record?.[key]!==filters[key])return false;
  for(const [key,field,minimum]of [['widthMin','fabricWidthCm',true],['widthMax','fabricWidthCm',false],['gsmMin','weightGsm',true],['gsmMax','weightGsm',false]] as const){if(filters[key]!==''){const value=record?.[field],limit=Number(filters[key]);if(value==null||!Number.isFinite(limit)||(minimum?value<limit:value>limit))return false;}}
  return true;
}
