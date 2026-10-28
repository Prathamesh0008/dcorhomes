"use client";
import Link from 'next/link';
import { ArrowUpRight, Download, Bookmark } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes } from '@/lib/manual-visualizer/manifest';
import { resolveLayer, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import DesignEnquiryLink from './DesignEnquiryLink';
import { useDesignActions } from './useDesignActions';

export default function DesignReview({design,records,ready,blocked,originalContact}:{design:VisualizerDesign;records:FabricRecord[];ready:boolean;blocked:boolean;originalContact:string}){
 const actions=useDesignActions(design,records);
 return <section aria-label="Review your design" className="mt-7 border-t border-solid border-[#d9ddd2] pt-6">
  <div className="mb-4 flex items-center justify-between"><h2 className="m-0 text-[17px] font-medium">Your composition</h2><span className="text-[11px] text-muted">Made for your home</span></div>
  <dl className="m-0 space-y-3 text-[12px] leading-5">
   <div className="flex justify-between gap-6"><dt className="text-muted">Room</dt><dd className="m-0 max-w-[70%] text-right">{scenes.find(scene=>scene.id===design.sceneId)?.name}</dd></div>
   {(['sheer','main'] as const).map(key=>{
    let text='Choose your fabric',image:string|undefined;
    try{const layer=resolveLayer(design[key],records);text=design[key].enabled?`${layer.fabric.name} / ${layer.shadeName}`:'Not included';image=design[key].enabled?layer.variant?.swatchImage:undefined;}catch{}
    return <div key={key} className="flex justify-between gap-6"><dt className="shrink-0 text-muted">{key==='sheer'?'Sheer':'Main curtain'}</dt><dd className="m-0 flex min-w-0 items-center justify-end gap-2 text-right">{image&&<span aria-hidden="true" style={{backgroundImage:`url("${image}")`}} className="h-4 w-4 shrink-0 rounded-full border border-solid border-black/10 bg-cover"/>}{text}</dd></div>;
   })}
  </dl>
  {blocked ? <Link href={originalContact||'/contact?designUnavailable=1'} className="mt-6 flex min-h-13 items-center justify-between gap-3 rounded-[3px] bg-ink px-5 text-[13px] font-medium text-paper">Enquire About This Design<ArrowUpRight size={17}/></Link> : <DesignEnquiryLink design={design} records={records} className="mt-6 flex min-h-13 items-center justify-between gap-3 rounded-[3px] bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-[#35453d]">Enquire About This Design<ArrowUpRight size={17}/></DesignEnquiryLink>}
  <div className="mt-3 grid grid-cols-2 gap-3"><button type="button" disabled={!ready||blocked||actions.busy} onClick={actions.download} title={!ready?'Available when your selected curtains can be previewed':undefined} className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-solid border-[#cdd3c6] bg-transparent px-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-40"><Download size={14}/>Download Design</button><button type="button" disabled={blocked||actions.busy} onClick={actions.save} className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-solid border-[#cdd3c6] bg-transparent px-2 text-[12px] disabled:opacity-40"><Bookmark size={14}/>Save Design</button></div>
  <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-[11px] text-muted"><button type="button" disabled={blocked||actions.busy} onClick={actions.saveDevice} className="min-h-11 border-0 bg-transparent p-0 text-inherit underline underline-offset-4 disabled:opacity-40">Save on this device</button><Link href="/designs" className="inline-flex min-h-11 items-center underline underline-offset-4">Saved designs</Link></div>
  <p role="status" className="m-0 text-[12px] leading-6 text-ink">{actions.message}</p>
 </section>;
}
