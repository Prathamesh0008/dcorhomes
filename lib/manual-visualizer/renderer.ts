import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes, rendererVersion, constructions, type Scene, type ConstructionAssets } from './manifest';
import { mainPreviewSelection, resolveLayer, validateDesign, type VisualizerDesign } from './model';
import { renderCapability, type Rect } from './types';
import { drapePanels, resolveFloorLengthDrape } from './floor-length-layouts';
import { loadImage } from './image-cache';
import { heroMaskSize } from './hero-curtain-masks';
import { heroSheerMasks } from './hero-sheer-masks';
import { clamp, linear, srgb, mirroredCoordinate, textileLuminance, clothLighting } from './sampling';
export { loadImage } from './image-cache';

const layerCache=new Map<string,HTMLCanvasElement>();
const linearChannel=Array.from({length:256},(_,channel)=>linear(channel));
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
function drapePixels(image:HTMLImageElement,{foldCrop}:ConstructionAssets,width:number,height:number,mirror:boolean){
 const {canvas,context}=surface(width,height);
 const {x,y,width:sourceWidth,height:sourceHeight}=foldCrop;
 if(mirror)context.setTransform(-1,0,0,1,width,0);
 context.drawImage(image,x,y,sourceWidth,sourceHeight,0,0,width,height);
 const data=context.getImageData(0,0,width,height).data;
 canvas.width=0;
 return data;
}
function check(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Preview superseded','AbortError');}
function remember(key:string,canvas:HTMLCanvasElement){
 layerCache.set(key,canvas);
 let bytes=[...layerCache.values()].reduce((sum,item)=>sum+item.width*item.height*4,0);
 for(const [id,item] of layerCache){if(bytes<=24*1024*1024&&layerCache.size<=6)break;layerCache.delete(id);bytes-=item.width*item.height*4;}
}

function layerRequest(selection:VisualizerDesign['main'],key:'main'|'sheer',records:FabricRecord[],scene:Scene,width:number,height:number){
 const {material,variant,hex}=resolveLayer(selection,records);
 const texturePath=material.colorMode==='tint'?material.texture:variant?.textureImage;
 if(!texturePath)throw Error('A preview for this fabric shade is not available yet.');
 const construction=scene.construction?.[key],window=scene.window;
 if(!construction||!window)throw Error('Your selected curtains cannot be previewed in this room yet.');
 const drape=resolveFloorLengthDrape(scene);
 const regions=drapePanels(drape??{span:window,centerGap:.17},key);
 const cacheKey=JSON.stringify([rendererVersion,scene.id,key,material,hex,texturePath,construction,regions,width,height]);
 return {key,material,hex,texturePath,construction,regions,cacheKey,width,height};
}

type LayerRequest=ReturnType<typeof layerRequest>&{backlit?:true};
function cachedLayer(cacheKey:string){
 const cached=layerCache.get(cacheKey);
 if(cached){layerCache.delete(cacheKey);layerCache.set(cacheKey,cached);}
 return cached;
}

function regionPixels(region:Rect,width:number,height:number){
 const x0=Math.max(0,Math.min(width-1,Math.round(region.x*width)));
 const y0=Math.max(0,Math.min(height-1,Math.round(region.y*height)));
 const x1=Math.min(width,Math.max(x0+1,Math.round((region.x+region.width)*width)));
 const y1=Math.min(height,Math.max(y0+1,Math.round((region.y+region.height)*height)));
 return {x0,y0,w:x1-x0,h:y1-y0};
}

async function renderLayer(request:LayerRequest,signal?:AbortSignal){
 const {key,material,hex,texturePath,construction,regions,cacheKey,width,height,backlit}=request;
 const cached=cachedLayer(cacheKey);
 if(cached)return cached;
 const [foldImage,maskImage,textureImage,opacityImage]=await Promise.all([
  loadImage(construction.fold),loadImage(construction.mask),loadImage(texturePath),
  material.opacityMap?loadImage(material.opacityMap):null,
 ]);
 check(signal);
 const result=surface(width,height),tinted=material.colorMode==='tint',rgb=[1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16)));
 const texture=pixels(textureImage,256,256),detail=tinted?textileLuminance(texture):null;
 const opacity=opacityImage?pixels(opacityImage,256,256):null;
 let mean=0;if(tinted&&material.surface==='patterned')for(let i=0;i<texture.length;i+=4)mean+=(.2126*texture[i]+.7152*texture[i+1]+.0722*texture[i+2])/65536;
 const repeat=Math.max(12,material.repeat*width/1280);
 try{
  for(const [index,region] of regions.entries()){
   check(signal);
   const {x0,y0,w,h}=regionPixels(region,width,height);
   const fold=drapePixels(foldImage,construction,w,h,index===1);
   const mask=drapePixels(maskImage,construction,w,h,index===1);
   const frame=result.context.createImageData(w,h);
   // Use the same material texture repeat at every panel width.
   for(let y=0;y<h;y++){
    if((y&31)===0)check(signal);
    for(let x=0;x<w;x++){
     const i=(y*w+x)*4,lx=Math.max(0,x-2),rx=Math.min(w-1,x+2);
     const alpha=mask[i]/255;
     if(!alpha)continue;
     const light=fold[i]/255;
     const left=fold[(y*w+lx)*4]/255;
     const right=fold[(y*w+rx)*4]/255;
     const u=mirroredCoordinate(x/repeat*256+(left-right)*36),v=mirroredCoordinate(y/repeat*256),t=(v*256+u)*4;
     const weave=detail?material.surface==='patterned'
      ?clamp(1+((.2126*texture[t]+.7152*texture[t+1]+.0722*texture[t+2])/Math.max(8,mean)-1)*.75,.5,1.5)
      :1+(detail[v*256+u]-1)*material.textureStrength:1;
     // The photographed fold map has a narrow luminance range in the body
     // of the voile. Expand it for backlighting while keeping the fabric tint.
     const foldContrast=backlit?clamp((light-.75)/.20):0;
     const lighting=(backlit ? .70+.36*foldContrast : clothLighting(light,material.sheen))*weave;
     for(let c=0;c<3;c++){
      const color=tinted?rgb[c]:linearChannel[texture[t+c]];
      frame.data[i+c]=srgb(clamp(color*lighting));
     }
     const density=opacity?opacity[t]/255:1;
     const diffuseCoverage=density*(2-density);
     // Keep transmission even through the densest folds and retain soft mask edges.
     const coverage=backlit ? Math.min(.74,diffuseCoverage*(1.06+.43*foldContrast))
      : key==='sheer' ? diffuseCoverage*(.78+.22*(1-light)) : density;
     const maskStrength=backlit?Math.pow(alpha,.8):alpha;
     frame.data[i+3]=Math.round(255*clamp(material.opacity*coverage*maskStrength));
    }
   }
   result.context.putImageData(frame,x0,y0);
  }
  check(signal);remember(cacheKey,result.canvas);return result.canvas;
 }catch(error){result.canvas.width=0;throw error;}
}

