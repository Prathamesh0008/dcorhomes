import { fabricRecords } from "@/lib/server/fabric-records";
import { availableOptions } from "@/lib/server/options";
import { HttpError } from "@/lib/server/security";
import { manualSelection, normalizeManual, patternsFor, type ManualConfig } from "@/lib/curtains/manual-config";
import type { FabricRecord,FabricVariant } from "@/lib/curtains/catalogue";
export async function validateConfiguration(input:Record<string,unknown>){
 const records=await fabricRecords(),options=await availableOptions();
 let raw:Partial<ManualConfig>;
 try{raw=typeof input.manual==='string'?JSON.parse(input.manual):input.manual as Partial<ManualConfig>;if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error();}catch{throw new HttpError(400,'Review your main curtain and sheer selections before generating.');}
 const keys=['mainFabric','mainColor','sheerFabric','sheerColor','mainEnabled','sheerEnabled','heading','sheerHeading','pattern','room','panels','curtainLength','fullness'] as const;
 raw=Object.fromEntries(keys.map(key=>[key,raw[key]])) as Partial<ManualConfig>;
 const resolve=(id:unknown,shade:unknown,layer:'main'|'sheer',enabled:boolean)=>{
  const fabric=records.find(f=>f.id===id&&f.active!==false&&f.usage.includes(layer)),variant=fabric?.colors.find(c=>c.id===shade&&c.active!==false&&c.available!==false);
  if(!fabric||!variant)throw new HttpError(400,`The selected ${layer==='main'?'main curtain':'sheer'} fabric or shade is unavailable.`);
  if(enabled&&!/^#[a-f0-9]{6}$/i.test(variant.hexPreview||''))throw new HttpError(400,'This shade needs a supplier color reference before it can be visualized.');
  return {fabric,variant};
 };
 if(typeof raw.mainEnabled!=='boolean'||typeof raw.sheerEnabled!=='boolean'||!raw.mainEnabled&&!raw.sheerEnabled)throw new HttpError(400,'Include at least one curtain layer.');
 const main=resolve(raw.mainFabric,raw.mainColor,'main',raw.mainEnabled),sheer=resolve(raw.sheerFabric,raw.sheerColor,'sheer',raw.sheerEnabled);
 if(!main.fabric.compatibleHeadingStyles.includes(raw.heading||'')||!sheer.fabric.compatibleHeadingStyles.includes(raw.sheerHeading||'')||!patternsFor(main.fabric).includes(raw.pattern||''))throw new HttpError(400,'The heading or pattern is incompatible with your selected fabric.');
 const normalized=normalizeManual(raw,records);
 for(const key of ['curtainLength','fullness','panels','room'] as const)if(raw[key]!==normalized[key])throw new HttpError(400,'Choose supported curtain length, fullness, panels and room settings.');
 const style=String(input.style||'Modern');if(!options.styles.includes(style))throw new HttpError(400,'Choose a supported design style.');
 const selection={...manualSelection(normalized,records),style};
 const describe=({fabric,variant}:{fabric:FabricRecord;variant:FabricVariant})=>({fabricId:fabric.id,fabricName:fabric.name,category:fabric.category,variantId:variant.id,shadeName:variant.name,shadeCode:variant.colorCode,hex:variant.hexPreview,texture:fabric.texture||fabric.weave,composition:fabric.composition,source:fabric.source});
 return {selection,manual:normalized,main,sheer,description:{style,pattern:normalized.pattern,room:normalized.room,heading:normalized.heading,sheerHeading:normalized.sheerHeading,curtainLength:normalized.curtainLength,fullness:normalized.fullness,panels:normalized.panels,mainEnabled:normalized.mainEnabled,sheerEnabled:normalized.sheerEnabled,main:describe(main),sheer:describe(sheer)}};
}
