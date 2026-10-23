import { integerSetting } from '@/lib/ai/config';
import { allRecords,expiredRows,remove,row,put } from './db';
import type { RecordRow } from './db';
import { deleteAsset } from './assets';
export function designExpired(item:RecordRow){return item.created<Date.now()-integerSetting('RETENTION_DAYS',30,365)*86400000;}
export async function deletePrivateDesign(item:RecordRow){
 await deleteAsset(`${item.id}/original.webp`);await deleteAsset(`${item.id}/result.webp`);
 for(const share of await allRecords('share',item.owner))if(JSON.parse(share.data).designId===item.id)await remove('share',share.id);
 await remove('design',item.id);
 // Keep a small idempotency tombstone: deleted requests must never run again.
 const generation=await row('generation',item.id);if(generation){const job=JSON.parse(generation.data);await put('generation',item.id,item.owner,{status:'failed',fingerprint:job.fingerprint,uploadId:job.uploadId,deadline:0,error:'This preview has been deleted.',errorStatus:410});}
}
export async function cleanPrivateData(){
 let deleted=0,uploads=0,jobs=0;
 const before=Date.now()-integerSetting('RETENTION_DAYS',30,365)*86400000;
 for(const design of await expiredRows('design',before)){await deletePrivateDesign(design);deleted++;}
 for(const upload of await expiredRows('upload',Date.now()-86400000)){await deleteAsset(`${upload.id}/original.webp`);await remove('upload',upload.id);uploads++;}
 for(const generation of await expiredRows('generation',before)){
  if(await row('design',generation.id))continue;
  await deleteAsset(`${generation.id}/original.webp`);await deleteAsset(`${generation.id}/result.webp`);
  // Preserve request IDs until their signed owner session can no longer authorize them.
  if(generation.created<Date.now()-Math.max(31,integerSetting('RETENTION_DAYS',30,365))*86400000)await remove('generation',generation.id);
  jobs++;
 }
 for(const kind of ['enquiry','share','admin-session'])for(const item of await expiredRows(kind,kind==='share'?Date.now()-7*86400000:kind==='admin-session'?Date.now()-8*3600000:before))await remove(kind,item.id);
 return {deleted,uploads,jobs,batchLimit:200};
}
