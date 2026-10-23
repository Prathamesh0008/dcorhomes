import { createHash } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import sharp from 'sharp';
import { aiConfig,readiness,requireAI } from '@/lib/ai/config';
import { validateConfiguration } from '@/lib/ai/validate-configuration';
import { buildCurtainEditPrompt } from '@/lib/ai/build-curtain-edit-prompt';
import { editCurtains } from '@/lib/ai/provider';
import { fabricReferences } from '@/lib/ai/fabric-references';
import { validWindowArea } from '@/lib/visualizer-area';
import { allRecords,consume,put,row,transaction } from './db';
import { getAsset,putAsset } from './assets';
import { ownedUpload,validId } from './visualizer-upload';
import { constrainEdit,windowMask } from './curtain-edit';
import { failure,HttpError,jsonInput,session,throttle,privateHeaders } from './security';
type Job={configuration?:unknown;windowArea?:unknown;createdAt?:number;completedAt?:number;resultStorageKey?:string;status:'processing'|'completed'|'failed';fingerprint:string;uploadId:string;deadline:number;model:string;quality:string;error?:string;errorStatus?:number;providerRequestId?:string;usage?:unknown};
export function getReadiness(){return NextResponse.json(readiness(),{headers:privateHeaders});}
async function responseFor(id:string,owner:string,job:Job){
 if(job.status==='processing'&&job.deadline<Date.now()){job={...job,status:'failed',error:'This preview was interrupted. Start a new preview only if you want another generation.',errorStatus:504};await put('generation',id,owner,job);}
 if(job.status==='completed'){
  const design=await row('design',id);if(!design||design.created<Date.now()-readiness().retentionDays*86400000)return NextResponse.json({generationId:id,status:'failed',error:'This preview was deleted or expired.'},{status:410,headers:privateHeaders});
  return NextResponse.json({generationId:id,id,status:'completed',result:`/api/designs/${id}/image`,original:`/api/designs/${id}/image?type=original`,selection:JSON.parse(design.data).selection,retentionDays:readiness().retentionDays},{headers:privateHeaders});
 }
 return NextResponse.json({generationId:id,status:job.status,...(job.status==='failed'?{error:job.error}: {})},{status:job.status==='processing'?202:job.errorStatus||502,headers:privateHeaders});
}
export async function generationStatus(id:string){try{const owner=await session();const item=validId(id)?await row('generation',id):undefined;if(!item||!owner||item.owner!==owner)throw new HttpError(404,'Preview not found.');return responseFor(id,owner,JSON.parse(item.data));}catch(e){return failure(e);}}
export async function generatePreview(request:NextRequest){
 let admitted:{id:string;owner:string;job:Job}|undefined;
 try{
  const input=await jsonInput(request,16384),owner=await session();if(!owner)throw new HttpError(401,'Upload a room photo before generating.');
  const id=request.headers.get('Idempotency-Key');if(!validId(id))throw new HttpError(400,'A preview request identifier is required.');
  if(!validWindowArea(input.windowArea))throw new HttpError(400,'Mark the window area inside your photograph.');
  const area={x:input.windowArea.x,y:input.windowArea.y,width:input.windowArea.width,height:input.windowArea.height};
  const config=await validateConfiguration(input),settings=aiConfig();
  const fingerprint=createHash('sha256').update(JSON.stringify({uploadId:input.uploadId,area:area,manual:config.manual,style:config.selection.style,model:settings.model,quality:settings.quality})).digest('hex');
  const admission=await transaction(async()=>{
   const existing=await row('generation',id);
   if(existing){const job:Job=JSON.parse(existing.data);if(existing.owner!==owner||job.fingerprint!==fingerprint)throw new HttpError(409,'This preview request identifier already belongs to another request.');return {job,replay:true};}
   requireAI();await ownedUpload(input.uploadId,owner);
   const active=(await allRecords('generation')).filter(g=>{const d:Job=JSON.parse(g.data);return d.status==='processing'&&d.deadline>Date.now();});
   if(active.length>=settings.concurrency||active.some(g=>g.owner===owner))throw new HttpError(429,'Another preview is being prepared. Please wait and try again.');
   try{await consume(`ai-guest:${owner}`,settings.guestLimit,30*86400000);}catch{throw new HttpError(429,'Your guest preview allowance is used. Please contact our team for help.');}
   await throttle(request,'ai-ip',Math.max(10,settings.dailyLimit),86400000);
   try{await consume('ai-global',settings.dailyLimit,86400000);}catch{throw new HttpError(429,"The studio’s daily preview allowance is used. Please try later.");}
   const job:Job={configuration:{selection:config.selection,specification:config.description},windowArea:area,createdAt:Date.now(),status:'processing',fingerprint,uploadId:String(input.uploadId),deadline:Date.now()+180000,model:settings.model,quality:settings.quality};await put('generation',id,owner,job);return {job,replay:false};
  });
  if(admission.replay)return responseFor(id,owner,admission.job);
  admitted={id,owner,job:admission.job};
  const {data:upload}=await ownedUpload(input.uploadId,owner),original=await getAsset(upload.key);
  const image=await sharp(original).png().toBuffer(),mask=await windowMask(area,upload.width,upload.height);
  const result=await editCurtains(image,mask,buildCurtainEditPrompt(config,area),await fabricReferences(config));
  let edited:Buffer;try{edited=await constrainEdit(original,result.bytes,area,upload.width,upload.height);}catch{throw new HttpError(502,'The returned preview could not be decoded.');}
  // Job metadata survives partial writes so retention can remove orphan objects.
  await putAsset(`${id}/original.webp`,original);await putAsset(`${id}/result.webp`,edited);
  await transaction(async()=>{await put('design',id,owner,{selection:{...config.selection,windowArea:JSON.stringify(area)},status:'generated',saved:false,generationId:id,curtainSpecification:config.description});await put('generation',id,owner,{...admission.job,status:'completed',completedAt:Date.now(),resultStorageKey:`${id}/result.webp`,providerRequestId:result.providerRequestId,usage:result.usage});});
  return responseFor(id,owner,{...admission.job,status:'completed'});
 }catch(e){if(admitted){await put('generation',admitted.id,admitted.owner,{...admitted.job,status:'failed',error:e instanceof HttpError?e.message:'This preview could not be completed. No automatic retry was made.',errorStatus:e instanceof HttpError?e.status:500}).catch(()=>{});}return failure(e);}
}
