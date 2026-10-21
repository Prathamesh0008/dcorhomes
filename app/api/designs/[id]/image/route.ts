import { NextRequest, NextResponse } from "next/server";
import { row } from "@/lib/server/db";
import { getAsset } from "@/lib/server/assets";
import { failure,HttpError,session,privateHeaders } from "@/lib/server/security";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const item=row("design",id),owner=await session();if(!item||(!await session("admin")&&(!owner||item.owner!==owner)))throw new HttpError(404,"Image not found.");const type=request.nextUrl.searchParams.get("type")==="original"?"original":"result";const bytes=await getAsset(`${id}/${type}.webp`);return new NextResponse(new Uint8Array(bytes),{headers:{...privateHeaders,"Content-Type":"image/webp","Content-Disposition":`inline; filename="dcorhome-${type}.webp"`}});}catch(e){return failure(e);}}
