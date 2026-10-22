import { fabricRecords } from '@/lib/server/fabric-records';
import { curtainFabrics, curtainStyles } from "@/lib/curtains/configurator-data";
import { fabricFor, normalizeManual } from '@/lib/curtains/manual-config';
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { catalogue } from "@/lib/server/catalogue";
import { databaseReady, consume, put } from "@/lib/server/db";
import { assetStorageReady, putAsset, deleteAsset } from "@/lib/server/assets";
import { failure, HttpError, mutation, session, throttle, privateHeaders } from "@/lib/server/security";
import { availableOptions } from "@/lib/server/options";
export const runtime = "nodejs";
export const maxDuration = 120;
function ready() { return Boolean(process.env.OPENAI_API_KEY && process.env.AI_ENABLED === "true" && databaseReady() && assetStorageReady()); }
export async function GET() { return NextResponse.json({ configured: ready() }, { headers: privateHeaders }); }
export async function POST(request: NextRequest) {
 let generatedId: string | undefined;
 try {
  mutation(request, 11*1024*1024);
  if (!ready()) throw new HttpError(503,"AI visualization is currently unavailable. You can still explore and save your design direction.");
  throttle(request,"image-upload",12);
  if (!request.headers.get("content-length") || Number(request.headers.get("content-length"))>11*1024*1024) throw new HttpError(413,"Upload must be smaller than 10 MB.");
  const owner=await session("guest",true);
  const input=await request.formData(), photo=input.get("image");
  if(!(photo instanceof File)||!["image/png","image/jpeg","image/webp"].includes(photo.type)||photo.size>10*1024*1024||photo.size===0) throw new HttpError(400,"Choose a JPG, PNG or WebP image under 10 MB.");
  const fabric=catalogue().find(p=>p.id===String(input.get("fabricId")));
  if(!fabric) throw new HttpError(400,"Choose an available fabric direction.");
  const pick=(key:string, values:string[],fallback:string)=>{const value=String(input.get(key)||fallback);if(!values.includes(value))throw new HttpError(400,`Invalid ${key} selection.`);return value;};
  const designOptions=availableOptions();
  const requestedStyle=String(input.get('configuratorStyle')||'');
  const requestedFabric=String(input.get('configuratorFabric')||'');
  if(requestedStyle&&!curtainStyles.includes(requestedStyle))throw new HttpError(400,'Invalid curtain style.');
  const manualFabrics=fabricRecords();
  const supplierMaterial=manualFabrics.find(f=>f.id===fabric.id&&f.name===requestedFabric&&f.usage.includes('main'));
  const material=requestedFabric?(curtainFabrics.find(f=>f.name===requestedFabric)||(supplierMaterial?{name:supplierMaterial.name,patterns:['Solid','Textured','Striped']}:undefined)):(curtainFabrics.find(f=>f.catalogueId===fabric.id)||curtainFabrics.find(f=>f.name===fabric.category));
  if(requestedFabric&&!material)throw new HttpError(400,'Invalid main curtain material.');
  const sheerColor=String(input.get('sheerColor')||'#f3efdf');
  if(!/^#[0-9a-f]{6}$/i.test(sheerColor))throw new HttpError(400,'Invalid sheer curtain color.');
  const sheerFabric=String(input.get('sheerFabric')||'solstice'),sheerMaterial=fabricFor(sheerFabric,'sheer',manualFabrics);
  if(sheerMaterial.id!==sheerFabric)throw new HttpError(400,'Invalid sheer material.');
  const sheerHeading=pick('sheerHeading',sheerMaterial.compatibleHeadingStyles,sheerMaterial.compatibleHeadingStyles[0]);
  const mainEnabled=pick('mainEnabled',['true','false'],'true'),sheerEnabled=pick('sheerEnabled',['true','false'],String(input.get('layers')==='Layered sheer and drape'));
  if(mainEnabled==='false'&&sheerEnabled==='false')throw new HttpError(400,'Enable a curtain layer before generating.');
  let manual:string|undefined;
  if(input.get('manual')){try{const raw=String(input.get('manual'));if(raw.length>4000)throw Error();const normalized=normalizeManual(JSON.parse(raw),manualFabrics);for(const [layer,id,color,enabled] of [['main',normalized.mainFabric,normalized.mainColor,normalized.mainEnabled],['sheer',normalized.sheerFabric,normalized.sheerColor,normalized.sheerEnabled]] as const){if(enabled&&!fabricFor(id,layer,manualFabrics).colors.find(c=>c.id===color)?.hexPreview)throw Error();}manual=JSON.stringify(normalized);}catch{throw new HttpError(400,'This configuration has an invalid selection or a shade without a digital color reference. Contact us for a sample before requesting an AI preview.');}}
  const options={sheerColor,sheerFabric,sheerHeading,mainEnabled,sheerEnabled,manual,configuratorStyle:requestedStyle,configuratorFabric:requestedFabric,fabric:fabric.id,style:pick("style",designOptions.styles,"Modern"),roomType:pick("roomType",designOptions.rooms,"Living room"),heading:requestedStyle || pick("heading",[...designOptions.headings,...curtainStyles],"Wave fold"),pattern:pick("pattern",designOptions.patterns,"Solid"),curtainLength:pick("curtainLength",designOptions.lengths,"Floor length"),layers:pick("layers",designOptions.layers,"Single curtain"),fullness:pick("fullness",["1.5","2","2.5"],"2"),color:String(input.get("color")||fabric.color)};
  if(material&&!material.patterns.includes(options.pattern))throw new HttpError(400,"This pattern is not supported by the selected material.");
  if(!/^#[0-9a-f]{6}$/i.test(options.color)) throw new HttpError(400,"Invalid curtain color.");
  let original:Buffer, width:number, height:number;
  try { const image=sharp(Buffer.from(await photo.arrayBuffer()),{limitInputPixels:24000000,animated:false}); const meta=await image.metadata();if(!meta.width||!meta.height||meta.width<256||meta.height<256||!['jpeg','png','webp'].includes(meta.format||''))throw Error();original=await image.rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).webp({quality:90}).toBuffer();const normalized=await sharp(original).metadata();width=normalized.width!;height=normalized.height!;} catch {throw new HttpError(400,"This photograph cannot be decoded. Use a valid image at least 256px on each side and at most 24 megapixels.");}
  try { consume(`ai-session:${owner}`,1,86400000); } catch { throw new HttpError(429,"Your guest-session image allowance is used. Please try again tomorrow."); }
  throttle(request,"ai-ip",2,86400000);
  try { consume("ai-global",Math.min(20,Number(process.env.AI_DAILY_LIMIT||5)),86400000); } catch { throw new HttpError(429,"The studio's daily image allowance is used. Please try again later."); }
  const payload=new FormData();payload.append("model",process.env.OPENAI_IMAGE_MODEL||"gpt-image-1.5");payload.append("image",new Blob([new Uint8Array(original)],{type:"image/webp"}),"room.webp");payload.append("size","auto");payload.append("quality","medium");payload.append("input_fidelity","high");
  payload.append("prompt",`Edit this uploaded room photograph, adding realistic window curtains only. Preserve camera, window positions, furniture, walls, flooring, objects and general lighting as faithfully as possible. Do not create a different room. Design preferences: ${JSON.stringify({...options,fabricName:fabric.name,material:material?.name || fabric.category,sheerMaterial:sheerMaterial.name})}. Preferences describe an illustrative design, not verified stock. Use believable fabric weight, folds, shadows, rail, drape and selected length. ${mainEnabled==='true'?`Include main curtains in ${options.color} with heading ${options.heading} and material ${material?.name || fabric.category}.`:'Do not add main curtains.'} ${sheerEnabled==='true'?`Include separate translucent ${sheerMaterial.name} sheers in ${options.sheerColor} with heading ${sheerHeading}, behind any main curtains.`:'Do not add a sheer layer.'} Do not recolor the room, walls or furniture to simulate curtain colors. No people, logos, text or watermark. Keep the original composition and aspect ratio.`);
  const response=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:payload,signal:AbortSignal.timeout(105000)});
  if(!response.ok) throw new HttpError(response.status===429?429:502,"The image service could not complete this design. Please try later; usage limits still apply.");
  const body=await response.json(),base64=body?.data?.[0]?.b64_json;
  if(typeof base64!=="string"||base64.length>30*1024*1024) throw new HttpError(502,"The image service returned no usable image.");
  let edited:Buffer;
  try{edited=await sharp(Buffer.from(base64,"base64"),{limitInputPixels:24000000}).rotate().resize(width,height,{fit:"cover"}).webp({quality:90}).toBuffer();}catch{throw new HttpError(502,"The returned image could not be decoded.");}
  generatedId=randomUUID();await putAsset(`${generatedId}/original.webp`,original);await putAsset(`${generatedId}/result.webp`,edited);
  put("design",generatedId,owner!,{selection:options,status:"generated",saved:false});
  return NextResponse.json({id:generatedId,image:edited.toString("base64"),mime:"image/webp",original:`/api/designs/${generatedId}/image?type=original`},{headers:privateHeaders});
 }catch(error){if(generatedId){await Promise.allSettled([deleteAsset(`${generatedId}/original.webp`),deleteAsset(`${generatedId}/result.webp`)]);}if(error instanceof Error&&error.name==="TimeoutError")return failure(new HttpError(504,"Image generation timed out. Please try later."));return failure(error);}
}
