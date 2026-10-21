import type { DesignSelection } from '@/lib/design-options';
import { demoFabrics } from './demo-catalogue';
import supplierData from './supplier-catalogue.json';
import type { FabricRecord } from './catalogue';
export const fabrics: FabricRecord[] = supplierData.length ? supplierData as FabricRecord[] : demoFabrics;
export type ManualConfig = { mainFabric: string; mainColor: string; sheerFabric: string; sheerColor: string; mainEnabled: boolean; sheerEnabled: boolean; heading: string; sheerHeading: string; pattern: string; room: string };
export const manualDefault: ManualConfig={ mainFabric:'sienna',mainColor:'Warm Ivory',sheerFabric:'solstice',sheerColor:'Soft Ivory',mainEnabled:true,sheerEnabled:true,heading:'Wave Pleat',sheerHeading:'Wave Pleat',pattern:'Solid',room:'Living Room' };
export const storageKey='dcorhome-manual-v1';
export function fabricFor(id: string, layer:'main'|'sheer') {return fabrics.find(f=>f.id===id&&f.usage.includes(layer)) || fabrics.find(f=>f.usage.includes(layer))!;}
export function normalizeManual(raw: Partial<ManualConfig>): ManualConfig {
  const value={...manualDefault,...raw},main=fabricFor(value.mainFabric,'main'),sheer=fabricFor(value.sheerFabric,'sheer');
  return {...value,mainFabric:main.id,sheerFabric:sheer.id,mainColor:main.colors.some(c=>c.id===value.mainColor&&c.available!==false)?value.mainColor:main.colors.find(c=>c.available!==false)!.id,sheerColor:sheer.colors.some(c=>c.id===value.sheerColor&&c.available!==false)?value.sheerColor:sheer.colors.find(c=>c.available!==false)!.id,heading:main.compatibleHeadingStyles.includes(value.heading)?value.heading:main.compatibleHeadingStyles[0],sheerHeading:sheer.compatibleHeadingStyles.includes(value.sheerHeading)?value.sheerHeading:sheer.compatibleHeadingStyles[0],pattern:(main.category==='Velvet'||main.category==='Blackout'?['Solid']:['Solid','Textured','Striped']).includes(value.pattern)?value.pattern:'Solid',room:['Living Room','Bedroom','Dining Room','Home Office','Guest Room','Nursery'].includes(value.room)?value.room:'Living Room',mainEnabled:typeof value.mainEnabled==='boolean'?value.mainEnabled:true,sheerEnabled:typeof value.sheerEnabled==='boolean'?value.sheerEnabled:true};
}
export function manualSelection(value: ManualConfig): Partial<DesignSelection> {
  const main=fabricFor(value.mainFabric,'main'),sheer=fabricFor(value.sheerFabric,'sheer');
  return {fabric:main.id,configuratorFabric:main.name,configuratorStyle:value.heading,heading:value.heading,color:main.colors.find(c=>c.id===value.mainColor)!.hexPreview,sheerColor:sheer.colors.find(c=>c.id===value.sheerColor)!.hexPreview,sheerFabric:sheer.id,sheerHeading:value.sheerHeading,mainEnabled:String(value.mainEnabled),sheerEnabled:String(value.sheerEnabled),manual:JSON.stringify(value),layers:value.sheerEnabled&&value.mainEnabled?'Layered sheer and drape':'Single curtain',pattern:value.pattern,roomType:value.room==='Home Office'?'Office':value.room.charAt(0)+value.room.slice(1).toLowerCase()};
}
export function readManual(selection?: Partial<DesignSelection>): ManualConfig {
  if(selection?.manual)try{return normalizeManual(JSON.parse(selection.manual));}catch{}
  let saved:Partial<ManualConfig>={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
  if(selection?.fabric){const f=fabricFor(selection.fabric,'main');saved.mainFabric=f.id;const color=f.colors.find(c=>c.hexPreview.toLowerCase()===selection.color?.toLowerCase());if(color)saved.mainColor=color.id;if(selection.heading)saved.heading=selection.heading;}
  if(selection?.sheerFabric)saved.sheerFabric=selection.sheerFabric;
  if(selection?.sheerColor){const sheer=fabricFor(saved.sheerFabric||manualDefault.sheerFabric,'sheer'),color=sheer.colors.find(c=>c.hexPreview.toLowerCase()===selection.sheerColor?.toLowerCase());if(color)saved.sheerColor=color.id;}
  if(selection?.sheerHeading)saved.sheerHeading=selection.sheerHeading;
  if(selection?.roomType)saved.room=selection.roomType==='Office'?'Home Office':selection.roomType.replace(/\b\w/g,c=>c.toUpperCase());
  if(selection?.pattern)saved.pattern=selection.pattern;
  if(selection?.mainEnabled)saved.mainEnabled=selection.mainEnabled==='true';
  if(selection?.sheerEnabled)saved.sheerEnabled=selection.sheerEnabled==='true';
  return normalizeManual(saved);
}
