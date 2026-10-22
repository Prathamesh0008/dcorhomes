"use client";
import { useEffect,useRef,useState,useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown,ArrowUpRight,ChevronDown,Search,SlidersHorizontal,X } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { categoryId,type FabricCategory } from '@/lib/curtains/categories';
import type { CatalogueQuery } from '@/lib/curtains/catalogue-query';
import { useFabricRecords } from './FabricCatalogueProvider';
import FabricCategoryNavigation from './FabricCategoryNavigation';
import FabricCatalogueCard from './FabricCatalogueCard';
import FabricFilters from './FabricFilters';
import Container from '@/components/ui/Container';
import Photograph from '@/components/ui/Photograph';

type Result={items:FabricRecord[];total:number;page:number;pages:number};
const sortOptions=[{value:'name',label:'Name: A to Z'},{value:'name-desc',label:'Name: Z to A'},{value:'colors',label:'Verified shade count'}];
export default function CatalogueBrowser({result,query,categories}:{result:Result;query:CatalogueQuery;categories:FabricCategory[]}) {
  const records=useFabricRecords(),router=useRouter(),dialog=useRef<HTMLDialogElement>(null),sort=useRef<HTMLDetailsElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),draft=useRef(query);
  const [filters,setFilters]=useState(query),[pending,startTransition]=useTransition();
  useEffect(()=>{draft.current=query;setFilters(query);},[query]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  function href(values:CatalogueQuery){const params=new URLSearchParams(values);for(const [k,v]of [...params])if(!v)params.delete(k);return `/collections?${params}`;}
  function update(key:string,value:string){const next={...draft.current,[key]:value,page:'1'};draft.current=next;setFilters(next);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>startTransition(()=>router.push(href(next),{scroll:false})),key==='q'||key.includes('Min')||key.includes('Max')?300:80);}
  function clear(){if(timer.current)clearTimeout(timer.current);draft.current={};setFilters({});startTransition(()=>router.push('/collections',{scroll:false}));}
  const current=categories.find(c=>c.id===filters.category),isBlackout=Boolean(filters.blackout),heading=isBlackout?'Blackout fabrics':current?.name?`${current.name} fabrics`:'The fabric collection';
  const active=Object.entries(filters).filter(([key,value])=>value&&!['sort','page'].includes(key));
  const categoriesWithProducts=categories.filter(c=>c.active!==false&&records.some(f=>categoryId(f)===c.id));
  const categoryItems=[{id:'all',name:'All Fabrics',count:records.length,image:'/images/linen-detail.jpg',href:'/collections',selected:!filters.category&&!isBlackout},...categoriesWithProducts.map(c=>({id:c.id,name:c.name,count:records.filter(f=>categoryId(f)===c.id).length,image:records.find(f=>categoryId(f)===c.id)?.images[0],href:href({...filters,category:c.id,blackout:'',page:'1'}),selected:filters.category===c.id&&!isBlackout})),...(records.some(f=>f.category==='Blackout'||(f.blackoutPercentage||0)>0)?[{id:'blackout',name:'Blackout',count:records.filter(f=>f.category==='Blackout'||(f.blackoutPercentage||0)>0).length,image:records.find(f=>f.category==='Blackout')?.images[0],href:href({...filters,category:'',blackout:'1',page:'1'}),selected:isBlackout}]:[])];
  const label=(key:string,value:string)=>key==='category'?categories.find(c=>c.id===value)?.name||value:key==='usage'?value==='main'?'Main curtain':'Sheer':key==='blackout'?'Blackout':key==='q'?`Search: ${value}`:key==='widthMin'?`Width from ${value} cm`:key==='widthMax'?`Width to ${value} cm`:key==='gsmMin'?`From ${value} GSM`:key==='gsmMax'?`To ${value} GSM`:value;
  const filterPanel=<FabricFilters records={records} categories={categories} query={filters} onChange={update} onClear={clear}/>;
  return <>
    <section className="overflow-hidden bg-[#eeeae1]">
      <Container className="grid items-center gap-8 py-9 md:min-h-[410px] md:grid-cols-[1fr_1fr] md:gap-12 md:py-0 lg:min-h-[450px]">
        <div className="py-1 md:py-10"><p className="mb-5 text-[12px] font-medium uppercase tracking-[2.5px] text-[#8a7259]">THE DCORHOME FABRIC LIBRARY</p><h1 className="mb-6 text-[46px] font-medium leading-[1.04] tracking-[-1.8px] sm:text-[58px] lg:text-[70px]">Materials that<br/><em className="font-serif text-[1.06em] font-normal text-[#8b765e]">make a home.</em></h1><p className="mb-6 max-w-[440px] text-[16px] leading-7 text-[#5d665c]">Beautiful curtain fabrics, considered in every detail. Find your texture, explore the palette, and let the light do the rest.</p><a href="#fabric-collection" className="inline-flex min-h-11 items-center gap-5 border-b border-solid border-[#a99e8c] pb-2 text-[14px]">Discover the collection <ArrowDown size={17} strokeWidth={1.3}/></a></div>
        <div className="relative -mx-[18px] h-[280px] overflow-hidden md:mx-0 md:h-[410px] lg:h-[450px]"><Photograph src="/images/atelier-interior.jpg" alt="Natural light across full-length gathered curtain folds" fill sizes="(max-width:767px) 100vw,50vw" priority className="object-cover object-[40%_46%]"/><span className="absolute bottom-5 left-5 border-l border-solid border-[#ffffff90] pl-3 text-[12px] uppercase tracking-[2px] text-white">Texture. Light. Possibility.</span></div>
      </Container>
    </section>
    <Container><FabricCategoryNavigation items={categoryItems}/></Container>
    <Container as="section" id="fabric-collection" className="scroll-mt-28 pb-16 pt-9 md:pb-24 md:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-solid border-[#ddded3] pb-6">
        <div><h2 className="mb-2 text-[30px] font-medium leading-tight tracking-[-.8px] md:text-[36px]">{heading}</h2><p role="status" className="m-0 text-[14px] text-muted">{pending?'Finding your fabrics...':`${result.total} fabric varieties`}</p></div>
        <div className="flex w-full flex-wrap items-center gap-5 md:w-auto">
          <form role="search" className="w-full min-w-0 basis-full md:w-[210px] md:flex-1 md:basis-auto" onSubmit={e=>{e.preventDefault();if(timer.current)clearTimeout(timer.current);startTransition(()=>router.push(href(draft.current),{scroll:false}));}}><label className="relative block"><span className="sr-only">Search curtain fabrics</span><Search size={17} strokeWidth={1.2} className="absolute left-0 top-3.5 text-muted"/><input type="search" aria-label="Search curtain fabrics" value={filters.q||''} onChange={e=>update('q',e.target.value)} placeholder="Find a fabric or shade" className="h-12 w-full border-b border-solid border-[#bfc4b6] bg-transparent pl-7 pr-1 text-[14px] outline-offset-4"/></label></form>
          <button type="button" onClick={()=>dialog.current?.showModal()} className="inline-flex min-h-12 items-center gap-3 border-b border-solid border-[#bfc4b6] bg-transparent py-2 text-[14px] xl:hidden"><SlidersHorizontal size={18} strokeWidth={1.2}/>Filter fabrics{active.length>0&&<span className="text-[12px]">({active.length})</span>}</button>
          <details ref={sort} className="relative" onKeyDown={e=>{if(e.key==='Escape')sort.current?.removeAttribute('open');}}><summary aria-label="Sort fabrics" className="flex min-h-12 cursor-pointer list-none items-center gap-6 border-b border-solid border-[#bfc4b6] py-2 text-[14px] [&::-webkit-details-marker]:hidden">Sort by <ChevronDown size={16} strokeWidth={1.2}/></summary><div className="absolute right-0 top-full z-20 mt-2 min-w-[220px] border border-solid border-[#dedfd4] bg-paper p-2 shadow-[0_12px_40px_#25342f14]">{sortOptions.map(option=><button type="button" key={option.value} aria-pressed={(filters.sort||'name')===option.value} onClick={()=>{update('sort',option.value);sort.current?.removeAttribute('open');}} className="block min-h-11 w-full bg-transparent px-4 text-left text-[14px] hover:bg-cream aria-pressed:bg-cream">{option.label}</button>)}</div></details>
        </div>
      </div>
      {active.length>0&&<div aria-label="Applied fabric filters" className="mb-7 flex flex-wrap gap-2">{active.map(([key,value])=><button type="button" key={key} onClick={()=>update(key,'')} aria-label={`Remove filter: ${label(key,value)}`} className="inline-flex min-h-10 items-center gap-3 rounded-full bg-[#eeeee5] px-4 text-[13px]">{label(key,value)}<X size={13} strokeWidth={1.4}/></button>)}<button type="button" onClick={clear} className="min-h-10 bg-transparent px-3 text-[13px] underline underline-offset-4">Clear all</button></div>}
      <div className="grid items-start gap-10 xl:grid-cols-[230px_1fr]">
        <aside aria-label="Fabric filters" className="hidden xl:sticky xl:top-28 xl:block">{filterPanel}</aside>
        <div aria-busy={pending} className="min-w-0">
          {result.items.length?<div className="grid grid-cols-2 gap-x-4 gap-y-10 max-[359px]:grid-cols-1 md:gap-x-7 md:gap-y-14 min-[1100px]:grid-cols-3">{result.items.map(f=><FabricCatalogueCard key={f.id} fabric={f} category={categories.find(c=>c.id===categoryId(f))?.name||f.category}/>)}</div>:<div className="bg-cream px-7 py-14 md:px-12"><p className="text-[12px] uppercase tracking-[2px] text-bronze">A DIFFERENT DIRECTION</p><h3 className="mb-4 text-[28px] font-medium">No fabrics match these filters.</h3><p className="max-w-md text-[16px] leading-7 text-muted">Try another material or shade, or let our team help you find the right fabric.</p><div className="mt-6 flex flex-wrap gap-6"><button type="button" onClick={clear} className="min-h-11 border-b border-solid border-ink bg-transparent text-[14px]">Clear filters</button><Link href="/contact?interest=Curtain%20fabrics" className="inline-flex min-h-11 items-center gap-4 text-[14px]">Talk to our team <ArrowUpRight size={17}/></Link></div></div>}
          {result.pages>1&&<nav aria-label="Catalogue pages" className="mt-12 flex items-center justify-between border-t border-solid border-[#ddded3] pt-6 text-[14px]">{result.page>1?<Link href={href({...filters,page:String(result.page-1)})} className="py-3 underline">Previous</Link>:<span/>}<span>{result.page} / {result.pages}</span>{result.page<result.pages?<Link href={href({...filters,page:String(result.page+1)})} className="py-3 underline">Next</Link>:<span/>}</nav>}
        </div>
      </div>
    </Container>
    <dialog ref={dialog} aria-labelledby="fabric-filters-title" onCancel={e=>{e.preventDefault();dialog.current?.close();}} onKeyDown={e=>{if(e.key==='Escape')dialog.current?.close();}} className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(94vw,420px)] overflow-y-auto border-0 bg-paper p-6 text-ink backdrop:bg-black/40 md:p-8"><div className="mb-6 flex items-center justify-between"><h2 id="fabric-filters-title" className="m-0 text-[28px] font-medium">Find your fabric</h2><button type="button" aria-label="Close filters" onClick={()=>dialog.current?.close()} className="grid h-11 w-11 place-items-center rounded-full bg-cream"><X size={20} strokeWidth={1.3}/></button></div>{filterPanel}<button type="button" onClick={()=>dialog.current?.close()} className="sticky bottom-0 mt-6 min-h-14 w-full bg-ink px-6 text-[15px] text-paper">{pending?'Updating...':`View ${result.total} fabrics`}</button></dialog>
  </>;
}
