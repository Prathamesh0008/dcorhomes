import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes, rendererVersion, type Rect } from './manifest';
import { resolveLayer, validateDesign, type VisualizerDesign } from './model';
import { renderCapability } from './types';
import { loadImage } from './image-cache';
import { clamp, linear, srgb, mirroredCoordinate, textileLuminance, clothLighting } from './sampling';
export { loadImage } from './image-cache';

const layerCache=new Map<string,HTMLCanvasElement>();
function surface(width:number,height:number){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('The curtain preview is unavailable in this browser.');
 return {canvas,context};
}
function pixels(image:HTMLImageElement,width:number,height:number){
 const {canvas,context}=surface(width,height);context.drawImage(image,0,0,width,height);
 const data=context.getImageData(0,0,width,height).data;canvas.width=0;return data;
}
function check(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Preview superseded','AbortError');}
function remember(key:string,canvas:HTMLCanvasElement){
 layerCache.set(key,canvas);
 let bytes=[...layerCache.values()].reduce((sum,item)=>sum+item.width*item.height*4,0);
 for(const [id,item] of layerCache){if(bytes<=24*1024*1024&&layerCache.size<=6)break;layerCache.delete(id);bytes-=item.width*item.height*4;}
}

async function renderLayer(design:VisualizerDesign,key:'main'|'sheer',records:FabricRecord[],width:number,height:number,signal?:AbortSignal){
 const {material,variant,hex}=resolveLayer(design[key],records),scene=scenes.find(s=>s.id===design.sceneId)!;
 const texturePath=material.colorMode==='tint'?material.texture:variant?.textureImage;
 if(!texturePath)throw Error('A preview for this fabric shade is not available yet.');
 const cacheKey=JSON.stringify([rendererVersion,scene.id,key,design[key],texturePath,width,height]);
 const cached=layerCache.get(cacheKey);
 if(cached){layerCache.delete(cacheKey);layerCache.set(cacheKey,cached);return cached;}
 const construction=scene.construction?.[key];
 if(!construction)throw Error('Your selected curtains cannot be previewed in this room yet.');
 const [maskImage,foldImage,textureImage,rightMask,rightFold,opacityImage]=await Promise.all([
  loadImage(construction.mask),loadImage(construction.fold),loadImage(texturePath),
  construction.rightMask?loadImage(construction.rightMask):null,
  construction.rightFold?loadImage(construction.rightFold):null,
  material.opacityMap?loadImage(material.opacityMap):null,
 ]);
 check(signal);
 const result=surface(width,height),rgb=[1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16)));
 const texture=pixels(textureImage,256,256),detail=textileLuminance(texture);
 const opacity=opacityImage?pixels(opacityImage,256,256):null;
 let mean=0;for(let i=0;i<texture.length;i+=4)mean+=(.2126*texture[i]+.7152*texture[i+1]+.0722*texture[i+2])/65536;
 const rectangles:Rect[]=key==='main'?scene.main!:[scene.sheer!];
 rectangles.forEach((rect,panel)=>{
  const w=Math.max(1,Math.round(rect.width*width)),h=Math.max(1,Math.round(rect.height*height));
  const mask=pixels(panel===1&&rightMask?rightMask:maskImage,w,h);
  const fold=pixels(panel===1&&rightFold?rightFold:foldImage,w,h);
  const local=surface(w,h),frame=local.context.createImageData(w,h),repeat=Math.max(12,material.repeat*width/1280);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sourceX=panel===1&&!rightMask?w-1-x:x,i=(y*w+x)*4,j=(y*w+sourceX)*4;
   // The prepared construction map is luminance, not opaque PNG alpha.
   const alpha=mask[j+(construction.maskEncoding==='alpha'?3:0)]/255;
   if(alpha<.008)continue;
   const light=fold[j]/255,left=fold[(y*w+Math.max(0,sourceX-2))*4]/255,right=fold[(y*w+Math.min(w-1,sourceX+2))*4]/255;
   const u=mirroredCoordinate(sourceX/repeat*256+(left-right)*36),v=mirroredCoordinate(y/repeat*256),t=(v*256+u)*4;
   const pattern=(.2126*texture[t]+.7152*texture[t+1]+.0722*texture[t+2])/Math.max(8,mean);
   const detailAmount=material.surface==='velvet'?.25:material.surface==='silk'?.2:.55;
   const weave=material.surface==='patterned'?clamp(1+(pattern-1)*.75,.5,1.5):1+(detail[v*256+u]-1)*(material.library?detailAmount:material.textureStrength);
   const lighting=clothLighting(light,material.sheen);
   for(let c=0;c<3;c++){
    const color=material.colorMode==='photographic'?linear(texture[t+c]):rgb[c];
    frame.data[i+c]=srgb(clamp(color*lighting*weave));
   }
   // Fabric transmission and the neutral drape's fold density vary independently.
   frame.data[i+3]=Math.round(255*alpha*material.opacity*(opacity?opacity[t]/255:1)*(key==='sheer'?.78+.22*(1-light):1));
  }
  local.context.putImageData(frame,0,0);result.context.drawImage(local.canvas,Math.round(rect.x*width),Math.round(rect.y*height));local.canvas.width=0;
 });
 check(signal);remember(cacheKey,result.canvas);return result.canvas;
}

export async function composeDesign(design:VisualizerDesign,records:FabricRecord[],width=960,signal?:AbortSignal){
 const clean=validateDesign(design,records),scene=scenes.find(s=>s.id===clean.sceneId)!,capability=renderCapability(scene);
 if(capability.mode!=='live-study')throw Error(capability.reason||'A curtain preview is not available in this room yet.');
 check(signal);width=Math.max(360,Math.min(1600,Math.round(width)));
 const height=Math.round(width*scene.height/scene.width);
 const [base,sheer,main,shadow,occlusion]=await Promise.all([
  loadImage(scene.base!),clean.sheer.enabled?renderLayer(clean,'sheer',records,width,height,signal):null,
  clean.main.enabled?renderLayer(clean,'main',records,width,height,signal):null,
  scene.shadow?loadImage(scene.shadow):null,scene.occlusion?loadImage(scene.occlusion):null,
 ]);
 check(signal);const result=surface(width,height);result.context.drawImage(base,0,0,width,height);
 if(scene.mount&&(clean.main.enabled||clean.sheer.enabled)){
  result.context.strokeStyle='#6d665b';result.context.lineWidth=Math.max(1,width*.0018);result.context.beginPath();
  result.context.moveTo(scene.mount.x*width,scene.mount.y*height);result.context.lineTo((scene.mount.x+scene.mount.width)*width,scene.mount.y*height);result.context.stroke();
 }
 if(sheer)result.context.drawImage(sheer,0,0);if(main)result.context.drawImage(main,0,0);
 if(shadow)result.context.drawImage(shadow,0,0,width,height);if(occlusion)result.context.drawImage(occlusion,0,0,width,height);
 return result.canvas;
}
export async function exportDesign(design:VisualizerDesign,records:FabricRecord[]){
 const canvas=await composeDesign(design,records,1600);
 return new Promise<Blob>((resolve,reject)=>{try{canvas.toBlob(blob=>{canvas.width=0;blob?resolve(blob):reject(Error('Your design could not be exported. Please try again.'));},'image/png');}catch{canvas.width=0;reject(Error('Your design could not be exported. Please try again.'));}});
}
