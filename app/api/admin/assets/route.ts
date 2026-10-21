import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextRequest,NextResponse } from "next/server";
import { putAsset,assetStorageReady } from "@/lib/server/assets";
import { put } from "@/lib/server/db";
import { failure,HttpError,mutation,requireAdmin } from "@/lib/server/security";
export async function POST(request:NextRequest){try{mutation(request,11*1024*1024);await requireAdmin();if(!assetStorageReady())throw new HttpError(503,'Image storage unavailable.');if(!request.headers.get('content-length'))throw new HttpError(413,'File size is required.');const data=await request.formData(),file=data.get('image'),license=String(data.get('license')||'').slice(0,500);if(!(file instanceof File)||file.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)||!license)throw new HttpError(400,'Choose an image under 10 MB and provide licensing/ownership information.');let bytes:Buffer;try{bytes=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:24000000}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new HttpError(400,'Image could not be decoded.');}const id=randomUUID();await putAsset(`${id}/result.webp`,bytes);put('catalogue-image',id,'admin',{license});return NextResponse.json({path:`/api/catalogue/images/${id}`});}catch(e){return failure(e);}}
