"use client";
import { useRef, type PointerEvent } from "react";
import { validWindowArea, type WindowArea } from "@/lib/visualizer-area";

export default function WindowAreaSelector({src,value,onChange,disabled=false}:{src:string;value:WindowArea|null;onChange:(area:WindowArea|null)=>void;disabled?:boolean}) {
  const surface = useRef<HTMLDivElement>(null), start = useRef<{x:number;y:number}|null>(null);
  function point(event: PointerEvent) {
    const rect=surface.current!.getBoundingClientRect();
    return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};
  }
  function draw(event: PointerEvent) {
    if(!start.current||disabled)return;
    const end=point(event),begin=start.current;
    onChange({x:Math.min(begin.x,end.x),y:Math.min(begin.y,end.y),width:Math.abs(end.x-begin.x),height:Math.abs(end.y-begin.y)});
  }
  return <section aria-label="Select your window area">
    <div className="mb-4"><p className="mb-2 text-[12px] uppercase tracking-[2px] text-bronze">02 / MARK YOUR WINDOW</p><h2 className="mb-3 text-[26px] font-medium tracking-[-.6px]">Where should your curtains go?</h2><p className="mb-0 text-[15px] leading-7 text-muted">Drag a box around the window. Include space for the curtain rail, side panels and finished hem. Only this area will be edited.</p></div>
    <div ref={surface} data-testid="window-area-surface" className={`relative overflow-hidden bg-sand ${disabled?'':'touch-none cursor-crosshair'}`} onPointerDown={event=>{if(disabled||!event.isPrimary||event.button!==0)return;event.preventDefault();start.current=point(event);event.currentTarget.setPointerCapture(event.pointerId);onChange(null);}} onPointerMove={draw} onPointerUp={event=>{draw(event);start.current=null;}} onPointerCancel={()=>{start.current=null;}}>
      <img src={src} alt="Your uploaded room" draggable={false} className="block h-auto w-full select-none"/>
      {value&&<div data-testid="window-area-box" className="pointer-events-none absolute border-2 border-solid border-[#f7e2af] bg-[#25342f22] shadow-[0_0_0_9999px_#00000035]" style={{left:`${value.x*100}%`,top:`${value.y*100}%`,width:`${value.width*100}%`,height:`${value.height*100}%`}}><span className="absolute left-0 top-0 bg-ink px-2 py-1 text-[12px] text-paper">Curtain area</span></div>}
    </div>
    <p aria-live="polite" className="mb-2 mt-3 text-[14px] leading-6 text-muted">{validWindowArea(value)?'Window area selected. Draw again to change it.':'Select an area, or start with the centred box below.'}</p>
    <div className="flex flex-wrap gap-x-6"><button type="button" disabled={disabled} onClick={()=>onChange({x:.2,y:.12,width:.6,height:.78})} className="min-h-12 border-b border-solid border-ink bg-transparent px-0 text-[14px]">Use a centred window area</button><button type="button" disabled={disabled||!value} onClick={()=>onChange(null)} className="min-h-12 bg-transparent px-0 text-[14px] underline disabled:opacity-40">Clear area</button></div>
    {value&&<details className="mt-4 border-b border-solid border-[#dedbd2] pb-3"><summary className="min-h-11 cursor-pointer py-3 text-[14px]">Adjust the box precisely</summary><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['x','y','width','height'] as const).map((key,i)=><label key={key} className="text-[13px] text-muted">{['From left (%)','From top (%)','Width (%)','Height (%)'][i]}<input type="number" min={key==='width'||key==='height'?3:0} max="100" step="1" disabled={disabled} value={Math.round(value[key]*100)} onChange={event=>{const next={...value,[key]:Number(event.target.value)/100};next.width=Math.min(next.width,1-next.x);next.height=Math.min(next.height,1-next.y);if(next.x>=0&&next.y>=0&&next.width>=.03&&next.height>=.03)onChange(next);}} className="mt-2 h-12 w-full border border-solid border-[#c9c9bc] bg-paper px-3 text-[16px] text-ink"/></label>)}</div></details>}
  </section>;
}
