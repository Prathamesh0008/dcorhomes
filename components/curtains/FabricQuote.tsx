"use client";
import { useId,useRef,useState } from 'react';
import Link from 'next/link';
import type { FabricRecord,FabricVariant } from '@/lib/curtains/catalogue';
export default function FabricQuote({fabric,variant,primary=false,purpose='quote'}:{fabric:FabricRecord;variant:FabricVariant|undefined;primary?:boolean;purpose?:'quote'|'swatch'}){
 const titleId=useId(),swatch=purpose==='swatch',dialog=useRef<HTMLDialogElement>(null),lock=useRef(false),id=useRef('');
 const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[done,setDone]=useState(false);
 const input='mt-2 min-h-11 w-full border border-solid border-[#c6c9c0] bg-paper px-3 text-[13px]';
 const message=`Please ${swatch?'confirm physical swatch options':'provide a quotation'} for ${fabric.name}, ${variant?.name||'shade to confirm'} (${variant?.variantSku||variant?.colorCode||'code to confirm'}).`;
 async function submit(form:HTMLFormElement){
  if(lock.current)return;lock.current=true;setBusy(true);setStatus('');
  try{
   const fields=Object.fromEntries(new FormData(form));id.current ||=crypto.randomUUID();
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':id.current},body:JSON.stringify({...fields,consent:fields.consent==='on',catalogueFabricId:fabric.id,variantId:variant?.id||'',interest:fabric.name,requestPurpose:purpose,enquiryType:swatch?'Curtain Fabric Enquiry':'Request a Quotation'})});
   const result=await response.json();if(!response.ok||!result.accepted)throw Error(result.error||'Email delivery was not accepted. Please contact sales@dcorhome.com.');
   setDone(true);id.current='';setStatus('Our email provider accepted your enquiry for delivery. Inbox delivery is not guaranteed.');
  }catch(error){setStatus(error instanceof Error?error.message:'Unable to save your request. Please try again.');}finally{lock.current=false;setBusy(false);}
 }
 return <><button type="button" disabled={!variant} onClick={()=>{dialog.current?.showModal();}} className={`min-h-12 w-full border border-solid border-ink px-5 text-[14px] disabled:opacity-40 ${primary?'bg-ink text-paper':'bg-transparent text-ink'}`}>{swatch?'Request a Swatch':'Request a Quote'}</button>
 <dialog ref={dialog} aria-labelledby={titleId} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,640px)] overflow-y-auto border-0 bg-paper p-6 text-ink backdrop:bg-black/50 md:p-8"><div className="flex items-center justify-between gap-4"><h2 id={titleId} className="text-[25px] font-medium">{swatch?'Swatch enquiry':'Request a quotation'}</h2><button type="button" onClick={()=>dialog.current?.close()} className="min-h-11 px-3 text-[13px]">Close {swatch?'swatch enquiry':'quote'}</button></div>
 {swatch&&<p className="text-[13px] leading-6 text-muted">Ask about physical samples for this exact shade. Sample availability, cost and delivery will be confirmed by our team.</p>}
 {status&&<p role={done?'status':'alert'} className="text-[13px] leading-6">{status}</p>}
 {!done&&<form onSubmit={e=>{e.preventDefault();submit(e.currentTarget);}} className="mt-5 grid gap-4 sm:grid-cols-2">
 <label className="text-[13px]">Name<input autoFocus required minLength={2} maxLength={100} autoComplete="name" name="name" className={input}/></label>
 <label className="text-[13px]">Email<input required type="email" maxLength={200} name="email" autoComplete="email" className={input}/></label>
 <label className="text-[13px]">Contact number<input type="tel" maxLength={40} name="phone" autoComplete="tel" className={input}/></label>
 {!swatch&&<label className="text-[13px]">Approximate quantity (metres)<input type="number" min="0.1" max="100000" step="0.1" name="quantityMetres" className={input}/></label>}
 <label className="text-[13px]">Selected fabric<input readOnly value={fabric.name} className={input}/></label>
 <label className="text-[13px]">Selected shade<input readOnly value={variant?`${variant.name} / ${variant.colorCode}`:'Not selected'} className={input}/></label>
 <label className="text-[13px] sm:col-span-2">Selected SKU<input readOnly value={variant?.variantSku||fabric.sku||'Not supplied; demo reference only'} className={input}/></label>
 <label className="text-[13px] sm:col-span-2">Message<textarea name="message" maxLength={2000} rows={3} defaultValue={message} className="mt-2 w-full border border-solid border-[#c6c9c0] bg-paper p-3 text-[13px]"/></label>
 <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
 <label className="flex items-start gap-3 text-[13px] leading-6 sm:col-span-2"><input type="checkbox" required name="consent" className="mt-1 h-4 w-4"/><span>I agree to the use of my details to respond to this enquiry. <Link href="/privacy" className="underline">Privacy notice</Link></span></label>
 <button disabled={busy} type="submit" className="min-h-12 bg-ink px-6 text-[13px] text-paper disabled:opacity-50 sm:col-span-2">{busy?'Saving request…':swatch?'Send swatch enquiry':'Send quotation request'}</button>
 </form>}</dialog></>;
}
