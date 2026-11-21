import type { FabricVariant as CatalogueVariant } from '../curtains/catalogue';

export type FabricVariant = CatalogueVariant;
export type Rect = { x:number; y:number; width:number; height:number };
export type CurtainLayer = {
  fold:string;
  mask:string;
  foldCrop:Rect;
};
export type Foreground = {width:number;height:number;outline:string};
/** Normalized image-space bounds, not CSS coordinates. */
export type FloorLengthDrape = {
  span:Rect;
  centerGap:number;
  pleatsPerPanel:number;
  foreground?:Foreground;
};
export type RenderCapability = {
  mode:'live-study'|'photo-reference'|'room-only'|'unavailable';
  comparison:boolean; download:boolean; reason?:string;
};
export type RoomScene = {
  id:string; name:string; version:string; status:'sample'|'missing';
  base?:string; thumbnail?:string; previewSupport?:'base-only'|'fitted'; previewNotice?:string;
  provisional?:boolean; width:number; height:number; provenance:string;
  window?:Rect;
  photo?:{after:string; mainMask?:{panels:string[];cutouts?:string[]}};
  drape?:FloorLengthDrape;
  construction?:{main:CurtainLayer;sheer:CurtainLayer}; shadow?:string; occlusion?:string;
  foreground?:Foreground;
};
export type FabricMaterial = {
  id:string; name:string; layer:'main'|'sheer'; fabricId?:string;
  catalogueSource:'demo'|'supplier'; texture?:string; thumbnail?:string; opacityMap?:string;
  patternTexture?:string;
  library?:boolean; opacity:number; sheen:number; textureStrength:number; repeat:number;
  colorMode:'tint'|'photographic'|'texture'; status:'sample'|'missing';
  surface?:'woven'|'patterned'|'velvet'|'silk';
};
export type LayerSelection = {enabled:boolean;materialId:string|null;fabricId:string|null;variantId?:string|null;previewColorId?:string};
export type VisualizerConfiguration = {
  version:1; assetVersion:string; rendererVersion?:string; sceneId:string;
  main:LayerSelection; sheer:LayerSelection;
  sheerColorMode?:'auto'|'manual';
  sheerOptOut?:true;
  photoCustomized?:true;
  inspiration?:{style:string;pattern:string;room:string};
};

// Capabilities are deliberately conservative: filenames alone cannot approve a room.
export function renderCapability(scene:RoomScene|undefined):RenderCapability {
  if(!scene?.base||scene.status==='missing')return {mode:'unavailable',comparison:false,download:false,reason:'This room is not available yet.'};
  if(scene.photo)return scene.photo.mainMask?.panels.length
   ?{mode:'live-study',comparison:true,download:true}
   :{mode:'photo-reference',comparison:true,download:true,reason:'This room shows the original photo pair. Fabric preview requires a matching curtain mask.'};
  if(scene.previewSupport==='base-only')return {mode:'room-only',comparison:false,download:false,reason:scene.previewNotice};
  if(scene.previewSupport==='fitted'&&scene.window&&scene.construction)return {mode:'live-study',comparison:true,download:true};
  return {mode:'room-only',comparison:false,download:false,reason:'Your fabric choices can be included in an enquiry. A curtain preview is not available in this room yet.'};
}
