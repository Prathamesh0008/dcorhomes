"use client";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes } from '@/lib/manual-visualizer/manifest';
import type { VisualizerDesign } from '@/lib/manual-visualizer/model';
import { renderCapability } from '@/lib/manual-visualizer/types';
import { previewDesign } from '@/lib/manual-visualizer/renderer';
import StudioImage from './StudioImage';

export default function WindowPreview({design,records,onReady,onSelectSample}:{design:VisualizerDesign;records:FabricRecord[];onReady:(ready:boolean)=>void;onSelectSample:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null);
 const [after,setAfter]=useState(true),[width,setWidth]=useState(0),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [frame,setFrame]=useState({key:'',width:0,complete:false}),[imageError,setImageError]=useState('');
 const scene=scenes.find(scene=>scene.id===design.sceneId)!,capability=renderCapability(scene);
 const key=JSON.stringify(design),presented=frame.key===key&&frame.width===width;
 const ready=presented&&frame.complete&&!error&&imageError!==scene.base;
 const live=capability.mode==='live-study';
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const measure=()=>setWidth(Math.min(1280,Math.max(640,Math.round((host.current?.clientWidth||800)*Math.min(devicePixelRatio||1,1.5)))));
  measure();const observer=new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(measure,80);});
  if(host.current)observer.observe(host.current);
  return()=>{observer.disconnect();clearTimeout(timer);};
 },[]);
 useLayoutEffect(()=>{
  const controller=new AbortController();setError('');
  if(!live||!width||imageError===scene.base)return()=>controller.abort();
  const present=(result:HTMLCanvasElement,complete:boolean)=>{
   try{
    const target=canvas.current;
    if(controller.signal.aborted||!target)return;
    const context=target.getContext('2d');
    if(!context)throw Error('The curtain preview is unavailable in this browser.');
    if(target.width!==result.width)target.width=result.width;
    if(target.height!==result.height)target.height=result.height;
    context.clearRect(0,0,target.width,target.height);
    context.drawImage(result,0,0);
    setFrame({key,width,complete});onReady(complete);
   }finally{result.width=0;}
  };
  const fail=(reason:unknown)=>{
   if(controller.signal.aborted)return;
   setError(reason instanceof Error?reason.message:'Your selected fabrics could not be shown.');onReady(false);
  };
  try{
   const {frame:cached,pending}=previewDesign(design,records,width,controller.signal);
   if(cached)present(cached,!pending);
   else{setFrame({key:'',width:0,complete:false});onReady(false);}
   void pending?.then(result=>present(result,true)).catch(fail);
  }catch(reason){fail(reason);}
  return()=>controller.abort();
 },[key,records,width,retry,imageError,onReady,live]);
 const roomNotice=scene.provisional
  ? 'This room is for inspiration. Curtains already in the image are not your selected fabrics.'
  : 'A curtain preview is not available in this room yet. Your fabric choices are kept for your enquiry.';
 return <figure className="m-0 min-w-0" data-testid="manual-window-preview" data-render-state={imageError===scene.base||error?'error':!live?'room-only':ready?'ready':'loading'}>
  <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-3">
   <figcaption className="text-[13px] font-medium">{scene.name}</figcaption>
   {live&&<div role="group" aria-label="Compare your curtains" className="inline-flex rounded-full bg-[#eeeee6] p-1">{[false,true].map(value=><button type="button" key={String(value)} aria-pressed={after===value} onClick={()=>setAfter(value)} className="min-h-9 min-w-20 rounded-full border-0 bg-transparent px-4 text-[11px] transition-colors aria-pressed:bg-paper aria-pressed:shadow-sm">{value?'After':'Before'}</button>)}</div>}
  </div>
  <div ref={host} style={{aspectRatio:`${scene.width}/${scene.height}`}} aria-busy={live&&!ready&&!error} className="relative overflow-hidden rounded-[6px] bg-[#eeeae2] shadow-[0_12px_45px_-24px_#25342f35]">
   <StudioImage src={scene.base} alt={scene.name+' room reference'} priority onError={()=>{setImageError(scene.base||'missing');onReady(false);}} className="absolute inset-0 h-full w-full object-contain"/>
   <canvas ref={canvas} data-testid="composed-curtains" aria-label="Your selected curtain composition" role="img" className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-150 motion-reduce:transition-none" style={{opacity:after?1:0,visibility:live&&!error&&imageError!==scene.base&&presented?'visible':'hidden'}}/>
   {live&&!ready&&!error&&imageError!==scene.base&&<span role="status" className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-paper/95 px-3 py-2 text-[11px]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink motion-reduce:animate-none"/>Updating your fabrics</span>}
  </div>
  {!live?<div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-[12px] leading-6 text-muted"><p className="m-0 max-w-md">{roomNotice}</p><button type="button" onClick={onSelectSample} className="inline-flex min-h-11 shrink-0 items-center gap-2 border-0 bg-transparent p-0 text-[12px] text-ink underline underline-offset-4">See my fabrics in the garden sample<ArrowUpRight size={14}/></button></div>
   :error?<div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] leading-6"><p className="m-0">{error} Your selection has not been shown.</p><button type="button" onClick={()=>setRetry(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 underline">Try again<RotateCcw size={13}/></button></div>
   :<p className="mb-0 mt-4 text-[11px] leading-6 text-muted">An illustrative fabric study in our garden room. Confirm colour and drape with a physical sample.</p>}
 </figure>;
}
