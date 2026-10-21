import { cookies } from "next/headers";
import { remove } from "@/lib/server/db";
import { NextRequest,NextResponse } from "next/server";
import { equal,failure,HttpError,jsonInput,mutation,session,throttle } from "@/lib/server/security";
export async function POST(request:NextRequest){try{const data=await jsonInput(request,2048);throttle(request,"admin-login",5,900000);const password=process.env.ADMIN_PASSWORD;if(!password||password.length<20)throw new HttpError(503,"Administrator access has not been configured.");if(typeof data.password!=="string"||!equal(data.password,password))throw new HttpError(401,"Invalid sign-in.");await session("admin",true);return NextResponse.json({ok:true});}catch(e){return failure(e);}}
export async function DELETE(request:NextRequest){try{mutation(request);const id=await session("admin");if(id)remove("admin-session",id);(await cookies()).delete("dcorhome_admin");return NextResponse.json({ok:true});}catch(e){return failure(e);}}
