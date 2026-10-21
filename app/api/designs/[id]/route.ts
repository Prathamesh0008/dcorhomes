import { NextRequest, NextResponse } from "next/server";
import { row, remove, rows } from "@/lib/server/db";
import { deleteAsset } from "@/lib/server/assets";
import { failure, HttpError, mutation, session, privateHeaders } from "@/lib/server/security";
type Context={params:Promise<{id:string}>};
export async function GET(_request: NextRequest, context:Context) { try { const {id}=await context.params; const item=row("design",id), owner=await session(); if(!item || !owner || item.owner!==owner) throw new HttpError(404,"Design not found."); return NextResponse.json({id,created:item.created,...JSON.parse(item.data)},{headers:privateHeaders}); }catch(e){return failure(e);} }
export async function DELETE(request:NextRequest,context:Context){try{mutation(request);const {id}=await context.params;const item=row("design",id),owner=await session();if(!item||!owner||item.owner!==owner)throw new HttpError(404,"Design not found.");await deleteAsset(`${id}/original.webp`);await deleteAsset(`${id}/result.webp`);for(const share of rows("share",owner))if(JSON.parse(share.data).designId===id)remove("share",share.id);remove("design",id);return NextResponse.json({ok:true},{headers:privateHeaders});}catch(e){return failure(e);}}
