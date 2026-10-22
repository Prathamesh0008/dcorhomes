"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { activeVariants, variantPhotos } from '@/lib/curtains/categories';

export default function FabricCatalogueCard({fabric,category}:{fabric:FabricRecord;category:string}) {
  const variants=activeVariants(fabric);
  const [selectedId,setSelectedId]=useState(variants.find(v=>v.available!==false)?.id||variants[0]?.id||'');
  const selected=variants.find(v=>v.id===selectedId),photo=variantPhotos(fabric,selectedId)[0];
  const href=`/collections/${fabric.slug}${selected?'?shade='+encodeURIComponent(selected.id):''}`;
  return <article data-testid="fabric-card" data-fabric-id={fabric.id} className="group flex h-full min-w-0 flex-col">
    <Link href={href} className="relative block aspect-[4/5] shrink-0 overflow-hidden bg-[#e9e5dc]" aria-label={`View ${fabric.name} in ${selected?.name||'detail'}`}>
      {photo?<img key={photo.src} src={photo.src} alt={`${fabric.name}, ${selected?.name||'fabric'}${photo.mode==='digital'?' digital color preview':''}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"/>:<span className="grid h-full place-items-center p-5 text-center text-[14px] text-muted">Photograph unavailable</span>}
      <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><ArrowUpRight size={20} strokeWidth={1.3}/></span>
    </Link>
    <div className="flex flex-1 flex-col pb-3 pt-5">
      <div className="mb-2 flex items-center justify-between gap-3 text-[12px] uppercase tracking-[1.6px] text-[#8d745c]"><span>{category}</span><span className="text-[12px] normal-case tracking-normal text-muted">{variants.length} shades</span></div>
      <Link href={href} className="inline-block min-h-[56px] md:min-h-[38px]"><h2 className="mb-2 text-[20px] font-medium leading-tight tracking-[-.5px] md:text-[24px]">{fabric.name}</h2></Link>
      <p className="mb-4 line-clamp-2 min-h-[48px] text-[14px] leading-6 text-[#626b62] md:text-[15px]">{fabric.description}</p>
      <div role="group" aria-label={`${fabric.name} shades`} className="-ml-1 flex flex-wrap items-center gap-0.5">
        {variants.slice(0,6).map(v=><button key={v.id} type="button" aria-label={`${fabric.name} card shade: ${v.name}`} aria-pressed={v.id===selectedId} onClick={()=>setSelectedId(v.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-transparent focus-visible:outline-offset-0">
          <span className={`h-7 w-7 overflow-hidden rounded-full border-2 border-solid border-paper bg-sand ring-1 transition-shadow ${v.id===selectedId?'ring-ink':'ring-transparent'}`}>{v.swatchImage||v.digitalSwatchImage?<img src={v.swatchImage||v.digitalSwatchImage} alt="" loading="lazy" className="h-full w-full object-cover"/>:<span className="block h-full w-full" style={v.hexPreview?{backgroundColor:v.hexPreview}:undefined}/>}</span>
        </button>)}
        {variants.length>6&&<Link href={href} className="grid h-11 min-w-9 place-items-center text-[13px] text-muted" aria-label={`View ${variants.length-6} more ${fabric.name} shades`}>+{variants.length-6}</Link>}
      </div>
      <p aria-live="polite" className="mb-4 mt-1 min-h-5 text-[12px] text-muted">{selected?.name}{photo?.mode==='digital'&&<span className="sr-only">, approximate digital color preview</span>}</p>
      <Link href={href} className="mt-auto inline-flex min-h-11 items-center self-start gap-6 border-b border-solid border-[#b9b9aa] py-2 text-[14px] transition-colors hover:border-ink">View Fabric <ArrowUpRight size={17} strokeWidth={1.4}/></Link>
    </div>
  </article>;
}
