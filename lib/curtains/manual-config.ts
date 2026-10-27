import type { DesignSelection } from '@/lib/design-options';
import { catalogueRecords } from '../../data/catalogue';
import type { FabricRecord } from './catalogue';
export const fabrics: FabricRecord[] = catalogueRecords;
export type ManualConfig = { mainFabric: string; mainColor: string; sheerFabric: string; sheerColor: string; mainEnabled: boolean; sheerEnabled: boolean; heading: string; sheerHeading: string; pattern: string; room: string; panels: 'Single' | 'Pair'; curtainLength: string; fullness: string };
export const manualDefault: ManualConfig={ mainFabric:'sienna',mainColor:'Warm Ivory',sheerFabric:'solstice',sheerColor:'Soft Ivory',mainEnabled:true,sheerEnabled:true,heading:'Wave Pleat',sheerHeading:'Wave Pleat',pattern:'Solid',room:'Living Room',panels:'Pair',curtainLength:'Floor length',fullness:'2' };
export const storageKey='dcorhome-manual-v1';
export function fabricFor(id: string, layer:'main'|'sheer', records: FabricRecord[]=fabrics) {return records.find(f=>f.id===id&&f.usage.includes(layer)&&f.colors.some(c=>c.active!==false&&c.available!==false)&&f.compatibleHeadingStyles.length>0) || records.find(f=>f.usage.includes(layer)&&f.colors.some(c=>c.active!==false&&c.available!==false)&&f.compatibleHeadingStyles.length>0) || fabrics.find(f=>f.usage.includes(layer))!;}
export function patternsFor(fabric: FabricRecord): string[] { return fabric.pattern ? [fabric.pattern] : ['Solid']; }
export function normalizeManual(raw: Partial<ManualConfig>, records: FabricRecord[]=fabrics): ManualConfig {
  const value={...manualDefault,...raw},main=fabricFor(value.mainFabric,'main',records),sheer=fabricFor(value.sheerFabric,'sheer',records);
  return {...value,mainFabric:main.id,sheerFabric:sheer.id,mainColor:main.colors.some(c=>c.id===value.mainColor&&c.available!==false&&c.active!==false)?value.mainColor:main.colors.find(c=>c.available!==false&&c.active!==false)!.id,sheerColor:sheer.colors.some(c=>c.id===value.sheerColor&&c.available!==false&&c.active!==false)?value.sheerColor:sheer.colors.find(c=>c.available!==false&&c.active!==false)!.id,heading:main.compatibleHeadingStyles.includes(value.heading)?value.heading:main.compatibleHeadingStyles[0],sheerHeading:sheer.compatibleHeadingStyles.includes(value.sheerHeading)?value.sheerHeading:sheer.compatibleHeadingStyles[0],pattern:patternsFor(main).includes(value.pattern)?value.pattern:patternsFor(main)[0],panels:value.panels==='Single'?'Single':'Pair',curtainLength:['Floor length','Sill length','Below sill'].includes(value.curtainLength)?value.curtainLength:'Floor length',fullness:['1.5','2','2.5'].includes(value.fullness)?value.fullness:'2',room:['Living Room','Bedroom','Dining Room','Home Office','Guest Room','Nursery'].includes(value.room)?value.room:'Living Room',mainEnabled:typeof value.mainEnabled==='boolean'?value.mainEnabled:true,sheerEnabled:typeof value.sheerEnabled==='boolean'?value.sheerEnabled:true};
}
export function manualSelection(value: ManualConfig, records: FabricRecord[]=fabrics): Partial<DesignSelection> {
  const main=fabricFor(value.mainFabric,'main',records),sheer=fabricFor(value.sheerFabric,'sheer',records);
  return {curtainLength:value.curtainLength,fullness:value.fullness,fabric:main.id,configuratorFabric:main.name,configuratorStyle:value.heading,heading:value.heading,color:main.colors.find(c=>c.id===value.mainColor)!.hexPreview,sheerColor:sheer.colors.find(c=>c.id===value.sheerColor)!.hexPreview,sheerFabric:sheer.id,sheerHeading:value.sheerHeading,mainEnabled:String(value.mainEnabled),sheerEnabled:String(value.sheerEnabled),manual:JSON.stringify(value),layers:value.sheerEnabled&&value.mainEnabled?'Layered sheer and drape':'Single curtain',pattern:value.pattern,roomType:value.room==='Home Office'?'Office':value.room.charAt(0)+value.room.slice(1).toLowerCase()};
}
export function readManual(selection?: Partial<DesignSelection>, records: FabricRecord[]=fabrics): ManualConfig {
  if(selection?.manual)try{return normalizeManual(JSON.parse(selection.manual),records);}catch{}
  let saved:Partial<ManualConfig>={};try{const parsed:unknown=JSON.parse(localStorage.getItem(storageKey)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))saved=parsed as Partial<ManualConfig>;}catch{}
  if(selection?.fabric){const f=fabricFor(selection.fabric,'main',records);saved.mainFabric=f.id;const color=f.colors.find(c=>Boolean(selection.color)&&c.hexPreview?.toLowerCase()===selection.color?.toLowerCase());if(color)saved.mainColor=color.id;if(selection.heading)saved.heading=selection.heading;}
  if(selection?.sheerFabric)saved.sheerFabric=selection.sheerFabric;
  if(selection?.sheerColor){const sheer=fabricFor(saved.sheerFabric||manualDefault.sheerFabric,'sheer',records),color=sheer.colors.find(c=>c.hexPreview?.toLowerCase()===selection.sheerColor?.toLowerCase());if(color)saved.sheerColor=color.id;}
  if(selection?.sheerHeading)saved.sheerHeading=selection.sheerHeading;
  if(selection?.roomType)saved.room=selection.roomType==='Office'?'Home Office':selection.roomType.replace(/\b\w/g,c=>c.toUpperCase());
  if(selection?.curtainLength)saved.curtainLength=selection.curtainLength;
  if(selection?.fullness)saved.fullness=selection.fullness;
  if(selection?.pattern)saved.pattern=selection.pattern;
  if(selection?.mainEnabled)saved.mainEnabled=selection.mainEnabled==='true';
  if(selection?.sheerEnabled)saved.sheerEnabled=selection.sheerEnabled==='true';
  return normalizeManual(saved,records);
}

export function manualSummary(value: ManualConfig, records: FabricRecord[]=fabrics): string {
 const describe=(layer:'main'|'sheer')=>{const f=fabricFor(layer==='main'?value.mainFabric:value.sheerFabric,layer,records),c=f.colors.find(c=>c.id===(layer==='main'?value.mainColor:value.sheerColor))!;return `${f.name} / ${c.name} / ${layer==='main'?value.heading:value.sheerHeading} / ${c.variantSku || c.colorCode} (${f.source})`;};
 return `Main curtain: ${value.mainEnabled?describe('main'):'Disabled'}\nSheer curtain: ${value.sheerEnabled?describe('sheer'):'Disabled'}\n${value.panels} panels / ${value.curtainLength} / ${value.fullness}x fullness / ${value.pattern} / ${value.room}\nVisual approximation; supplier samples and specifications require confirmation.`;
}
