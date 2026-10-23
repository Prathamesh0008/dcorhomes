import { NextRequest,NextResponse } from 'next/server';
import { ownedUpload } from '@/lib/server/visualizer-upload';
import { getAsset } from '@/lib/server/assets';
import { failure,HttpError,session,privateHeaders } from '@/lib/server/security';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const owner=await session();if(!owner)throw new HttpError(404,'Room photo not found.');const {data}=await ownedUpload((await params).id,owner);return new NextResponse(new Uint8Array(await getAsset(data.key)),{headers:{...privateHeaders,'Content-Type':'image/webp'}});}catch(e){return failure(e);}}
