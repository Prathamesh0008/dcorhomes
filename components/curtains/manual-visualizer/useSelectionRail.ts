"use client";
import { useEffect, useRef } from 'react';

export function useSelectionRail(selection:string){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const rail=ref.current;if(!rail)return;
  const reveal=()=>{
   const button=rail.querySelector<HTMLElement>('[aria-pressed="true"]');
   if(!button||!rail.clientWidth)return;
   const left=button.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft;
   rail.scrollTo({left:Math.max(0,left-(rail.clientWidth-button.clientWidth)/2),behavior:'instant'});
  };
  reveal();const observer=new ResizeObserver(reveal);observer.observe(rail);
  return()=>observer.disconnect();
 },[selection]);
 return ref;
}