function designRequest(design:VisualizerDesign,records:FabricRecord[],width:number){
 const clean=validateDesign(design,records),scene=scenes.find(s=>s.id===clean.sceneId)!,capability=renderCapability(scene);
 if(capability.mode!=='live-study')throw Error(capability.reason||'A curtain preview is not available in this room yet.');
 width=Math.max(1,Math.min(scene.width,Math.round(width)));
 const height=Math.round(width*scene.height/scene.width);
 const sheer=clean.sheer.enabled?layerRequest(clean.sheer,'sheer',records,scene,width,height):null;
 const mainSelection=mainPreviewSelection(clean.main);
 const main=mainSelection?layerRequest(mainSelection,'main',records,scene,width,height):null;
 return {scene,width,height,sheer,main};
}

type DesignRequest=ReturnType<typeof designRequest>;
function paint({scene,width,height}:DesignRequest,base:HTMLImageElement,sheer:HTMLCanvasElement|null,main:HTMLCanvasElement|null,shadow:HTMLImageElement|null,occlusion:HTMLImageElement|null){
 const result=surface(width,height);result.context.drawImage(base,0,0,width,height);
 if(sheer)result.context.drawImage(sheer,0,0);if(main)result.context.drawImage(main,0,0);
 if(main||sheer){
  if(shadow)result.context.drawImage(shadow,0,0,width,height);
  if(occlusion)result.context.drawImage(occlusion,0,0,width,height);
  const foreground=resolveFloorLengthDrape(scene)?.foreground??scene.foreground;
  if(foreground){
   const {context}=result;
   context.save();
   context.scale(width/foreground.width,height/foreground.height);
   context.clip(new Path2D(foreground.outline));
   context.setTransform(1,0,0,1,0,0);
   context.drawImage(base,0,0,width,height);
   context.restore();
  }
 }
 return result.canvas;
}

