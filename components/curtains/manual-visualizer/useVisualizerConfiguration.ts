"use client";
import { useEffect, useReducer, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { localDesigns } from '@/lib/local-designs';
import { readManual, manualSummary } from '@/lib/curtains/manual-config';
import { defaultDesign, fromManual, validateDesign, type VisualizerDesign, type LayerSelection } from '@/lib/manual-visualizer/model';
import { configurationReducer, type ConfigurationAction } from '@/lib/manual-visualizer/configuration';

const storageKey='dcorhome-visualizer-v1';
export function useVisualizerConfiguration(records:FabricRecord[]){
 const params=useSearchParams(),query=params.toString();
 const [design,dispatch]=useReducer(configurationReducer,defaultDesign,design=>structuredClone(design));
 const [initialized,setInitialized]=useState(false),[restoreError,setRestoreError]=useState(''),[originalContact,setOriginalContact]=useState('');
 const [legacy,setLegacy]=useState<{original:string;result?:string;name:string}|null>(null);
 useEffect(()=>{
  const search=new URLSearchParams(query),controller=new AbortController(),urls:string[]=[];
  setInitialized(false);setRestoreError('');setOriginalContact('');setLegacy(null);
  (async()=>{try{
   let restored:unknown;
   if(search.get('local')){
    const saved=(await localDesigns()).find(item=>item.id===search.get('local'));
    if(!saved)throw Error('This saved design is no longer on this device.');
    if(saved.visualizer)restored=saved.visualizer;
    else if(saved.original){
     const original=URL.createObjectURL(saved.original),result=saved.result?URL.createObjectURL(saved.result):undefined;
     urls.push(original,...(result?[result]:[]));
     if(!controller.signal.aborted)setLegacy({original,result,name:saved.selection.fabric});
    }
   }else if(search.get('saved')||search.get('design')){
    throw Error('This is an earlier cloud design. Ask Dcorhome for a private export, then import it in My Saved Designs. The cloud record has not been deleted.');
   }else if(search.get('visualizer'))restored=JSON.parse(search.get('visualizer')!);
   else if(search.get('manual')||search.get('fabric')){
    const config=readManual(Object.fromEntries(search.entries()),records);
    const inspiration={style:(search.get('style')||'').slice(0,100),pattern:(search.get('inspirationPattern')||config.pattern).slice(0,100),room:config.room};
    if(!controller.signal.aborted)setOriginalContact('/contact?'+new URLSearchParams({interest:'Curtain design consultation',message:manualSummary(config,records)}).toString());
    restored=fromManual(config,records,inspiration);
   }else{
    // Disabled browser storage must not prevent an otherwise working studio.
    let saved:string|null=null;try{saved=localStorage.getItem(storageKey);}catch{}
    if(saved)restored=JSON.parse(saved);
   }
   if(!controller.signal.aborted)dispatch({type:'restore',design:restored?validateDesign(restored,records):structuredClone(defaultDesign)});
  }catch(error){if(!controller.signal.aborted)setRestoreError(error instanceof Error?error.message:'Your previous design could not be opened.');}
  finally{if(!controller.signal.aborted)setInitialized(true);}})();
  return()=>{controller.abort();urls.forEach(url=>URL.revokeObjectURL(url));};
 },[query,records]);
 useEffect(()=>{if(!initialized||restoreError)return;try{localStorage.setItem(storageKey,JSON.stringify(validateDesign(design,records)));}catch{}},[design,initialized,restoreError,records]);
 function change(action:ConfigurationAction){setRestoreError('');setOriginalContact('');dispatch(action);}
 return {design,initialized,restoreError,originalContact,legacy,
  selectRoom:(id:string)=>change({type:'scene',id}),
  selectLayer:(layer:'main'|'sheer',value:LayerSelection)=>change({type:'layer',layer,value}),
  startFresh:()=>change({type:'restore',design:structuredClone(defaultDesign)}),
 };
}
