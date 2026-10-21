import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { databaseReady, put, row } from "@/lib/server/db";
import { failure,HttpError,jsonInput,session,throttle,privateHeaders } from "@/lib/server/security";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{
 const input=await jsonInput(request,12000);
 if(!databaseReady())throw new HttpError(503,"Consultation requests are temporarily unavailable. Please keep a copy of your details and try again later.");
 throttle(request,"enquiry",5);
 const text=(key:string,max:number)=>typeof input[key]==="string"?String(input[key]).trim().slice(0,max):"";
 const name=text("name",100),email=text("email",200);
 if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||input.consent!==true||text("website",200))throw new HttpError(400,"Enter a name, valid email and privacy consent.");
 const owner=await session("guest",true),designId=text("designId",60);
 if(designId){const design=row("design",designId);if(!design||design.owner!==owner)throw new HttpError(400,"The selected design is not available in your session.");}
 const requestId=request.headers.get("idempotency-key");const id=requestId&&/^[a-f0-9-]{36}$/.test(requestId)?requestId:randomUUID();const existing=row("enquiry",id);if(existing){if(existing.owner!==owner)throw new HttpError(409,"Submission conflict.");return NextResponse.json({ok:true,id,stored:true},{headers:privateHeaders});}
const enquiry={name,email,phone:text("phone",40),city:text("city",100),room:text("room",60),interest:text("interest",100),message:text("message",3000),measurements:text("measurements",1500),method:text("method",60),designId,status:"new",notification:"not-configured",consentAt:new Date().toISOString()};
 put("enquiry",id,owner!,enquiry);
 const {RESEND_API_KEY,ENQUIRY_FROM_EMAIL,ENQUIRY_TO_EMAIL}=process.env;
 if(RESEND_API_KEY&&ENQUIRY_FROM_EMAIL&&ENQUIRY_TO_EMAIL){try{const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:ENQUIRY_FROM_EMAIL,to:[ENQUIRY_TO_EMAIL],reply_to:email,subject:`Dcorhome consultation - ${name}`,text:JSON.stringify({...enquiry,id},null,2)}),signal:AbortSignal.timeout(15000)});enquiry.notification=response.ok?"sent":"failed";}catch{enquiry.notification="failed";}put("enquiry",id,owner!,enquiry);}
 return NextResponse.json({ok:true,id,stored:true,notified:enquiry.notification==="sent"},{headers:privateHeaders});
}catch(e){return failure(e);}}
