import sharp from "sharp";
import { HttpError } from "@/lib/server/security";
export const MAX_UPLOAD_BYTES=3*1024*1024;
export async function normalizeRoom(bytes:Buffer){
 if(!bytes.length||bytes.length>MAX_UPLOAD_BYTES)throw new HttpError(413,'Choose a room photograph smaller than 3 MB.');
 try{const image=sharp(bytes,{limitInputPixels:24000000,animated:false}),meta=await image.metadata();
 if(!['jpeg','png','webp'].includes(meta.format||'')||!meta.width||!meta.height||meta.width<256||meta.height<256||(meta.pages||1)>1)throw Error();
 const normalized=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).toColourspace('srgb').flatten({background:'#ffffff'}).webp({quality:90}).toBuffer();
 const result=await sharp(normalized).metadata();return {bytes:normalized,width:result.width!,height:result.height!,sourceWidth:meta.width,sourceHeight:meta.height,sourceOrientation:meta.orientation||1,contentType:'image/webp'};
 }catch{throw new HttpError(400,'Use a valid, still JPEG, PNG or WebP photograph, at least 256 pixels per side and at most 24 megapixels.');}
}
