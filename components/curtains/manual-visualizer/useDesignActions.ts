"use client";
import { useEffect, useRef, useState } from 'react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { saveLocalDesign } from '@/lib/local-designs';
import { defaultSelection } from '@/lib/design-options';
import { scenes } from '@/lib/manual-visualizer/manifest';
import { resolveLayer, validateDesign, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { exportDesign } from '@/lib/manual-visualizer/renderer';

export function useDesignActions(design:VisualizerDesign,records:FabricRecord[]){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const urls=useRef(new Map<string,ReturnType<typeof setTimeout>>()),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;urls.current.forEach((timer,url)=>{clearTimeout(timer);URL.revokeObjectURL(url);});urls.current.clear();};},[]);
 useEffect(()=>{setMessage('');},[design]);
 async function perform(task:()=>Promise<string>){
  if(busy)return;setBusy(true);setMessage('');
  try{const text=await task();if(mounted.current)setMessage(text);}
  catch(error){if(mounted.current)setMessage(error instanceof Error?error.message:'Please try again in a moment.');}
  finally{if(mounted.current)setBusy(false);}
 }
 async function saveDevice(clean=validateDesign(design,records)){
  const main=resolveLayer(clean.main,records);
  await saveLocalDesign({id:crypto.randomUUID(),created:Date.now(),selection:{...defaultSelection,fabric:main.fabric.id,color:main.hex,roomType:scenes.find(scene=>scene.id===clean.sceneId)!.name},status:'manual',visualizer:clean});
  return 'Your design is saved on this device. Find it in Saved designs.';
 }
 return {busy,message,
  download:()=>perform(async()=>{
   const blob=await exportDesign(design,records),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download='dcorhome-curtains-'+design.sceneId+'.png';anchor.click();
   const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.current.delete(url);},10000);urls.current.set(url,timer);
   return 'Your curtain design has been downloaded.';
  }),
  save:()=>perform(()=>saveDevice()),
  saveDevice:()=>perform(()=>saveDevice()),
 };
}
