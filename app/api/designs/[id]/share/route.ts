import { randomBytes,createHash } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { row,rows,put,remove } from "@/lib/server/db";
import { failure,HttpError,mutation,session,privateHeaders } from "@/lib/server/security";
type Context={params:Promise<{id:string}>};
async function owned(id:string){const owner=await session(),item=row("design",id);if(!owner||!item||owner!==item.owner)throw new HttpError(404,"Design not found.");return owner;}
export async function POST(request:NextRequest,{params}:Context){try{mutation(request);const {id}=await params,owner=await owned(id);for(const s of rows("share",owner))if(JSON.parse(s.data).designId===id)remove("share",s.id);const token=randomBytes(32).toString("base64url");put("share",createHash("sha256").update(token).digest("hex"),owner,{designId:id,expires:Date.now()+7*86400000});return NextResponse.json({path:`/share/${token}`,expiresInDays:7},{headers:privateHeaders});}catch(e){return failure(e);}}
export async function DELETE(request:NextRequest,{params}:Context){try{mutation(request);const {id}=await params,owner=await owned(id);for(const s of rows("share",owner))if(JSON.parse(s.data).designId===id)remove("share",s.id);return NextResponse.json({ok:true},{headers:privateHeaders});}catch(e){return failure(e);}}
