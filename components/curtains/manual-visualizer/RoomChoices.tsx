"use client";
import { Check, ArrowRight } from 'lucide-react';
import { scenes } from '@/lib/manual-visualizer/manifest';
import StudioImage from './StudioImage';
import { useSelectionRail } from './useSelectionRail';

export default function RoomChoices({value,onChange,onNext}:{value:string;onChange:(id:string)=>void;onNext:()=>void}){
 const sample=scenes.find(scene=>scene.id==='garden-living')!;
 const rail=useSelectionRail(value);
 return <div>
  <p className="mb-4 mt-0 text-[13px] leading-6 text-muted">A room to inspire your own. Select a photograph to explore.</p>
  <div ref={rail} role="group" aria-label="Room inspirations" className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin]">
   {scenes.filter(scene=>scene.previewSupport==='base-only').map(scene=><button type="button" key={scene.id} data-scene-id={scene.id} aria-pressed={value===scene.id} onClick={()=>onChange(scene.id)} className="group w-[136px] shrink-0 snap-start border-0 bg-transparent p-0 text-left">
    <span className="relative block overflow-hidden rounded-[4px] border-2 border-solid border-transparent group-aria-pressed:border-ink">
     <StudioImage src={scene.thumbnail} alt={scene.name} className="aspect-[8/5] w-full object-cover"/>
     {value===scene.id&&<span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-paper"><Check size={12}/></span>}
    </span>
    <span className="mt-2 block min-h-9 text-[12px] leading-[1.4] group-aria-pressed:font-semibold">{scene.name}</span>
   </button>)}
  </div>
  <button type="button" data-scene-id={sample.id} aria-pressed={value===sample.id} onClick={()=>onChange(sample.id)} className="mt-3 flex w-full items-center gap-3 rounded-[4px] border border-solid border-[#dcded4] bg-paper p-2.5 text-left aria-pressed:border-ink">
   <StudioImage src={sample.base?.replace('base.webp','thumbnail.webp')} alt="Garden sample room" className="h-12 w-16 shrink-0 rounded-[2px] object-cover"/>
   <span><span className="block text-[13px] font-medium">The garden room</span><span className="mt-0.5 block text-[11px] text-muted">Explore your fabrics in our live sample</span></span>
   {value===sample.id&&<Check className="ml-auto shrink-0" size={16}/>} 
  </button>
  <button type="button" onClick={onNext} className="mt-3 flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium">Choose your sheer<ArrowRight size={14}/></button>
 </div>;
}
