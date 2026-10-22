"use client";
import { useFabricRecords } from '@/components/curtains/FabricCatalogueProvider';
import { memo, useEffect, useRef, useState } from 'react';
import { variantPhotos } from '@/lib/curtains/categories';
import { fabricFor, type ManualConfig } from '@/lib/curtains/manual-config';
const roomFiles:Record<string,string>={'Living Room':'room','Bedroom':'bedroom','Dining Room':'dining','Home Office':'office','Guest Room':'guest','Nursery':'nursery'};
const sources=new Map<string,Promise<HTMLImageElement>>();
function load(src:string){if(!sources.has(src))sources.set(src,new Promise((resolve,reject)=>{const image=new window.Image();image.onload=()=>resolve(image);image.onerror=()=>{sources.delete(src);reject(Error('Asset unavailable'));};image.src=src;}));return sources.get(src)!;}
const CurtainLayer=memo(function CurtainLayer({layer,color,panels,enabled}:{layer:'main'|'sheer';color:string;panels:string;enabled:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null),[error,setError]=useState(false);
  useEffect(()=>{let active=true;load(`/images/curtains/manual/${layer}.webp`).then(image=>{
    if(!active||!canvas.current)return;const ctx=canvas.current.getContext('2d',{willReadFrequently:true});if(!ctx){setError(true);return;}
    const w=1024,h=768;ctx.clearRect(0,0,w,h);if(layer==='main')ctx.drawImage(image,w*.05,h*.055,w*.90,h*.74);else ctx.drawImage(image,w*.04,h*.015,w*.92,h*.80);const frame=ctx.getImageData(0,0,w,h),p=frame.data,rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
    for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const x=i/4%w;
      if(panels==='Single'&&x>w/2){p[i+3]=0;continue;}
      // Use the source luminance and alpha only. No invented weave or heading map.
      const light=(p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722)/255;
      for(let c=0;c<3;c++)p[i+c]=Math.round(rgb[c]*(.12+.88*light));

    }ctx.putImageData(frame,0,0);setError(false);
  }).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[color,panels,layer]);
  return <><canvas ref={canvas} width={1024} height={768} data-layer={layer} aria-hidden="true" hidden={!enabled} className="pointer-events-none absolute inset-0 h-full w-full"/>{error&&enabled&&<p role="alert" className="absolute inset-x-4 bottom-4 bg-paper p-3 text-[12px] text-ink">{layer} layer unavailable. This combination is not rendered.</p>}</>;
});
function ReferenceRoomPreview({config}:{config:ManualConfig}){const records=useFabricRecords();const baseImage=useRef<HTMLImageElement>(null);const [baseError,setBaseError]=useState(false),[loadedRoom,setLoadedRoom]=useState('');const main=fabricFor(config.mainFabric,'main',records),sheer=fabricFor(config.sheerFabric,'sheer',records);useEffect(()=>{setBaseError(false);if(baseImage.current?.complete&&baseImage.current.naturalWidth)setLoadedRoom(config.room);},[config.room]);return <figure className="m-0 min-w-0"><div role="img" aria-label={`Approximate layered curtain study: ${config.mainEnabled?config.mainColor+' main curtains':'main disabled'}, ${config.sheerEnabled?config.sheerColor+' sheers':'sheer disabled'}`} data-testid="manual-preview" className="relative aspect-[4/3] overflow-hidden bg-sand"><img ref={baseImage} src={`/images/curtains/manual/${roomFiles[config.room]||'room'}.webp`} key={config.room} onLoad={()=>{setLoadedRoom(config.room);setBaseError(false);}} onError={()=>setBaseError(true)} alt={`${config.room} sample window without curtains`} className="absolute inset-0 h-full w-full object-cover"/><CurtainLayer layer="sheer" color={sheer.colors.find(c=>c.id===config.sheerColor)!.hexPreview || '#eeeeee'} panels={config.panels} enabled={!!sheer.colors.find(c=>c.id===config.sheerColor)?.hexPreview&&config.sheerEnabled&&!baseError&&loadedRoom===config.room}/><CurtainLayer layer="main" color={main.colors.find(c=>c.id===config.mainColor)!.hexPreview || '#eeeeee'} panels={config.panels} enabled={!!main.colors.find(c=>c.id===config.mainColor)?.hexPreview&&config.mainEnabled&&!baseError&&loadedRoom===config.room}/>{(baseError||loadedRoom!==config.room)&&<p role={baseError?'alert':'status'} className="absolute inset-x-4 bottom-4 bg-paper p-3 text-[12px] text-ink">{baseError?'Room photograph unavailable. Select another room or retry.':'Loading room photograph...'}</p>}</div><figcaption className="mt-4 text-[14px] leading-6 text-muted">Approximate room color study. Generic photographic layers preserve folds and sheer transparency; fabric, heading, pattern, length and fullness are not represented.</figcaption></figure>;}

