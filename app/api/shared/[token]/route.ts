import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { row } from "@/lib/server/db";
import { getAsset } from "@/lib/server/assets";
import { failure,HttpError,privateHeaders } from "@/lib/server/security";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){try{const {token}=await params;if(!/^[\w-]{43}$/.test(token))throw new HttpError(404,"Share unavailable.");const share=row("share",createHash("sha256").update(token).digest("hex"));if(!share)throw new HttpError(404,"Share unavailable.");const data=JSON.parse(share.data);if(data.expires<Date.now()||!row("design",data.designId))throw new HttpError(404,"Share expired or revoked.");return new NextResponse(new Uint8Array(await getAsset(`${data.designId}/result.webp`)),{headers:{...privateHeaders,"Content-Type":"image/webp","Referrer-Policy":"no-referrer"}});}catch(e){return failure(e);}}
