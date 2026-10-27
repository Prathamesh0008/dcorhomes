"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteLocalDesign, localDesigns } from '@/lib/local-designs';
import { useFabricRecords } from '../FabricCatalogueProvider';
import { scenes } from '@/lib/manual-visualizer/manifest';
import { enquiryHref, resolveLayer, validateDesign, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { exportDesign } from '@/lib/manual-visualizer/renderer';
type Saved={id:string;created:number;design:VisualizerDesign;local:boolean};
export default function ManualSavedDesigns({onCount}:{onCount:(count:number)=>void}){
 const records=useFabricRecords(),[saved,setSaved]=useState<Saved[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{const changed=()=>setRevision(value=>value+1);window.addEventListener('dcorhome-designs-changed',changed);return()=>window.removeEventListener('dcorhome-designs-changed',changed);},[]);
 useEffect(()=>{let active=true;(async()=>{const items:Saved[]=[];const errors:string[]=[];
  try{items.push(...(await localDesigns()).filter(item=>item.visualizer).map(item=>({id:item.id,created:item.created,design:item.visualizer!,local:true})));}catch{errors.push('On-device designs could not be read.');}
  if(active){setSaved(items);onCount(items.length);setMessage(errors.join(' '));}
 })();return()=>{active=false;};},[onCount,revision]);
 async function perform(task:()=>Promise<void>){setBusy(true);setMessage('');try{await task();}catch(error){setMessage(error instanceof Error?error.message:'Could not complete this action.');}finally{setBusy(false);}}
 return <section aria-label="Saved manual curtain designs" className="mb-8"><p role="status" className="text-[13px] text-muted">{message}</p>{saved.length>0&&<><h2 className="text-[25px] font-medium">Your manual curtain designs</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{saved.map(item=>{
  const scene=scenes.find(s=>s.id===item.design.sceneId);let summary='',href='/contact';
  try{validateDesign(item.design,records);summary=(['sheer','main'] as const).map(key=>{const layer=resolveLayer(item.design[key],records);return item.design[key].enabled?layer.fabric.name+' / '+layer.shadeName:'No '+key;}).join(' · ');href=enquiryHref(item.design,records);}catch{summary='Some original assets or catalogue shades are no longer available.';}
  return <article key={(item.local?'local:':'account:')+item.id} className="min-w-0 border-b border-solid border-[#dedbd2] pb-5"><Link href={'/studio?'+(item.local?'local=':'saved=')+encodeURIComponent(item.id)}><img src={scene?.base} alt="Window reference for this saved curtain configuration" loading="lazy" className="aspect-[4/3] w-full object-cover"/><h3 className="mb-2 mt-3 text-[16px] font-medium">{scene?.name||'Saved window'}</h3></Link><p className="text-[12px] leading-6 text-muted">{summary}</p><p className="text-[11px] text-muted">{item.local?'On this device':'In your account'} · {new Date(item.created).toLocaleDateString('en-IN')}<br/>Window reference shown; reopen to reconstruct your curtains.</p><div className="flex flex-wrap gap-x-4 text-[12px]"><Link href={'/studio?'+(item.local?'local=':'saved=')+encodeURIComponent(item.id)} className="inline-flex min-h-11 items-center underline">Reopen</Link><button disabled={busy} className="min-h-11 bg-transparent underline disabled:opacity-40" onClick={()=>perform(async()=>{const blob=await exportDesign(item.design,records),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='dcorhome-saved-curtains.png';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),10000);})}>Download</button><Link href={href} className="inline-flex min-h-11 items-center underline">Enquire</Link><button disabled={busy} className="min-h-11 bg-transparent underline disabled:opacity-40" onClick={()=>{if(!confirm('Delete this saved curtain design?'))return;void perform(async()=>{await deleteLocalDesign(item.id);const next=saved.filter(other=>other!==item);setSaved(next);onCount(next.length);});}}>Delete</button></div></article>;
 })}</div></>}</section>;
}
