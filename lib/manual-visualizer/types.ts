import type { FabricVariant as CatalogueVariant } from '../curtains/catalogue';

export type FabricVariant = CatalogueVariant;
export type Rect = { x:number; y:number; width:number; height:number };
export type CurtainLayer = {
  mask:string; fold:string; rightMask?:string; rightFold?:string;
  coordinateSpace?:'panel'; maskEncoding?:'luminance'|'alpha';
};
export type RenderCapability = {
  mode:'live-study'|'room-only'|'unavailable';
  comparison:boolean; download:boolean; reason?:string;
};
export type RoomScene = {
  id:string; name:string; version:string; status:'sample'|'missing';
  base?:string; thumbnail?:string; previewSupport?:'base-only'; previewNotice?:string;
  provisional?:boolean; width:number; height:number; provenance:string;
  window?:Rect; mount?:{x:number;y:number;width:number}; sheer?:Rect; main?:[Rect,Rect];
  construction?:{main:CurtainLayer;sheer:CurtainLayer}; shadow?:string; occlusion?:string;
};
export type FabricMaterial = {
  id:string; name:string; layer:'main'|'sheer'; fabricId?:string;
  catalogueSource:'demo'|'supplier'; texture?:string; thumbnail?:string; opacityMap?:string;
  library?:boolean; opacity:number; sheen:number; textureStrength:number; repeat:number;
  colorMode:'tint'|'photographic'|'texture'; status:'sample'|'missing';
  surface?:'woven'|'patterned'|'velvet'|'silk';
};
export type LayerSelection = {enabled:boolean;materialId:string;fabricId:string;variantId?:string;previewColorId?:string};
export type VisualizerConfiguration = {
  version:1; assetVersion:string; rendererVersion?:string; sceneId:string;
  main:LayerSelection; sheer:LayerSelection;
  inspiration?:{style:string;pattern:string;room:string};
};

// Capabilities are deliberately conservative: filenames alone cannot approve a room.
export function renderCapability(scene:RoomScene|undefined):RenderCapability {
  if(!scene?.base||scene.status==='missing')return {mode:'unavailable',comparison:false,download:false,reason:'This room is not available yet.'};
  if(scene.previewSupport==='base-only')return {mode:'room-only',comparison:false,download:false,reason:scene.previewNotice};
  if(scene.id==='garden-living'&&scene.main&&scene.sheer&&scene.construction)return {mode:'live-study',comparison:true,download:true};
  return {mode:'room-only',comparison:false,download:false,reason:'Your fabric choices can be included in an enquiry. A curtain preview is not available in this room yet.'};
}
