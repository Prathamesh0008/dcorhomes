import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { normalizeRoom, MAX_UPLOAD_BYTES } from '@/lib/ai/image-processing';
import { readiness } from '@/lib/ai/config';
import { put, row } from './db';
import { putAsset } from './assets';
import { HttpError, mutation, session, throttle } from './security';
export const validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id);
export async function ownedUpload(id:unknown,owner:string){
 if(!validId(id))throw new HttpError(404,'Room photo not found.');
 const item=await row('upload',id);if(!item||item.owner!==owner)throw new HttpError(404,'Room photo not found.');
 const data=JSON.parse(item.data);if(data.expires<Date.now())throw new HttpError(410,'This room photo has expired. Please upload it again.');
 return {item,data};
}
export async function uploadRoom(request:NextRequest){
 const maximum=MAX_UPLOAD_BYTES+65536;mutation(request,maximum);
 if(!readiness().uploadConfigured)throw new HttpError(503,'Private photo storage is not configured.');
 await throttle(request,'private-upload',20);
 const owner=(await session('guest',true))!;
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Choose a room photo.');
 const parts:Uint8Array[]=[];let length=0;
 while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.length;if(length>maximum){await reader.cancel();throw new HttpError(413,'Choose a photograph smaller than 3 MB.');}parts.push(chunk.value);}
 let form:FormData;try{form=await new Response(Buffer.concat(parts),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();}catch{throw new HttpError(400,'Choose a valid room photo.');}
 const photo=form.get('image');if(!(photo instanceof File)||!['image/jpeg','image/png','image/webp'].includes(photo.type))throw new HttpError(400,'Choose a JPG, PNG or WebP photograph.');
 const normalized=await normalizeRoom(Buffer.from(await photo.arrayBuffer()));
 const id=randomUUID(),expires=Date.now()+86400000;
 // Record first so retention can retry cleanup even if object storage fails.
 await put('upload',id,owner,{...normalized,bytes:undefined,key:`${id}/original.webp`,expires});
 await putAsset(`${id}/original.webp`,normalized.bytes);
 return {id,width:normalized.width,height:normalized.height,expires,image:`/api/visualizer/uploads/${id}/image`};
}
