import { customerSession } from "@/lib/server/customer-auth";
import { business } from "@/lib/business";
import { designExpired } from '@/lib/server/visualizer-retention';
import { fabricRecords } from '@/lib/server/fabric-records';
import { fabricEnquiry } from '@/lib/curtains/enquiry';
import { siteUrl } from '@/lib/seo';
import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { databaseReady, put, row, transaction } from "@/lib/server/db";
import { failure,HttpError,jsonInput,session,throttle,privateHeaders } from "@/lib/server/security";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{
 const input=await jsonInput(request,12000);
 if(!databaseReady())throw new HttpError(503,"Consultation requests are temporarily unavailable. Please keep a copy of your details and try again later.");
 (await throttle(request,"enquiry",5));
 const text=(key:string,max:number)=>typeof input[key]==="string"?String(input[key]).trim().slice(0,max):"";
 const name=text("name",100),email=text("email",200),phone=text("phone",40),enquiryType=text("enquiryType",80),requestPurpose=text('requestPurpose',20);
 if(requestPurpose&&!['quote','swatch'].includes(requestPurpose))throw new HttpError(400,'Choose a valid fabric enquiry purpose.');
 if(name.length<2||(email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : !/^[+()\d\s-]{7,40}$/.test(phone))||input.consent!==true||text("website",200))throw new HttpError(400,"Enter your full name, a valid email or phone number, and privacy consent.");
 if(enquiryType && !business.enquiryTypes.includes(enquiryType))throw new HttpError(400,"Choose a valid enquiry type.");
 const customer=await customerSession();
 const owner=await session("guest",true),designId=text("designId",60);
 let designSelection:unknown;
 if(designId){const design=(await row("design",designId));if(!design||designExpired(design)||design.owner!==owner)throw new HttpError(400,"The selected design is not available in your session.");designSelection=JSON.parse(design.data).selection;}
 const requestId=request.headers.get("idempotency-key");const id=requestId&&/^[a-f0-9-]{36}$/.test(requestId)?requestId:randomUUID();const existing=(await row("enquiry",id));if(existing){if(existing.owner!==owner)throw new HttpError(409,"Submission conflict.");return NextResponse.json({ok:true,id,stored:true,notified:JSON.parse(existing.data).notification==="sent"},{headers:privateHeaders});}
const fabricId=text('catalogueFabricId',60),variantId=text('variantId',100),quantity=text('quantityMetres',30);let selectedFabric:Record<string,unknown>|undefined;
 if(fabricId){const fabric=(await fabricRecords()).find(f=>f.id===fabricId),variant=fabric?.colors.find(v=>v.id===variantId&&v.active!==false);if(!fabric||!variant)throw new HttpError(400,'The selected fabric or shade is no longer available.');if(quantity&&(!Number.isFinite(Number(quantity))||Number(quantity)<=0||Number(quantity)>100000))throw new HttpError(400,'Enter a valid approximate quantity in metres.');selectedFabric={fabricId:fabric.id,slug:fabric.slug,name:fabric.name,collection:fabric.collection||fabric.brand||fabric.category,fabricSku:fabric.sku||null,variantId:variant.id,color:variant.name,shadeCode:variant.colorCode,variantSku:variant.variantSku||null,quantityMetres:quantity?Number(quantity):null,source:fabric.source,productUrl:`${siteUrl}/collections/${fabric.slug}?shade=${encodeURIComponent(variant.id)}`,summary:fabricEnquiry(fabric,variant,`${siteUrl}/collections/${fabric.slug}?shade=${encodeURIComponent(variant.id)}`)};}
const enquiry={designSelection,selectedFabric,requestPurpose,name,email,enquiryType,color:text("color",100),phone:text("phone",40),city:text("city",100),room:text("room",60),interest:text("interest",100),message:text("message",3000),measurements:text("measurements",1500),method:text("method",60),designId,status:"new",notification:"not-configured",consentAt:new Date().toISOString()};
 const saved=await transaction(async()=>{ const prior=await row("enquiry",id); if(prior){if(prior.owner!==owner)throw new HttpError(409,"Submission conflict.");return false;} await put("enquiry",id,owner!,enquiry); if(customer) await put("account-enquiry",id,customer.user.id,enquiry); return true; });
 if(!saved)return NextResponse.json({ok:true,id,stored:true,notified:false},{headers:privateHeaders});
 const {RESEND_API_KEY,ENQUIRY_FROM_EMAIL}=process.env;const ENQUIRY_TO_EMAIL=process.env.DCORHOME_CONTACT_EMAIL || business.email;
 if(RESEND_API_KEY&&ENQUIRY_FROM_EMAIL&&ENQUIRY_TO_EMAIL){try{const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:ENQUIRY_FROM_EMAIL,to:[ENQUIRY_TO_EMAIL],...(email?{reply_to:email}:{}),subject:`Dcorhome consultation - ${name}`,text:JSON.stringify({...enquiry,id},null,2)}),signal:AbortSignal.timeout(15000)});enquiry.notification=response.ok?"sent":"failed";}catch{enquiry.notification="failed";}(await put("enquiry",id,owner!,enquiry));}
 return NextResponse.json({ok:true,id,stored:true,notified:enquiry.notification==="sent"},{headers:privateHeaders});
}catch(e){return failure(e);}}
