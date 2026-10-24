"use client";
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { useFabricRecords } from '../FabricCatalogueProvider';
import { localDesigns, saveLocalDesign } from '@/lib/local-designs';
import { defaultSelection } from '@/lib/design-options';
import { manualSummary, readManual } from '@/lib/curtains/manual-config';
import { assetVersion, scenes } from '@/lib/manual-visualizer/manifest';
import { defaultDesign, enquiryHref, fromManual, resolveLayer, validateDesign, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { exportDesign } from '@/lib/manual-visualizer/renderer';
import WindowPreview from './WindowPreview';
import LayerChoices from './LayerChoices';

const storageKey='dcorhome-visualizer-v1';
const action='flex min-h-12 items-center justify-center border border-solid border-ink bg-transparent px-5 text-center text-[14px] disabled:cursor-wait disabled:opacity-40';
export default function ManualCurtainStudio(){
 const records=useFabricRecords(),query=useSearchParams();
 const [design,setDesign]=useState<VisualizerDesign>(()=>structuredClone(defaultDesign)),[initialized,setInitialized]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[account,setAccount]=useState<boolean|null>(null);
 const [legacy,setLegacy]=useState<{original:string;result?:string;name:string}|null>(null),[restoreError,setRestoreError]=useState(''),[originalContact,setOriginalContact]=useState('');
 const readiness=useCallback((value:boolean)=>setReady(value),[]);
 useEffect(()=>{
  let active=true;const urls:string[]=[];setInitialized(false);setMessage('');setRestoreError('');setOriginalContact('');setLegacy(null);
  (async()=>{try{
   let restored:unknown;
   if(query.get('local')){
    const saved=(await localDesigns()).find(item=>item.id===query.get('local'));if(!saved)throw Error('This design is no longer saved on this device.');
    if(saved.visualizer)restored=saved.visualizer;
    else if(saved.original){const original=URL.createObjectURL(saved.original),result=saved.result?URL.createObjectURL(saved.result):undefined;urls.push(original,...(result?[result]:[]));if(active)setLegacy({original,result,name:saved.selection.fabric});}
   }else if(query.get('saved')){
    const response=await fetch('/api/manual-designs');if(!response.ok)throw Error('Could not reopen your account design.');const data=await response.json();const saved=data.designs.find((item:{id:string})=>item.id===query.get('saved'));if(!saved)throw Error('This design is unavailable in your current account.');restored=saved.design;
   }else if(query.get('design')){
    const response=await fetch('/api/designs/'+encodeURIComponent(query.get('design')!));if(!response.ok)throw Error('This private saved preview is unavailable.');const data=await response.json();if(active)setLegacy({original:'/api/designs/'+data.id+'/image?type=original',result:'/api/designs/'+data.id+'/image',name:data.selection.fabric});
   }else if(query.get('visualizer'))restored=JSON.parse(query.get('visualizer')!);
   else if(query.get('manual')||query.get('fabric')){
    const config=readManual(Object.fromEntries(query.entries()),records);
    const inspiration={style:(query.get('style')||'').slice(0,100),pattern:(query.get('inspirationPattern')||config.pattern).slice(0,100),room:config.room};
    if(active)setOriginalContact('/contact?'+new URLSearchParams({interest:'Curtain design consultation',message:[manualSummary(config,records),'Consultation inspiration: '+[inspiration.style,inspiration.pattern,inspiration.room].filter(Boolean).join(' / ')].join('\n')}).toString());
    restored=fromManual(config,records,inspiration);
   }else {const saved=localStorage.getItem(storageKey);if(saved)restored=JSON.parse(saved);}
   if(active)setDesign(restored?validateDesign(restored,records):structuredClone(defaultDesign));
  }catch(error){if(active){setReady(false);setRestoreError(error instanceof Error?error.message:'Could not restore this design.');}}finally{if(active)setInitialized(true);}})();
  return()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
 },[query,records]);
 useEffect(()=>{if(!initialized||restoreError)return;try{validateDesign(design,records);localStorage.setItem(storageKey,JSON.stringify(design));}catch{/* Saving remains explicit when browser preferences are disabled. */}},[design,initialized,restoreError,records]);
 function change(next:VisualizerDesign){setReady(false);setRestoreError('');setOriginalContact('');setDesign(next);setMessage('');}
 async function perform(task:()=>Promise<void>){setBusy(true);setMessage('');try{await task();}catch(error){setMessage(error instanceof Error?error.message:'Unable to complete this action.');}finally{setBusy(false);}}
 async function download(){const blob=await exportDesign(design,records),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='dcorhome-curtains-'+design.sceneId+'.png';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),10000);setMessage('Your composed curtain design has been downloaded.');}
 async function save(){
  const clean=validateDesign(design,records);let response:Response;
  try{response=await fetch('/api/manual-designs');if(!response.ok)throw Error('Account storage is unavailable. Use Save on this device.');}catch{throw Error('Could not check account storage. Use Save on this device.');}
  const state=await response.json();setAccount(state.account===true);
  if(state.account){const saved=await fetch('/api/manual-designs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({design:clean})});const data=await saved.json();if(!saved.ok)throw Error(data.error||'Could not save to your account.');setMessage('Saved to your account. Reopen it from Saved designs.');}
  else await saveDevice(clean);
 }
 async function saveDevice(clean=validateDesign(design,records)){
  const main=resolveLayer(clean.main,records);await saveLocalDesign({id:crypto.randomUUID(),created:Date.now(),selection:{...defaultSelection,fabric:main.fabric.id,color:main.hex,roomType:scenes.find(s=>s.id===clean.sceneId)!.name},status:'manual',visualizer:clean});setMessage('Saved on this device. Reopen it from Saved designs. Clearing browser data removes it.');
 }
 let summary:React.ReactNode,contact='/contact?interest=Manual%20curtain%20consultation';try{contact=enquiryHref(design,records);summary=(['sheer','main'] as const).map(key=>{const layer=resolveLayer(design[key],records);return <p key={key} className="mb-1 mt-0 text-[13px] leading-6"><span className="font-medium">{key==='sheer'?'Sheer':'Main curtains'}:</span> {design[key].enabled?layer.fabric.name+' / '+layer.shadeName:'Not included'}</p>;});}catch{summary=<p className="text-[13px]">Select a supported fabric to begin.</p>;}
 if(restoreError){contact=originalContact||'/contact?interest=Curtain%20preview%20assistance';summary=<p className="text-[13px] leading-6">Your previous selection has not been rendered. Choose a supported material to start a new sample.</p>;}
 return <div className="bg-paper">
  <Container className="pb-6 pt-7 md:pt-10"><p className="m-0 text-[11px] uppercase tracking-[2.5px] text-bronze">THE DCORHOME DESIGN STUDIO</p><h1 className="mb-3 mt-3 text-[34px] font-medium leading-tight tracking-[-1px] md:text-[46px]">Your window. <em className="font-serif font-normal text-bronze">Your finishing touch.</em></h1><p className="m-0 max-w-2xl text-[15px] leading-7 text-muted">Choose your window, add a light sheer, then find the fabric and colour that feel like home.</p></Container>
  {legacy&&<Container className="mb-8"><section className="border border-solid border-[#dedbd2] p-4"><h2 className="text-[20px] font-medium">Your saved preview</h2><p className="text-[13px] text-muted">This earlier design remains available to view and download. Create a new manual study below.</p><img src={legacy.result||legacy.original} alt={'Previously saved '+legacy.name+' curtain design'} className="max-h-[560px] w-full object-contain"/><a download="dcorhome-saved-design.webp" href={legacy.result||legacy.original} className="inline-flex min-h-11 items-center text-[13px] underline">Download saved preview</a></section></Container>}
  <Container className="grid items-start gap-7 pb-12 lg:grid-cols-[minmax(300px,.72fr)_minmax(0,1.28fr)] lg:gap-10">
   <div className="order-2 min-w-0 lg:order-1">
    <section className="mb-5 border-b border-solid border-[#dedbd2] pb-5"><p className="mb-2 mt-0 text-[11px] uppercase tracking-[2px] text-bronze">STEP 01</p><h2 className="mb-4 mt-0 text-[23px] font-medium">Choose your window</h2><div className="grid grid-cols-2 gap-3">{scenes.filter(scene=>scene.status==='sample').map(scene=><button type="button" key={scene.id} aria-pressed={design.sceneId===scene.id} onClick={()=>change({...design,sceneId:scene.id,assetVersion})} className="border border-solid border-[#d5d5c9] bg-white p-2 text-left aria-pressed:border-ink aria-pressed:outline-1 aria-pressed:outline-ink"><img src={scene.base?.replace('base.webp','thumbnail.webp')} alt="Bare garden window in an illustrative living room" loading="lazy" className="aspect-[4/3] w-full object-cover"/><span className="mt-2 block text-[13px]">{scene.name}</span><span className="mt-1 block text-[11px] text-muted">Illustrative sample</span></button>)}</div><details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-[12px] text-muted">More windows · photography in preparation ({scenes.filter(s=>s.status==='missing').length})</summary><ul className="m-0 list-none space-y-2 p-0">{scenes.filter(s=>s.status==='missing').map(scene=><li key={scene.id} className="border-b border-solid border-[#dedbd2] py-2 text-[12px] text-muted">{scene.name}<span className="mt-1 block text-[10px]">Curtain-free image and aligned layers required</span></li>)}</ul></details></section>
    <details open className="mb-5 border-b border-solid border-[#dedbd2]"><summary className="min-h-14 cursor-pointer py-3"><span className="block text-[11px] uppercase tracking-[2px] text-bronze">STEP 02</span><span className="mt-2 block text-[23px] font-medium">Choose your sheer</span></summary><LayerChoices layer="sheer" value={design.sheer} records={records} onChange={sheer=>change({...design,sheer})}/></details>
    <details open className="border-b border-solid border-[#dedbd2]"><summary className="min-h-14 cursor-pointer py-3"><span className="block text-[11px] uppercase tracking-[2px] text-bronze">STEP 03</span><span className="mt-2 block text-[23px] font-medium">Choose your main curtains</span></summary><LayerChoices layer="main" value={design.main} records={records} onChange={main=>change({...design,main})}/></details>
    <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-[13px]">Curtain construction</summary><p className="m-0 text-[13px] leading-6 text-muted">This sample shows a wave drape. Our team can help with pleats, fullness and blackout lining; those options need their own prepared preview assets.</p></details>
   </div>
   <div className="order-1 min-w-0 lg:sticky lg:top-28 lg:order-2">
    {restoreError?<div className="relative aspect-[4/3] bg-sand"><img src={scenes[0].base} alt="Unconfigured sample window without curtains" className="h-full w-full object-cover"/><p role="alert" className="absolute inset-x-4 bottom-4 bg-paper p-4 text-[14px] leading-6">{restoreError}</p></div>:initialized?<WindowPreview design={design} records={records} onReady={readiness}/>:<div className="grid aspect-[4/3] place-items-center bg-sand text-[13px]" role="status">Opening your curtain studio…</div>}
    <section className="mt-6 border-t border-solid border-[#dedbd2] pt-5"><h2 className="mb-3 mt-0 text-[12px] uppercase tracking-[2px] text-bronze">YOUR CURTAIN DESIGN</h2>{summary}{design.inspiration&&!restoreError&&<p className="mt-2 text-[12px] leading-5 text-muted">Your consultation inspiration: {[design.inspiration.style,design.inspiration.pattern,design.inspiration.room].filter(Boolean).join(' / ')}. The preview uses the sample window and wave drape.</p>}<div className="mt-5 grid gap-2 sm:grid-cols-2"><button disabled={!ready||busy} type="button" onClick={()=>perform(download)} className={action}>Download My Design</button><button disabled={!ready||busy} type="button" onClick={()=>perform(save)} className={action}>Save My Design</button><Link href={contact} className={action+' bg-ink text-paper sm:col-span-2'}>Enquire About My Curtains</Link></div><div className="mt-2 flex flex-wrap items-center gap-x-5 text-[12px]"><Link href="/designs" className="inline-flex min-h-11 items-center underline">Saved designs</Link><button type="button" disabled={!ready||busy} onClick={()=>perform(()=>saveDevice())} className="min-h-11 bg-transparent underline disabled:opacity-40">Save on this device</button><a href="mailto:sales@dcorhome.com" className="inline-flex min-h-11 items-center underline">sales@dcorhome.com</a></div>{account===true&&<p className="text-[12px] text-muted">Account saves stay with your signed-in account.</p>}<p role="status" className="mb-0 text-[13px] leading-6 text-muted">{message}</p></section>
   </div>
  </Container>
 </div>;
}
