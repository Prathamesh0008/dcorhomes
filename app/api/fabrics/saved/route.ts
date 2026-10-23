import { createHash } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { customerSession } from '@/lib/server/customer-auth';
import { allRecords,databaseReady,put,remove } from '@/lib/server/db';
import { fabricRecords } from '@/lib/server/fabric-records';
import { failure,HttpError,jsonInput,privateHeaders,throttle } from '@/lib/server/security';
export async function GET(){try{const session=await customerSession();if(!session)return NextResponse.json({account:false,items:[]},{headers:privateHeaders});if(!databaseReady())throw new HttpError(503,'Account fabric storage is unavailable.');return NextResponse.json({account:true,items:(await allRecords('saved-fabric',session.user.id)).map(row=>JSON.parse(row.data))},{headers:privateHeaders});}catch(error){return failure(error);}}
export async function POST(request:NextRequest){try{
 const data=await jsonInput(request,2000),session=await customerSession();if(!session)throw new HttpError(401,'Sign in to save to your account.');await throttle(request,'save-fabric',240);
 const fabricId=String(data.fabricId||''),variantId=String(data.variantId||'');if(fabricId.length>100||variantId.length>150||!fabricId||!variantId||typeof data.saved!=='boolean')throw new HttpError(400,'Choose a valid fabric and shade.');
 const id=createHash('sha256').update(JSON.stringify([session.user.id,fabricId,variantId])).digest('hex');
 if(data.saved){const fabric=(await fabricRecords()).find(f=>f.id===fabricId);if(!fabric?.colors.some(v=>v.id===variantId&&v.active!==false))throw new HttpError(404,'This fabric shade is no longer listed.');await put('saved-fabric',id,session.user.id,{fabricId,variantId,variantSku:fabric.colors.find(v=>v.id===variantId)?.variantSku||null});}else await remove('saved-fabric',id);
 return NextResponse.json({ok:true},{headers:privateHeaders});
 }catch(error){return failure(error);}}
