import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes, type Rect } from './manifest';
import { resolveLayer, validateDesign, type VisualizerDesign } from './model';

const images=new Map<string,Promise<HTMLImageElement>>();
export function loadImage(src:string):Promise<HTMLImageElement>{
 if(!src.startsWith('/')||src.startsWith('//'))return Promise.reject(Error('Preview images must be hosted on this site.'));
 const existing=images.get(src);if(existing)return existing;
 const promise=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>image.decode().then(()=>resolve(image)).catch(()=>reject(Error('Could not decode a preview image.')));image.onerror=()=>{images.delete(src);reject(Error('A preview image is missing. Please try another selection.'));};image.src=src;});
 images.set(src,promise);if(images.size>16)images.delete(images.keys().next().value!);return promise;
}
function surface(width:number,height:number){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Your browser does not support the curtain preview.');return {canvas,context};}
function pixels(image:HTMLImageElement,width:number,height:number){const {context}=surface(width,height);context.drawImage(image,0,0,width,height);return context.getImageData(0,0,width,height).data;}
const layerCache=new Map<string,HTMLCanvasElement>();
const linear=(value:number)=>{const n=value/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);};
const srgb=(value:number)=>Math.round(255*(value<=.0031308?12.92*value:1.055*Math.pow(value,1/2.4)-.055));
async function renderLayer(design:VisualizerDesign,key:'main'|'sheer',records:FabricRecord[],width:number,height:number){
 const selection=design[key],resolved=resolveLayer(selection,records),scene=scenes.find(s=>s.id===design.sceneId)!;
 const {material,variant,hex}=resolved;
 const texturePath=material.colorMode==='photographic'?variant?.textureImage:material.texture;
 if(!texturePath)throw Error('The selected material needs a photographic texture map.');
 const cacheKey=JSON.stringify([design.assetVersion,design.sceneId,key,selection,texturePath,width,height]);
 if(layerCache.has(cacheKey))return layerCache.get(cacheKey)!;
 const construction=scene.construction?.[key];if(!construction)throw Error('This room needs prepared curtain masks and fold maps.');
 const [maskImage,foldImage,textureImage,rightMask,rightFold]=await Promise.all([loadImage(construction.mask),loadImage(construction.fold),loadImage(texturePath),construction.rightMask?loadImage(construction.rightMask):null,construction.rightFold?loadImage(construction.rightFold):null]);
 const result=surface(width,height),rgb=[1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16))),texture=pixels(textureImage,256,256);
 let mean=0;for(let i=0;i<texture.length;i+=4)mean+=texture[i]/255;mean/=65536;
 const rectangles=key==='main'?scene.main!:[scene.sheer!];
 rectangles.forEach((rect:Rect,panel:number)=>{
  const w=Math.max(1,Math.round(rect.width*width)),h=Math.max(1,Math.round(rect.height*height)),mask=pixels(panel===1&&rightMask?rightMask:maskImage,w,h),fold=pixels(panel===1&&rightFold?rightFold:foldImage,w,h),local=surface(w,h),frame=local.context.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sourceX=panel===1&&!rightMask?w-1-x:x,i=(y*w+x)*4,j=(y*w+sourceX)*4,alpha=mask[j]/255;if(alpha<.02)continue;
   const light=fold[j]/255;
   // Tile the textile through fold-dependent UV displacement instead of stretching a swatch into a panel.
   const repeat=Math.max(12,material.repeat*width/1280),u=((Math.floor(sourceX/repeat*256+(light-.5)*18)%256)+256)%256,v=Math.floor(y/repeat*256)%256,t=(v*256+u)*4;
   const weave=1+((texture[t]/255)/Math.max(.08,mean)-1)*material.textureStrength;
   for(let c=0;c<3;c++){
    const base=material.colorMode==='photographic'?linear(texture[t+c]):rgb[c];
    const value=base*(.25+.75*light)*weave+material.sheen*Math.pow(Math.max(0,(light-.68)/.32),3)*.3;
    frame.data[i+c]=srgb(Math.min(1,Math.max(0,value)));
   }
   frame.data[i+3]=Math.round(255*alpha*material.opacity*(key==='sheer'?.72+.28*(1-light):1));
  }
  local.context.putImageData(frame,0,0);result.context.drawImage(local.canvas,Math.round(rect.x*width),Math.round(rect.y*height));
 });
 layerCache.set(cacheKey,result.canvas);if(layerCache.size>4)layerCache.delete(layerCache.keys().next().value!);return result.canvas;
}
export async function composeDesign(design:VisualizerDesign,records:FabricRecord[],width=960){
 const clean=validateDesign(design,records),scene=scenes.find(s=>s.id===clean.sceneId)!;
 if(!scene.base||!scene.main||!scene.sheer)throw Error('This room needs aligned curtain assets.');
 width=Math.max(360,Math.min(1600,Math.round(width)));const height=Math.round(width*scene.height/scene.width);
 const [base,sheer,main,shadow,occlusion]=await Promise.all([loadImage(scene.base),clean.sheer.enabled?renderLayer(clean,'sheer',records,width,height):null,clean.main.enabled?renderLayer(clean,'main',records,width,height):null,scene.shadow?loadImage(scene.shadow):null,scene.occlusion?loadImage(scene.occlusion):null]);
 const result=surface(width,height);result.context.drawImage(base,0,0,width,height);
 if(scene.mount&&(clean.main.enabled||clean.sheer.enabled)){result.context.save();result.context.strokeStyle='#6d665b';result.context.lineWidth=Math.max(1,width*.0018);result.context.beginPath();result.context.moveTo(scene.mount.x*width,(scene.mount.y-.002)*height);result.context.lineTo((scene.mount.x+scene.mount.width)*width,(scene.mount.y-.002)*height);result.context.stroke();result.context.restore();}
 if(sheer)result.context.drawImage(sheer,0,0);if(main)result.context.drawImage(main,0,0);
 if(shadow)result.context.drawImage(shadow,0,0,width,height);if(occlusion)result.context.drawImage(occlusion,0,0,width,height);
 return result.canvas;
}
export async function exportDesign(design:VisualizerDesign,records:FabricRecord[]){
 const canvas=await composeDesign(design,records,1600);
 return new Promise<Blob>((resolve,reject)=>{try{canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Your design could not be exported. Please retry.')),'image/png');}catch{reject(Error('Preview images could not be exported. Please contact us for help.'));}});
}
