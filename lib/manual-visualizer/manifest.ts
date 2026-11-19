import { libraryMaterials, libraryScenes } from './library';
import { heroComparisonSlides } from '../hero-comparisons';
import { heroCurtainMasks } from './hero-curtain-masks';
import type { RoomScene, FabricMaterial } from './types';
export type { Rect, CurtainLayer as ConstructionAssets, RoomScene as Scene, FabricMaterial as Material } from './types';
export const rendererVersion='atelier-2';
export const assetVersion='manual-v1';
const root='/images/manual-visualizer/v1';
// Crop excess transparent padding from the prepared photographic fold and
// alpha maps together. The alpha retains the photographed heading and hem.
const constructions:NonNullable<RoomScene['construction']>={
 main:{fold:root+'/constructions/main-fold.webp',mask:root+'/constructions/main-mask.png',foldCrop:{x:113,y:4,width:282,height:908}},
 sheer:{fold:root+'/constructions/sheer-fold.webp',mask:root+'/constructions/sheer-mask.png',foldCrop:{x:42,y:4,width:838,height:778}},
};

function windowDrape(left:number,top:number,right:number,bottom:number,outline:string):Partial<RoomScene>{
 return {
  previewSupport:'fitted',
  previewNotice:undefined,
  provenance:'Curtain-free architectural study with window-length drapes fitted to the recess.',
  window:{x:left/1024,y:top/640,width:(right-left)/1024,height:(bottom-top)/640},
  construction:constructions,
  foreground:{width:1024,height:640,outline},
 };
}

// These two clean bases have straight-on window recesses. Trace foreground
// silhouettes in the same coordinate space as the measured window geometry.
const liveLibraryRooms:Partial<Record<string,Partial<RoomScene>>>={
 'room-01':windowDrape(234,105,826,416,
  'M 216 352 Q 220 361 220 371 L 278 373 Q 286 372 287 382 L 287 406 Q 321 398 357 404 L 375 410 L 397 414 L 406 432 H 216 Z '+
  'M 365 408 L 376 394 L 386 392 L 391 378 L 402 375 L 409 368 L 417 374 L 424 365 L 437 367 L 445 372 L 461 371 L 467 380 L 480 378 L 489 389 L 498 394 L 489 414 L 474 435 H 365 Z '+
  'M 741 402 Q 749 399 756 399 L 759 390 L 769 387 L 773 380 L 788 381 L 791 395 Q 820 381 848 380 L 849 435 H 741 Z'),
 'room-09':windowDrape(267,116,828,425,
  'M 246 360 L 250 371 H 279 Q 291 370 293 381 L 293 416 Q 322 408 349 411 L 370 415 L 380 434 H 248 Z '+
  'M 350 419 L 360 407 L 358 401 L 369 392 L 381 392 L 383 384 L 391 390 L 400 378 L 413 381 L 416 375 L 426 385 L 435 386 L 437 398 L 433 420 L 426 440 H 353 Z '+
  'M 624 431 Q 633 423 635 415 Q 640 382 702 371 Q 739 364 779 370 Q 790 372 789 385 L 786 402 L 794 394 L 804 394 L 813 410 L 825 415 L 828 432 Z'),
};
export const studioPhotoScenes:RoomScene[]=heroComparisonSlides.map(slide=>({
 id:slide.id,
 name:slide.roomName||slide.label||slide.alt,
 version:assetVersion,
 status:'sample',
 base:slide.beforeSrc,
 thumbnail:slide.afterSrc.replace(/\.webp$/,'-640.webp'),
 // Verified against both originals in the asset check.
 width:1448,
 height:1086,
 provenance:'Original homepage curtain concept pair',
 photo:{after:slide.afterSrc,mainMask:heroCurtainMasks[slide.id]},
}));
export const scenes:RoomScene[]=[
 ...studioPhotoScenes,
 ...libraryScenes.map(scene=>({...scene,...liveLibraryRooms[scene.id]})),
 {id:'garden-living',name:'Garden living room',version:assetVersion,status:'sample',previewSupport:'fitted',base:root+'/rooms/garden-living/base.webp',width:1280,height:960,provenance:'Existing generated architectural sample; scripts/manual-base-sources.json. Not a photographed customer interior.',window:{x:228/1280,y:94/960,width:826/1280,height:574/960},construction:constructions},
 ...[
  ['master-bedroom','Master bedroom · full-height window'],['dining','Contemporary dining · tall windows'],['panoramic-living','Luxury living · panoramic window'],['compact-apartment','Compact apartment · small window'],['premium-hall','Premium hall · multiple windows'],['guest-bedroom','Guest bedroom · standard window'],['home-office','Home office · wide window'],['arched-living','Classic living · arched window'],['balcony-bedroom','Minimal bedroom · balcony doors'],
 ].map(([id,name] ):RoomScene=>({id,name,version:assetVersion,status:'missing',width:0,height:0,provenance:'Curtain-free photograph, measured geometry and aligned construction assets required.'})),
];
const material=(id:string,name:string,layer:'main'|'sheer',fabricId?:string,properties:Partial<FabricMaterial>={}):FabricMaterial=>({id,name,layer,fabricId,catalogueSource:'demo',status:fabricId?'sample':'missing',texture:fabricId?root+'/materials/'+id+'.webp':undefined,thumbnail:fabricId?'/images/fabrics/'+fabricId+'/texture-reference.webp':undefined,opacity:layer==='sheer'?.38:1,sheen:0,textureStrength:.18,repeat:96,colorMode:'tint',...properties});
export const materials:FabricMaterial[]=[
 ...libraryMaterials,
 material('linen','Linen','main','sienna',{textureStrength:.32}),material('cotton','Cotton','main'),material('cotton-linen','Cotton–linen blend','main'),material('velvet','Velvet','main','clay',{sheen:.13,textureStrength:.15,repeat:140}),material('silk','Silk satin study','main','silk-satin-study',{sheen:.26,textureStrength:.1,repeat:160}),material('silk-blend','Silk blend','main'),material('faux-silk','Faux silk','main'),material('jacquard','Jacquard','main'),material('chenille','Chenille','main'),material('textured-weave','Textured weave','main','olive',{textureStrength:.36,repeat:72}),
 material('plain-voile','Plain voile study','sheer','solstice',{opacity:.32,textureStrength:.15}),material('fine-voile','Fine voile study','sheer','pearl',{opacity:.24,textureStrength:.1,repeat:120}),material('linen-sheer','Linen sheer','sheer'),material('cotton-sheer','Cotton sheer','sheer'),material('organza','Organza','sheer'),material('embroidered-sheer','Embroidered sheer','sheer'),material('net-sheer','Net sheer','sheer'),material('textured-sheer','Textured sheer','sheer'),material('striped-sheer','Striped sheer','sheer'),material('jacquard-sheer','Jacquard sheer','sheer'),
];
// A separate illustrative palette; these IDs are never supplier variant IDs.
export const demoColors=[['ivory','Ivory','#e9dfca'],['white','Soft white','#f5f2e9'],['champagne','Champagne','#d6c097'],['sand','Sand','#c5ad8c'],['taupe','Taupe','#9c8d7a'],['olive','Olive','#68704d'],['sage','Sage','#a0ad94'],['navy','Navy','#253c58'],['rose','Dusty rose','#b97e86'],['burgundy','Burgundy','#79263c'],['charcoal','Charcoal','#454747'],['emerald','Emerald','#146b4b']].map(([id,name,hex])=>({id:'preview-'+id,name,hex}));
