"use client";
import { useState } from 'react';

// Never fall back to an unrelated photograph when a selected input is missing.
export default function StudioImage({src,alt,className='',onError,priority=false}:{src?:string;alt:string;className?:string;onError?:()=>void;priority?:boolean}){
 const [failed,setFailed]=useState('');
 if(!src||failed===src)return <span role="img" aria-label={alt+' is unavailable'} className={`grid place-items-center bg-[#eeeae2] px-2 text-center text-[11px] leading-5 text-muted ${className}`}>Image unavailable</span>;
 return <img src={src} alt={alt} loading={priority?'eager':'lazy'} decoding="async" onError={()=>{setFailed(src);onError?.();}} className={className}/>;
}
