"use client";
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft,ArrowRight } from 'lucide-react';
export type CategoryItem={id:string;name:string;image?:string;count:number;href:string;selected:boolean};
export default function FabricCategoryNavigation({items}:{items:CategoryItem[]}) {
  const rail=useRef<HTMLElement>(null),[edges,setEdges]=useState({left:false,right:false});
  useEffect(()=>{const el=rail.current;if(!el)return;const update=()=>setEdges({left:el.scrollLeft>2,right:el.scrollLeft+el.clientWidth<el.scrollWidth-2});update();const observer=new ResizeObserver(update);observer.observe(el);el.addEventListener('scroll',update,{passive:true});return()=>{observer.disconnect();el.removeEventListener('scroll',update);};},[items.length]);
  function scroll(direction:number){rail.current?.scrollBy({left:direction*(rail.current.clientWidth*.65),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  return <section aria-label="Browse fabric categories" className="border-b border-solid border-[#dfdfd4] py-7 md:py-9">
    <div className="mb-6 flex items-center justify-between gap-5"><p className="m-0 text-[12px] uppercase tracking-[2px] text-[#8d745c]">EXPLORE BY MATERIAL</p><div className="flex gap-2"><button type="button" aria-label="Previous fabric categories" disabled={!edges.left} onClick={()=>scroll(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-solid border-[#d5d5c8] bg-transparent transition-colors hover:bg-sand disabled:opacity-25"><ArrowLeft size={18} strokeWidth={1.3}/></button><button type="button" aria-label="Next fabric categories" disabled={!edges.right} onClick={()=>scroll(1)} className="grid h-10 w-10 place-items-center rounded-full border border-solid border-[#d5d5c8] bg-transparent transition-colors hover:bg-sand disabled:opacity-25"><ArrowRight size={18} strokeWidth={1.3}/></button></div></div>
    <nav ref={rail} aria-label="Fabric categories" className="flex snap-x gap-7 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-10">
      {items.map(item=><Link key={item.id} href={item.href} aria-current={item.selected?'page':undefined} className="group flex w-[106px] shrink-0 snap-start flex-col items-center gap-4 border-b-2 border-solid border-transparent pb-4 text-center transition-colors aria-[current=page]:border-ink md:w-[120px]">
        <span className="block h-[82px] w-[82px] overflow-hidden rounded-full bg-sand ring-1 ring-transparent ring-offset-4 ring-offset-paper transition-shadow group-hover:ring-[#b4a48b] group-aria-[current=page]:ring-[#9b896f] md:h-[96px] md:w-[96px]">{item.image&&<img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"/>}</span>
        <span className="text-[15px] leading-5 md:text-[16px]">{item.name}<span className="ml-2 text-[12px] text-muted">{item.count}</span></span>
      </Link>)}
    </nav>
  </section>;
}
