"use client";
import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { demoColors, materials, type Material } from '@/lib/manual-visualizer/manifest';
import { availableMaterial, resolveLayer, type LayerSelection } from '@/lib/manual-visualizer/model';
import { visualizerFabric } from '@/lib/manual-visualizer/library';
import StudioImage from './StudioImage';
import { useSelectionRail } from './useSelectionRail';

export default function LayerChoices({layer,value,records,onChange,onNext}:{layer:'main'|'sheer';value:LayerSelection;records:FabricRecord[];onChange:(value:LayerSelection)=>void;onNext?:()=>void}){
 const [allColors,setAllColors]=useState(false);
 const rail=useSelectionRail(value.materialId);
 let current:ReturnType<typeof resolveLayer>|undefined;try{current=resolveLayer(value,records);}catch{}
 const choices=materials.filter(material=>material.layer===layer&&availableMaterial(material,records)&&(material.library||material.id===value.materialId));
 const variants=current?.fabric.colors.filter(variant=>variant.active!==false&&variant.hexPreview)||[];
 const previewMode=Boolean(value.previewColorId);
 const colors:{id:string;name:string;hex:string;image?:string;disabled?:boolean}[]=previewMode?demoColors:variants.map(variant=>({id:variant.id,name:variant.name,hex:variant.hexPreview!,image:variant.swatchImage||variant.digitalSwatchImage,disabled:variant.available===false}));
 const selectedColor=previewMode?value.previewColorId:value.variantId;
 const visible=allColors?colors:[...colors.slice(0,6),...colors.slice(6).filter(color=>color.id===selectedColor)];
 function choose(material:Material){
  const fabric=visualizerFabric(material.fabricId,records)!;
  const variant=fabric.colors.find(variant=>variant.id===value.variantId&&variant.available!==false)||fabric.colors.find(variant=>variant.id===(layer==='sheer'?'soft-ivory':'ivory')&&variant.available!==false)||fabric.colors.find(variant=>variant.available!==false)!;
  onChange({enabled:true,materialId:material.id,fabricId:fabric.id,...(material.colorMode==='tint'&&value.previewColorId?{previewColorId:value.previewColorId}:{variantId:variant.id})});
 }
 return <div>
  <fieldset className="m-0 mb-5 flex min-w-0 items-center justify-between gap-3 border-0 p-0">
   <legend className="float-left text-[13px]">{layer==='sheer'?'Add sheer curtains?':'Include main curtains?'}</legend>
   <div className="inline-flex rounded-full border border-solid border-[#d5d9ce] p-0.5">{[true,false].map(enabled=><button type="button" key={String(enabled)} aria-label={`${layer==='sheer'?'Add sheer curtains':'Include main curtains'}: ${enabled?'Yes':'No'}`} data-layer-toggle={`${layer}-${enabled?'on':'off'}`} aria-pressed={value.enabled===enabled} onClick={()=>onChange({...value,enabled})} className="min-h-10 min-w-12 rounded-full border-0 bg-transparent px-3 text-[12px] aria-pressed:bg-ink aria-pressed:text-paper">{enabled?'Yes':'No'}</button>)}</div>
  </fieldset>
  {value.enabled&&<>
   <p className="mb-2 text-[11px] uppercase tracking-[1.5px] text-muted">Fabric <span className="ml-1 normal-case tracking-normal text-ink">/ {current?.fabric.name}</span></p>
   <div ref={rail} role="group" aria-label={layer+' fabric varieties'} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin]">
    {choices.map(material=><button type="button" key={material.id} data-material-id={material.id} aria-label={material.name} aria-pressed={value.materialId===material.id} onClick={()=>choose(material)} className="group w-[100px] shrink-0 snap-start border-0 bg-transparent p-0 text-left">
     <span className="relative block overflow-hidden rounded-[4px] border-2 border-solid border-transparent group-aria-pressed:border-ink"><StudioImage src={material.thumbnail} alt={material.name+' texture'} className="aspect-[1.35] w-full object-cover"/>{value.materialId===material.id&&<Check size={14} className="absolute bottom-1 right-1 rounded-full bg-paper p-0.5"/>}</span>
     <span className="mt-2 block min-h-8 text-[11px] leading-[1.4] group-aria-pressed:font-semibold">{material.name}</span>
    </button>)}
   </div>
   {current&&<fieldset className="m-0 mt-4 min-w-0 border-0 p-0"><legend className="text-[11px] uppercase tracking-[1.5px] text-muted">Colour <span className="ml-1 normal-case tracking-normal text-ink">/ {current.shadeName}</span></legend>
    {!current.material.library&&current.material.colorMode==='tint'&&<div role="group" aria-label={layer+' shade source'} className="my-2 flex gap-4 text-[11px]"><button type="button" onClick={()=>onChange({...value,variantId:undefined,previewColorId:'preview-ivory'})} className="min-h-11 border-0 bg-transparent p-0 underline">Illustrative palette</button><button type="button" onClick={()=>onChange({...value,previewColorId:undefined,variantId:variants.find(variant=>variant.available!==false)?.id})} className="min-h-11 border-0 bg-transparent p-0 underline">{current.fabric.source==='supplier'?'Catalogue shades':'Reference shades'}</button></div>}
    <div role="group" aria-label={layer+' colours'} className="mt-3 flex flex-wrap gap-x-2 gap-y-3">{visible.map(color=><button type="button" key={color.id} title={color.name} aria-label={layer+' colour: '+color.name} aria-pressed={selectedColor===color.id} disabled={color.disabled} onClick={()=>onChange({...value,variantId:previewMode?undefined:color.id,previewColorId:previewMode?color.id:undefined})} className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-solid border-transparent bg-transparent p-1 aria-pressed:border-ink disabled:opacity-35">
     <span style={{backgroundColor:color.hex}} className="relative block h-8 w-8 overflow-hidden rounded-full border border-solid border-black/10">{color.image&&<StudioImage src={color.image} alt="" className="h-full w-full object-cover"/>}{selectedColor===color.id&&<span className="absolute inset-0 grid place-items-center"><Check size={13} className="rounded-full bg-paper/90 p-0.5 text-ink"/></span>}</span>
    </button>)}</div>
    {colors.length>6&&<button type="button" onClick={()=>setAllColors(!allColors)} className="mt-2 min-h-11 border-0 bg-transparent p-0 text-[11px] underline underline-offset-4">{allColors?'Show fewer colours':`View all colours (${colors.length})`}</button>}
   </fieldset>}
   <p className="mb-0 mt-3 text-[11px] leading-5 text-muted">{current?.commercial?'Confirm your shade with a physical sample.':'Illustrative textiles and colours. Availability confirmed with your enquiry.'}</p>
  </>}
  {onNext&&<button type="button" onClick={onNext} className="mt-3 flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium">Choose your main curtain<ArrowRight size={14}/></button>}
 </div>;
}
