import type { FabricRecord } from './catalogue';
export type FabricImage = {src:string;kind:string;mode:'photograph'|'digital'|'reference'};
export function resolveFabricImages(fabric:FabricRecord,variantId:string): FabricImage[] {
 const variant=fabric.colors.find(v=>v.id===variantId&&v.active!==false);
 if(!variant)return [];
 const actual=[variant.mainImage,variant.drapedImage,variant.textureImage,...(variant.images||[]),variant.swatchImage].filter((src):src is string=>Boolean(src));
 if(actual.length)return [...new Set(actual)].map(src=>({src,kind:'Selected shade photograph',mode:'photograph'}));
 const digital=[variant.digitalPreviewImage,...(variant.digitalPreviewImages||[])].filter((src):src is string=>Boolean(src));
 if(digital.length)return [...new Set(digital)].map((src,i)=>({src,kind:i===0?'Digital color preview':'Digital texture close-up',mode:'digital'}));
 // A missing variant visualization is explicit; never silently use another shade.
 return fabric.images.map(src=>({src,kind:'Fabric reference; selected shade photograph unavailable',mode:'reference'}));
}
export function variantSwatch(fabric:FabricRecord,id:string){const v=fabric.colors.find(v=>v.id===id);return v?.swatchImage||v?.digitalSwatchImage;}