async function compose(request:DesignRequest,signal?:AbortSignal){
 check(signal);
 const {scene,sheer,main}=request;
 const [base,sheerImage,mainImage,shadow,occlusion]=await Promise.all([
  loadImage(scene.base!),sheer?renderLayer(sheer,signal):null,main?renderLayer(main,signal):null,
  scene.shadow?loadImage(scene.shadow):null,scene.occlusion?loadImage(scene.occlusion):null,
 ]);
 check(signal);return paint(request,base,sheerImage,mainImage,shadow,occlusion);
}

const goldenVoile={
 enabled:true,materialId:'library-sheer-plain-voile',fabricId:'library-sheer-plain-voile',variantId:'champagne',
};

async function photoWithVoile(scene:Scene,room:HTMLImageElement,width:number,height:number,signal?:AbortSignal){
 const mask=heroSheerMasks[scene.id];
 if(!mask)return null;
 const cacheKey=JSON.stringify([scene.id,goldenVoile.variantId,'sheer-background',width,height]);
 const cached=cachedLayer(cacheKey);
 if(cached)return cached;

 const {material,variant,hex}=resolveLayer(goldenVoile,[]);
 const openings=new Path2D();
 const regions=mask.openings.map(points=>{
  const xs=points.map(([x])=>x),ys=points.map(([,y])=>y),left=Math.min(...xs),top=Math.min(...ys);
  const [first,...remaining]=points;
  openings.moveTo(...first);
  for(const point of remaining)openings.lineTo(...point);
  openings.closePath();
  return {x:left/heroMaskSize.width,y:top/heroMaskSize.height,
   width:(Math.max(...xs)-left)/heroMaskSize.width,height:(Math.max(...ys)-top)/heroMaskSize.height};
 });
 const voile=await renderLayer({
  key:'sheer',material,hex,texturePath:variant!.textureImage!,construction:constructions.sheer,
  regions,cacheKey:cacheKey+'-voile',width,height,backlit:true,
 },signal);
 check(signal);
 const {canvas,context}=surface(width,height);
 context.drawImage(room,0,0,width,height);
 const drawInside=(path:Path2D,image:CanvasImageSource)=>{
  context.save();
  context.scale(width/heroMaskSize.width,height/heroMaskSize.height);
  context.clip(path);
  context.setTransform(1,0,0,1,0,0);
  context.drawImage(image,0,0,width,height);
  context.restore();
 };
 drawInside(openings,voile);
 if(mask.foreground)drawInside(new Path2D(mask.foreground.join(' ')),room);
 remember(cacheKey,canvas);
 return canvas;
}

