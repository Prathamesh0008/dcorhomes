"use client";
import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { demoColors, materials, type Material } from '@/lib/manual-visualizer/manifest';
import { availableMaterial, matchingMaterialShade, materialShades, resolveLayer, resolveLayerMaterial, type LayerSelection, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { visualizerFabric } from '@/lib/manual-visualizer/library';
import { recommendedSheerColors, studioSheerShadeNames } from '@/lib/manual-visualizer/sheer-shades';
import StudioImage from './StudioImage';
import { useSelectionRail } from './useSelectionRail';

type SheerColorMode=VisualizerDesign['sheerColorMode'];

export default function LayerChoices({layer,value,records,onChange,onNext,mainShade,sheerColorMode}:{layer:'main'|'sheer';value:LayerSelection;records:FabricRecord[];onChange:(value:LayerSelection,mode?:SheerColorMode)=>void;onNext?:()=>void;mainShade?:string;sheerColorMode?:SheerColorMode}){
 const [allColors,setAllColors]=useState(false);
 const rail=useSelectionRail(value.materialId??'',value.enabled);
 let current:ReturnType<typeof resolveLayer>|undefined;try{current=resolveLayer(value,records);}catch{}
 let selected:ReturnType<typeof resolveLayerMaterial>|undefined=current;
 if(!selected&&layer==='main'&&value.materialId){
  try{selected=resolveLayerMaterial(value,records);}catch{}
 }
 const choices=materials.filter(material=>material.layer===layer&&availableMaterial(material,records)&&(layer==='sheer'||material.library||material.id===value.materialId)).map(material=>{
  const fabric=visualizerFabric(material.fabricId,records)!;
  const shades=materialShades(material,fabric);
  const shade=matchingMaterialShade(shades,current?.variant?.id,current?.shadeName);
  return {material,fabric,shades,shade,thumbnail:material.patternTexture||shade?.textureImage||shade?.swatchImage||shade?.digitalSwatchImage||material.thumbnail||material.texture};
 });
 if(layer==='sheer'){
  const order=({material}:typeof choices[number])=>material.id==='library-sheer-plain-voile'?0:material.patternTexture?1:2;
  choices.sort((a,b)=>order(a)-order(b));
 }
 const variants=selected?materialShades(selected.material,selected.fabric):[];
 const previewMode=Boolean(value.previewColorId);
 const colors:{id:string;name:string;hex?:string;image?:string;disabled?:boolean}[]=previewMode?demoColors:variants.map(variant=>({id:variant.id,name:variant.name,hex:variant.hexPreview,image:layer==='sheer'&&variant.hexPreview?undefined:variant.swatchImage||variant.digitalSwatchImage||variant.textureImage,disabled:variant.available===false}));
 const selectedColor=previewMode?value.previewColorId:value.variantId;
 const recommended=layer==='sheer'?recommendedSheerColors(colors,mainShade):[];
 const sheerPalette=layer==='sheer'?Object.keys(studioSheerShadeNames).flatMap(id=>colors.filter(color=>color.id===id)):[];
 const featured=[...new Set([...recommended,...sheerPalette])];
 const ordered=[...new Set([...featured,...colors])];
 const featuredCount=Math.max(6,featured.length);
 const visible=allColors?ordered:[...ordered.slice(0,featuredCount),...ordered.slice(featuredCount).filter(color=>color.id===selectedColor)];
 const swatchMode=layer==='sheer'?'manual':undefined;
 function choose({material,fabric,shades,shade}:typeof choices[number]){
  if(layer==='main'){
   onChange({enabled:true,materialId:material.id,fabricId:fabric.id,...(material.colorMode==='tint'&&value.previewColorId?{previewColorId:value.previewColorId}:{variantId:shade?.id??null})});
   return;
  }
  const variant=shade||recommendedSheerColors(shades,mainShade)[0]||matchingMaterialShade(shades,'soft-ivory')||shades.find(variant=>variant.available!==false);
  if(!variant)return;
  onChange({enabled:true,materialId:material.id,fabricId:fabric.id,...(material.colorMode==='tint'&&value.previewColorId?{previewColorId:value.previewColorId}:{variantId:variant.id})});
 }
 return <div>
  <fieldset className="m-0 mb-5 flex min-w-0 items-center justify-between gap-3 border-0 p-0">
   <legend className="float-left text-[13px]">{layer==='sheer'?'Add sheer curtains?':'Include main curtains?'}</legend>
   <div className="inline-flex rounded-full border border-solid border-[#d5d9ce] p-0.5">{[true,false].map(enabled=><button type="button" key={String(enabled)} aria-label={`${layer==='sheer'?'Add sheer curtains':'Include main curtains'}: ${enabled?'Yes':'No'}`} data-layer-toggle={`${layer}-${enabled?'on':'off'}`} aria-pressed={value.enabled===enabled} onClick={()=>onChange({...value,enabled})} className="min-h-10 min-w-12 rounded-full border-0 bg-transparent px-3 text-[12px] aria-pressed:bg-ink aria-pressed:text-paper">{enabled?'Yes':'No'}</button>)}</div>
  </fieldset>
  {value.enabled&&<>
   <p className="mb-2 text-[11px] uppercase tracking-[1.5px] text-muted">Fabric <span className="ml-1 normal-case tracking-normal text-ink">/ {selected?.fabric.name}</span></p>
   <div ref={rail} role="group" aria-label={layer+' fabric varieties'} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin]">
    {choices.map(choice=>{const {material,thumbnail,shade}=choice;return <button type="button" key={material.id} data-material-id={material.id} aria-label={material.name} aria-pressed={value.materialId===material.id} onClick={()=>choose(choice)} className="group w-[100px] shrink-0 snap-start border-0 bg-transparent p-0 text-left">
     <span style={material.patternTexture?{backgroundColor:shade?.hexPreview||'#f9f5ec'}:undefined} className="relative block overflow-hidden rounded-[4px] border-2 border-solid border-transparent group-aria-pressed:border-ink"><StudioImage key={thumbnail} src={thumbnail} alt={material.name+' texture'} className="aspect-[1.35] w-full object-cover"/>{value.materialId===material.id&&<Check size={14} className="absolute bottom-1 right-1 rounded-full bg-paper p-0.5"/>}</span>
     <span className="mt-2 block min-h-8 text-[11px] leading-[1.4] group-aria-pressed:font-semibold">{material.name}</span>
    </button>;})}
   </div>
   {selected&&<fieldset className="m-0 mt-4 min-w-0 border-0 p-0"><legend className="text-[11px] uppercase tracking-[1.5px] text-muted">Colour <span className="ml-1 normal-case tracking-normal text-ink">/ {current?.shadeName}</span></legend>
    {!selected.material.library&&selected.material.colorMode==='tint'&&<div role="group" aria-label={layer+' shade source'} className="my-2 flex gap-4 text-[11px]"><button type="button" onClick={()=>onChange({...value,variantId:undefined,previewColorId:'preview-ivory'},swatchMode)} className="min-h-11 border-0 bg-transparent p-0 underline">Illustrative palette</button><button type="button" onClick={()=>onChange({...value,previewColorId:undefined,variantId:variants.find(variant=>variant.available!==false)?.id},swatchMode)} className="min-h-11 border-0 bg-transparent p-0 underline">{selected.fabric.source==='supplier'?'Catalogue shades':'Reference shades'}</button></div>}
    {layer==='sheer'&&<button type="button" aria-pressed={sheerColorMode==='auto'} onClick={()=>onChange(value,sheerColorMode==='auto'?'manual':'auto')} className="mt-2 min-h-11 rounded-full border border-solid border-[#d5d9ce] bg-transparent px-3 text-[12px] aria-pressed:bg-ink aria-pressed:text-paper">Match main curtain</button>}
    <div role="group" aria-label={layer+' colours'} className="mt-3 flex flex-wrap gap-x-2 gap-y-3">{visible.map(color=><button type="button" key={color.id} title={recommended.includes(color)?color.name+' · Suggested for '+mainShade:color.name} aria-label={layer+' colour: '+color.name} aria-pressed={selectedColor===color.id} disabled={color.disabled} onClick={()=>onChange({...value,variantId:previewMode?undefined:color.id,previewColorId:previewMode?color.id:undefined},swatchMode)} className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-solid border-transparent bg-transparent p-1 aria-pressed:border-ink disabled:opacity-35">
     <span style={{backgroundColor:color.hex}} className="relative block h-8 w-8 overflow-hidden rounded-full border border-solid border-black/10">{color.image&&<StudioImage src={color.image} alt="" className="h-full w-full object-cover"/>}{selectedColor===color.id&&<span className="absolute inset-0 grid place-items-center"><Check size={13} className="rounded-full bg-paper/90 p-0.5 text-ink"/></span>}</span>
    </button>)}</div>
    {colors.length>featuredCount&&<button type="button" onClick={()=>setAllColors(!allColors)} className="mt-2 min-h-11 border-0 bg-transparent p-0 text-[11px] underline underline-offset-4">{allColors?'Show fewer colours':`View all colours (${colors.length})`}</button>}
   </fieldset>}
   <p className="mb-0 mt-3 text-[11px] leading-5 text-muted">{current?.commercial?'Confirm your shade with a physical sample.':'Illustrative textiles and colours. Availability confirmed with your enquiry.'}</p>
  </>}
  {onNext&&<button type="button" onClick={onNext} className="mt-3 flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium">Choose your main curtain<ArrowRight size={14}/></button>}
 </div>;
}