function ShadePhotograph({src,alt,onError}:{src:string;alt:string;onError:()=>void}) {
 const [base,setBase]=useState(src),[loaded,setLoaded]=useState('');
 useEffect(()=>{if(loaded!==src)return;const timer=setTimeout(()=>setBase(src),300);return()=>clearTimeout(timer);},[loaded,src]);
 return <><img key={src} data-current-shade src={src} alt={alt} onLoad={()=>setLoaded(src)} onError={onError} className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${loaded===src?'opacity-100':'opacity-0'}`}/><img src={base} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover"/></>;
}
function SelectedFabric({config,layer}:{config:ManualConfig;layer:'main'|'sheer'}) {
 const records=useFabricRecords(),fabric=fabricFor(layer==='main'?config.mainFabric:config.sheerFabric,layer,records),id=layer==='main'?config.mainColor:config.sheerColor,shade=fabric.colors.find(c=>c.id===id),photo=variantPhotos(fabric,id).find(p=>p.mode!=='reference');
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[photo?.src]);
 return <div data-preview-layer={layer} className="flex min-w-0 flex-col"><div className="relative min-h-0 flex-1 overflow-hidden bg-[#e9e4db]">{photo&&!failed?<ShadePhotograph src={photo.src} onError={()=>setFailed(true)} alt={`${fabric.name} in ${shade?.name}${photo.mode==='digital'?', digital shade preview':''}`}/>:<div className="grid h-full min-h-40 place-items-center p-5 text-center text-[15px] leading-6 text-muted">Selected shade photograph unavailable. Request a sample.</div>}<span className="absolute left-3 top-3 z-[2] bg-paper/95 px-3 py-2 text-[12px]">{layer==='main'?'Main curtains':'Sheer curtains'}</span>{photo?.mode==='digital'&&<span className="absolute bottom-3 left-3 z-[2] bg-paper/95 px-2 py-1.5 text-[11px]">Digital preview</span>}</div><div className="bg-[#f0ede6] px-4 py-4"><p className="mb-1 text-[16px] font-medium">{fabric.name}</p><p className="m-0 text-[14px] text-muted">{shade?.name}</p></div></div>;
}
export default function ManualPreview({config,referenceStudy=false}:{config:ManualConfig;referenceStudy?:boolean}) {
 if(referenceStudy)return <ReferenceRoomPreview config={config}/>;
 return <figure className="m-0 min-w-0" data-testid="manual-preview"><div aria-label="Selected fabric and shade photographs" className={`grid h-[270px] gap-2 sm:h-[440px] lg:h-[570px] ${config.mainEnabled&&config.sheerEnabled?'grid-cols-[1.45fr_1fr]':'grid-cols-1'}`}>{config.mainEnabled&&<SelectedFabric config={config} layer="main"/>}{config.sheerEnabled&&<SelectedFabric config={config} layer="sheer"/>}{!config.mainEnabled&&!config.sheerEnabled&&<p className="grid place-items-center bg-cream p-6 text-center text-[16px]">Choose a curtain layer to see your fabrics.</p>}</div><figcaption className="mt-4 text-[14px] leading-6 text-muted">Your selected fabrics and shades. An exact curtain combination preview is not available. Confirm digital shades with a physical sample.</figcaption></figure>;
}
