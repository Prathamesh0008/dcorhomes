import { NextRequest,NextResponse } from 'next/server';
import { uploadRoom } from '@/lib/server/visualizer-upload';
import { failure,privateHeaders } from '@/lib/server/security';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{return NextResponse.json(await uploadRoom(request),{status:201,headers:privateHeaders});}catch(e){return failure(e);}}
