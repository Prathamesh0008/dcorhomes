"use client";
import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useFabricRecords } from '../FabricCatalogueProvider';
import { defaultDesign, resolveLayer } from '@/lib/manual-visualizer/model';
import { scenes } from '@/lib/manual-visualizer/manifest';
import WindowPreview from './WindowPreview';
import LayerChoices from './LayerChoices';
import RoomChoices from './RoomChoices';
import DesignReview from './DesignReview';
import StudioImage from './StudioImage';
import { useVisualizerConfiguration } from './useVisualizerConfiguration';

type Step='room'|'sheer'|'main';
function SelectionArea({id,number,title,selected,open,onToggle,children}:{id:Step;number:string;title:string;selected:string;open:boolean;onToggle:()=>void;children:ReactNode}){
 return <section className="border-b border-solid border-[#d9ddd2] last:border-b-0">
  <button type="button" id={'studio-'+id+'-tab'} data-studio-step={id} aria-expanded={open} aria-controls={'studio-'+id+'-panel'} onClick={onToggle} className="flex min-h-24 w-full items-center gap-4 border-0 bg-transparent px-0 py-5 text-left">
   <span className="self-start pt-1 text-[10px] tracking-[1px] text-bronze">{number}</span>
   <span className="min-w-0 flex-1"><span className="block font-serif text-[27px] leading-[1.1] tracking-[-.4px]">{title}</span><span className="mt-2 block truncate text-[11px] text-muted">{selected}</span></span>
   <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open?'rotate-180':''}`}/>
  </button>
  <div id={'studio-'+id+'-panel'} role="region" aria-labelledby={'studio-'+id+'-tab'} hidden={!open} className="min-w-0 pb-6">{children}</div>
 </section>;
}

export default function ManualCurtainStudio(){
 const records=useFabricRecords(),state=useVisualizerConfiguration(records);
 const {design,initialized,restoreError,originalContact,legacy}=state;
 const [step,setStep]=useState<Step|null>('room'),[renderState,setRenderState]=useState({key:'',ready:false});
 const key=JSON.stringify(design),ready=renderState.key===key&&renderState.ready&&!restoreError;
 const readiness=useCallback((value:boolean)=>setRenderState({key,ready:value}),[key]);
 const room=scenes.find(scene=>scene.id===design.sceneId)!;
 const initial=scenes.find(scene=>scene.id===defaultDesign.sceneId)!;
 function selection(layer:'main'|'sheer'){
  if(!design[layer].enabled)return layer==='sheer'?'Without sheers':'Without main curtains';
  try{const choice=resolveLayer(design[layer],records);return choice.fabric.name+' / '+choice.shadeName;}catch{return 'Find your fabric';}
 }
 const toggle=(value:Step)=>setStep(current=>current===value?null:value);
 return <div className="bg-paper pb-12 md:pb-20">
  <Container className="pb-5 pt-5 md:pb-7 md:pt-7">
   <div className="mb-3 flex items-center justify-between gap-3"><p className="m-0 text-[10px] uppercase tracking-[2.5px] text-bronze">THE CURTAIN STUDIO</p><Link href="/designs" className="inline-flex min-h-9 shrink-0 items-center gap-2 text-[11px] underline underline-offset-4">Saved designs<ArrowUpRight size={13}/></Link></div>
   <h1 className="m-0 text-[32px] font-medium leading-[1.12] tracking-[-1px] md:text-[46px]">Curtains, <em className="font-serif font-normal text-bronze">beautifully yours.</em></h1><p className="mb-0 mt-3 text-[13px] leading-6 text-muted">Find your fabric. Make it yours.</p>
  </Container>
  {legacy&&<Container className="mb-6"><details className="border-y border-solid border-[#dedbd2] py-2"><summary className="min-h-11 cursor-pointer py-3 text-[13px]">View your earlier saved preview</summary><StudioImage src={legacy.result||legacy.original} alt={'Earlier saved '+legacy.name+' design'} className="max-h-[480px] w-full object-contain"/><a download="dcorhome-saved-design.webp" href={legacy.result||legacy.original} className="inline-flex min-h-11 items-center text-[12px] underline">Download earlier preview</a></details></Container>}
  <Container className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.86fr)_minmax(330px,1fr)] lg:gap-10">
   <div className="min-w-0 lg:sticky lg:top-[108px]">
    {restoreError?<div className="rounded-[6px] bg-cream p-7"><h2 className="mt-0 font-serif text-[30px] font-normal">Let’s reopen your design.</h2><p role="alert" className="text-[13px] leading-6">{restoreError} Your previous choice has not been previewed.</p><button type="button" onClick={state.startFresh} className="min-h-12 rounded-[3px] border-0 bg-ink px-5 text-[13px] text-paper">Start a new fabric study</button></div>
     :initialized?<WindowPreview design={design} records={records} onReady={readiness} onSelectSample={()=>state.selectRoom('garden-living')}/>
     :<div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-cream" role="status" aria-label="Opening the curtain studio"><StudioImage src={initial.base} alt="Garden sample room" priority className="h-full w-full object-contain"/></div>}
    {initialized&&!restoreError&&<div className="mt-4 hidden flex-wrap items-center justify-between gap-3 border-t border-solid border-[#dedfd5] pt-4 lg:flex"><p className="m-0 max-w-md text-[12px] leading-6 text-muted">Prefer to feel the fabric first? Request samples with your enquiry.</p><a href="mailto:sales@dcorhome.com" className="inline-flex min-h-11 items-center gap-2 text-[12px]">Talk to the atelier<ArrowUpRight size={14}/></a></div>}
   </div>
   <aside aria-label="Create your curtain design" className="min-w-0 rounded-[6px] bg-cream px-5 pb-6 pt-1 sm:px-6 lg:px-6 xl:px-7">
    {initialized?<>
     <SelectionArea id="room" number="01" title="Where shall we begin?" selected={room.name} open={step==='room'} onToggle={()=>toggle('room')}><RoomChoices value={design.sceneId} onChange={state.selectRoom} onNext={()=>setStep('sheer')}/></SelectionArea>
     <SelectionArea id="sheer" number="02" title="Let the light in." selected={selection('sheer')} open={step==='sheer'} onToggle={()=>toggle('sheer')}><LayerChoices layer="sheer" value={design.sheer} records={records} onChange={value=>state.selectLayer('sheer',value)} onNext={()=>setStep('main')}/></SelectionArea>
     <SelectionArea id="main" number="03" title="Add the finishing touch." selected={selection('main')} open={step==='main'} onToggle={()=>toggle('main')}><LayerChoices layer="main" value={design.main} records={records} onChange={value=>state.selectLayer('main',value)}/></SelectionArea>
     <DesignReview design={design} records={records} ready={ready} blocked={Boolean(restoreError)} originalContact={originalContact}/>
    </>:<div className="py-6 text-[13px] text-muted" role="status">Opening your fabric collection...</div>}
   </aside>
  </Container>
 </div>;
}
