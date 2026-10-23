import { NextRequest,NextResponse } from 'next/server';
import { row,remove,transaction } from '@/lib/server/db';
import { deleteAsset } from '@/lib/server/assets';
import { allRecords } from '@/lib/server/db';
import { validId } from '@/lib/server/visualizer-upload';
import { failure,HttpError,session,mutation,privateHeaders } from '@/lib/server/security';
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{mutation(request);const {id}=await params,owner=await session();if(!validId(id)||!owner)throw new HttpError(404,'Room photo not found.');await transaction(async()=>{const item=await row('upload',id);if(!item||item.owner!==owner)throw new HttpError(404,'Room photo not found.');if((await allRecords('generation',owner)).some(g=>{const d=JSON.parse(g.data);return d.uploadId===id&&d.status==='processing'&&d.deadline>Date.now();}))throw new HttpError(409,'Wait for this preview to finish before removing its room photo.');await deleteAsset(`${id}/original.webp`);await remove('upload',id);});return NextResponse.json({ok:true},{headers:privateHeaders});}catch(e){return failure(e);}}
