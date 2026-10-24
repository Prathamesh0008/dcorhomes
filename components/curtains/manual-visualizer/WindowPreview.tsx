"use client";
import { useEffect, useRef, useState } from 'react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes } from '@/lib/manual-visualizer/manifest';
import type { VisualizerDesign } from '@/lib/manual-visualizer/model';
import { composeDesign } from '@/lib/manual-visualizer/renderer';

export default function WindowPreview({design,records,onReady}:{design:VisualizerDesign;records:FabricRecord[];onReady:(ready:boolean)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),sequence=useRef(0),dragging=useRef(false);
 const [comparison,setComparison]=useState(100),[error,setError]=useState(''),[ready,setReady]=useState(false),[frameScene,setFrameScene]=useState('');
 const scene=scenes.find(s=>s.id===design.sceneId)!;
 useEffect(()=>{
  const token=++sequence.current;let cancelled=false;setError('');setReady(false);onReady(false);
  const width=Math.min(1200,Math.max(640,Math.round((host.current?.clientWidth||800)*Math.min(window.devicePixelRatio||1,1.5))));
  composeDesign(design,records,width).then(result=>{
   if(cancelled||token!==sequence.current||!canvas.current)return;
   const context=canvas.current.getContext('2d');if(!context)throw Error('Preview unavailable in this browser.');
   canvas.current.width=result.width;canvas.current.height=result.height;context.drawImage(result,0,0);setFrameScene(scene.id);setReady(true);onReady(true);
  }).catch(reason=>{if(!cancelled){setError(reason instanceof Error?reason.message:'Unable to display this design.');onReady(false);}});
  return()=>{cancelled=true;};
 },[design,records,onReady]);
 return <figure className="m-0 min-w-0" data-testid="manual-window-preview">
  <div className="mb-3 flex items-center justify-between gap-3"><p className="m-0 text-[13px] text-muted">{scene.name}</p><div className="flex gap-1" role="group" aria-label="Compare your curtains">{[[0,'Before'],[100,'After']] .map(([value,label])=><button key={label} type="button" aria-pressed={comparison===value} onClick={()=>setComparison(Number(value))} className="min-h-11 border border-solid border-[#d4d4c9] bg-transparent px-4 text-[12px] aria-pressed:bg-ink aria-pressed:text-paper">{label}</button>)}</div></div>
  <div ref={host} className="relative aspect-[4/3] cursor-ew-resize touch-pan-y overflow-hidden bg-[#e9e4db]" aria-busy={!ready&&!error} onPointerDown={event=>{if(!ready)return;dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);const rect=event.currentTarget.getBoundingClientRect();setComparison(Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)));}} onPointerMove={event=>{if(!dragging.current)return;const rect=event.currentTarget.getBoundingClientRect();setComparison(Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)));}} onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}}>
   <img src={scene.base} alt="Illustrative garden window without curtains" className="absolute inset-0 h-full w-full object-cover"/>
   <canvas ref={canvas} data-testid="composed-curtains" aria-label="Your selected curtain fabrics and colours on the sample window" role="img" className="absolute inset-0 h-full w-full" style={{clipPath:`inset(0 ${100-comparison}% 0 0)`,visibility:!error&&(ready||frameScene===scene.id)?'visible':'hidden'}}/>
   {ready&&comparison>0&&comparison<100&&<span aria-hidden="true" style={{left:comparison+'%'}} className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-md"/>}
   {error&&<p role="alert" className="absolute inset-x-4 bottom-4 m-0 bg-paper p-4 text-[14px] leading-6 text-ink">{error} This combination has not been rendered.</p>}
   {!ready&&!error&&!frameScene&&<p role="status" className="absolute bottom-3 left-3 m-0 bg-paper/95 px-3 py-2 text-[12px]">Preparing your selected fabrics…</p>}
  </div>
  <label className="mt-2 flex min-h-11 items-center gap-3 text-[12px] text-muted"><span>Before</span><input type="range" aria-label="Before and after comparison" min="0" max="100" value={comparison} onChange={e=>setComparison(Number(e.target.value))} className="min-h-11 min-w-0 flex-1 cursor-ew-resize accent-ink"/><span>After</span></label>
  <figcaption className="mt-2 text-[12px] leading-5 text-muted">Illustrative sample window · digital fabric and colour study. Confirm the final shade and drape with a physical sample.</figcaption>
 </figure>;
}