async function composePhoto(design:VisualizerDesign,records:FabricRecord[],scene:Scene,width:number,signal?:AbortSignal){
 const photo=scene.photo!;
 const main=mainPreviewSelection(design.main);
 const mask=main?photo.mainMask:undefined;
 const choice=mask&&main?resolveLayer(main,records):null;
 const texturePath=choice?.material.colorMode==='tint'?choice.material.texture:choice?.variant?.textureImage;
 const w=Math.max(1,Math.min(scene.width,Math.round(width))),h=Math.round(w*scene.height/scene.width);
 const [original,after,texture]=await Promise.all([
  loadImage(scene.base!).then(async room=>{
   if(room.naturalWidth!==scene.width||room.naturalHeight!==scene.height){
    throw Error('The room photographs no longer match the registered curtain geometry.');
   }
   return choice ? (await photoWithVoile(scene,room,w,h,signal))??room : room;
  }),
  choice?loadImage(photo.after):null,
  texturePath?loadImage(texturePath):null,
 ]);
 check(signal);
 if(after&&(after.naturalWidth!==scene.width||after.naturalHeight!==scene.height)){
  throw Error('The room photographs no longer match the registered curtain geometry.');
 }
 const result=surface(w,h);
 result.context.drawImage(original,0,0,w,h);
 if(!mask||!choice||!after)return result.canvas;

 const stencil=surface(w,h);
 stencil.context.scale(w/heroMaskSize.width,h/heroMaskSize.height);
 for(const panel of mask.panels)stencil.context.fill(new Path2D(panel));
 stencil.context.globalCompositeOperation='destination-out';
 for(const cutout of mask.cutouts||[])stencil.context.fill(new Path2D(cutout));
 const alpha=stencil.context.getImageData(0,0,w,h).data;
 stencil.canvas.width=0;

 const frame=result.context.getImageData(0,0,w,h),colors=frame.data;
 const folds=pixels(after,w,h);
 const luminance=(i:number)=>.2126*linearChannel[folds[i]]+.7152*linearChannel[folds[i+1]]+.0722*linearChannel[folds[i+2]];
 let total=0,count=0;
 for(let i=0;i<colors.length;i+=4){
  if(alpha[i+3]!==255)continue;
  total+=luminance(i);
  count++;
 }
 if(!count)return result.canvas;
 const reference=Math.max(.003,total/count);
 const rgb=[1,3,5].map(i=>linear(parseInt(choice.hex.slice(i,i+2),16)));
 const weave=texture?textileLuminance(pixels(texture,256,256)):null;
 const repeat=Math.max(12,choice.material.repeat*w/1280);
 const strength=choice.material.surface==='patterned'?.32:.16;
 for(let y=0;y<h;y++){
  if((y&31)===0)check(signal);
  const row=mirroredCoordinate(y/repeat*256)*256;
  for(let x=0;x<w;x++){
   const i=(y*w+x)*4,coverage=alpha[i+3]/255;
   if(!coverage)continue;
   const detail=weave?1+(weave[row+mirroredCoordinate(x/repeat*256)]-1)*strength:1;
   // Use the photographed luminance for folds and highlights. The textile
   // sample supplies fine detail and the selected shade supplies the colour.
   const light=clamp(Math.pow(luminance(i)/reference,.58),.13,2.25)*detail;
   for(let c=0;c<3;c++){
    const tinted=srgb(clamp(rgb[c]*light));
    colors[i+c]+=(tinted-colors[i+c])*coverage;
   }
  }
 }
 result.context.putImageData(frame,0,0);
 return result.canvas;
}

export async function composeDesign(design:VisualizerDesign,records:FabricRecord[],width=960,signal?:AbortSignal){
 const scene=scenes.find(scene=>scene.id===design.sceneId);
 if(scene?.photo)return composePhoto(validateDesign(design,records),records,scene,width,signal);
 return compose(designRequest(design,records,width),signal);
}
export async function exportDesign(design:VisualizerDesign,records:FabricRecord[]){
 const canvas=await composeDesign(design,records,scenes.find(scene=>scene.id===design.sceneId)?.width);
 return new Promise<Blob>((resolve,reject)=>{try{canvas.toBlob(blob=>{canvas.width=0;blob?resolve(blob):reject(Error('Your design could not be exported. Please try again.'));},'image/png');}catch{canvas.width=0;reject(Error('Your design could not be exported. Please try again.'));}});
}
