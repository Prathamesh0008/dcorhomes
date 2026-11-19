"use client";
import { Check, ArrowRight } from 'lucide-react';
import { studioPhotoScenes } from '@/lib/manual-visualizer/manifest';
import StudioImage from './StudioImage';
import { useSelectionRail } from './useSelectionRail';

export default function RoomChoices({value,onChange,onNext}:{value:string;onChange:(id:string)=>void;onNext:()=>void}){
 const rail=useSelectionRail(value,true,'auto');
 return <div>
  <p className="mb-4 mt-0 text-[13px] leading-6 text-muted">A room to inspire your own. Select a photograph to explore.</p>
  <div ref={rail} role="group" aria-label="Room inspirations" className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [scrollbar-width:thin] motion-reduce:scroll-auto">
   {studioPhotoScenes.map(scene=><button type="button" key={scene.id} data-scene-id={scene.id} aria-pressed={value===scene.id} onClick={()=>onChange(scene.id)} className="group w-[136px] shrink-0 snap-start border-0 bg-transparent p-0 text-left">
    <span className="relative block aspect-[4/3] overflow-hidden rounded-[6px] border-2 border-solid border-transparent group-aria-pressed:border-ink">
     <StudioImage src={scene.thumbnail} alt={scene.name} className="block h-full w-full object-cover"/>
     {value===scene.id&&<span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-paper"><Check size={12}/></span>}
    </span>
    <span className="mt-2 block min-h-9 text-[12px] leading-[1.4] group-aria-pressed:font-semibold">{scene.name}</span>
   </button>)}
  </div>
  <button type="button" onClick={onNext} className="mt-3 flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium">Choose your sheer<ArrowRight size={14}/></button>
 </div>;
}
