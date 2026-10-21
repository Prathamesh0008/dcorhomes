import { NextResponse } from "next/server";
import { row } from "@/lib/server/db";
import { getAsset } from "@/lib/server/assets";
import { failure,HttpError } from "@/lib/server/security";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;if(!row('catalogue-image',id))throw new HttpError(404,'Image not found.');return new NextResponse(new Uint8Array(await getAsset(`${id}/result.webp`)),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}catch(e){return failure(e);}}
