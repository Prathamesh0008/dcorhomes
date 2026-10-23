import { NextRequest,NextResponse } from 'next/server';
import { cleanPrivateData } from '@/lib/server/visualizer-retention';
import { equal,failure,HttpError,privateHeaders } from '@/lib/server/security';
export const runtime='nodejs';
export const maxDuration=180;
export async function GET(request:NextRequest){try{const secret=process.env.CRON_SECRET;if(!secret||secret.length<32||!equal(request.headers.get('authorization')||'',`Bearer ${secret}`))throw new HttpError(401,'Retention authorization required.');return NextResponse.json({ok:true,...await cleanPrivateData()},{headers:privateHeaders});}catch(e){return failure(e);}}
