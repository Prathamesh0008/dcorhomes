import { NextRequest,NextResponse } from "next/server";
import { cleanPrivateData } from "@/lib/server/visualizer-retention";
import { failure,mutation,requireAdmin,privateHeaders } from "@/lib/server/security";
export const maxDuration=180;
export async function POST(request:NextRequest){try{mutation(request);await requireAdmin();return NextResponse.json({ok:true,...await cleanPrivateData()},{headers:privateHeaders});}catch(e){return failure(e);}}
