"use client";
import { useState } from 'react';
import { localDesigns, saveLocalDesign } from '@/lib/local-designs';
import { validateDesign, resolveLayer } from '@/lib/manual-visualizer/model';
import { defaultSelection } from '@/lib/design-options';
import { useFabricRecords } from '../FabricCatalogueProvider';

export default function ImportLocalDesigns(){
 const records=useFabricRecords(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 return <details className="mb-6 text-[13px] leading-6"><summary className="min-h-11 cursor-pointer py-3">Import or back up manual designs</summary><p>Import a private manual-design export supplied by Dcorhome, or back up this browser's configurations. These files are not uploaded. Earlier room photographs need a separate private export. Designs require the original compatible assets.</p>
 <label className="block">Import configurations<input type="file" accept="application/json,.json" disabled={busy} onChange={async event=>{
  const file=event.target.files?.[0];if(!file)return;setBusy(true);setMessage('');let count=0;
  try{
   if(file.size>2000000)throw Error('Choose a configuration file under 2 MB.');
   const parsed=JSON.parse(await file.text());const input=Array.isArray(parsed)?parsed:parsed.designs;
   if(!Array.isArray(input)||!input.length||input.length>50)throw Error('Import between 1 and 50 manual designs.');
   const designs=input.map(item=>{
    if(!item||typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)||!Number.isFinite(item.created)||item.created<0||item.created>8640000000000000)throw Error('Invalid design identity/date.');
    return {id:item.id,created:item.created,design:validateDesign(item.design||item.visualizer,records)};
   });
   if(new Set(designs.map(item=>item.id)).size!==designs.length)throw Error('Duplicate design IDs in import.');
   const existing=await localDesigns();
   for(const item of designs){const prior=existing.find(saved=>saved.id===item.id);if(prior&&JSON.stringify(prior.visualizer)!==JSON.stringify(item.design))throw Error('An existing local design has this ID. Import refused to preserve it.');}
   for(const item of designs){if(existing.some(saved=>saved.id===item.id))continue;const main=resolveLayer(item.design.main,records);await saveLocalDesign({id:item.id,created:item.created,visualizer:item.design,selection:{...defaultSelection,fabric:main.fabric.id,color:main.hex},status:'manual'});count++;}
   setMessage(`${count} designs imported on this browser/device.`);
  }catch(error){setMessage(`${count?count+' designs imported before stopping. ':''}${error instanceof Error?error.message:'Import failed.'}`);}
  finally{setBusy(false);event.target.value='';window.dispatchEvent(new Event('dcorhome-designs-changed'));}
 }} className="my-3 block"/></label>
 <button disabled={busy} className="min-h-11 underline" onClick={async()=>{try{const designs=(await localDesigns()).filter(item=>item.visualizer).map(item=>({id:item.id,created:item.created,design:item.visualizer}));const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,designs},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='dcorhome-manual-designs.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);setMessage('Configuration backup downloaded. Photographs are not included.');}catch{setMessage('Could not read browser storage.');}}}>Download configuration backup</button><p role="status">{message}</p></details>;
}
