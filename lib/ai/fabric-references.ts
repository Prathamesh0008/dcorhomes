import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getAsset } from '@/lib/server/assets';
import { row } from '@/lib/server/db';
import type { validateConfiguration } from './validate-configuration';
export async function fabricReferences(config:Awaited<ReturnType<typeof validateConfiguration>>){
 const result:Buffer[]=[];
 for(const [layer,enabled] of [[config.main,config.manual.mainEnabled],[config.sheer,config.manual.sheerEnabled]] as const){
  if(!enabled||layer.fabric.source!=='supplier')continue;
  const source=layer.variant.textureImage||layer.variant.swatchImage||layer.variant.mainImage;
  if(!source)continue;
  try{let bytes:Buffer|undefined;
   // Only catalogue-owned files: never fetch a browser-supplied URL.
   if(/^\/images\/[a-z0-9/_ .-]+\.(png|jpe?g|webp)$/i.test(source)&&!source.includes('..'))bytes=await readFile(path.join(process.cwd(),'public',source));
   const match=source.match(/^\/api\/catalogue\/images\/([a-f0-9-]{36})$/);
   if(match&&await row('catalogue-image',match[1]))bytes=await getAsset(`${match[1]}/result.webp`);
   if(bytes&&bytes.length<=5*1024*1024)result.push(await sharp(bytes,{limitInputPixels:24000000}).rotate().resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).png().toBuffer());
  }catch{/* An absent optional supplier reference must not replace the room. */}
 }
 return result;
}
