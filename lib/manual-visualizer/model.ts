import type { FabricRecord } from '@/lib/curtains/catalogue';
import type { ManualConfig } from '@/lib/curtains/manual-config';
import { assetVersion, rendererVersion, demoColors, materials, scenes, type Material } from './manifest';
import { visualizerFabric } from './library';
import type { LayerSelection, VisualizerConfiguration } from './types';
export type { LayerSelection } from './types';
export type VisualizerDesign = VisualizerConfiguration;
export const defaultDesign:VisualizerDesign={version:1,assetVersion,rendererVersion,sceneId:'garden-living',main:{enabled:true,materialId:'library-main-pure-linen',fabricId:'library-main-pure-linen',variantId:'olive-green'},sheer:{enabled:true,materialId:'library-sheer-plain-voile',fabricId:'library-sheer-plain-voile',variantId:'soft-ivory'}};
export function availableMaterial(material:Material,records:FabricRecord[]){const f=visualizerFabric(material.fabricId,records);return material.status==='sample'&&Boolean(material.texture)&&Boolean(f&&f.source===material.catalogueSource&&f.active!==false&&(material.colorMode!=='tint'||!f.pattern||['plain','solid'].includes(f.pattern.toLowerCase()))&&f.colors.some(v=>v.active!==false&&v.available!==false));}
export function resolveLayer(layer:LayerSelection,records:FabricRecord[]){
 const material=materials.find(m=>m.id===layer.materialId),fabric=visualizerFabric(layer.fabricId,records);
 if(!material||!fabric||fabric.active===false||material.fabricId!==fabric.id||!availableMaterial(material,records))throw Error('This material needs compatible preview assets.');
 const variant=layer.variantId?fabric.colors.find(v=>v.id===layer.variantId&&v.active!==false&&v.available!==false):undefined;
 const preview=layer.previewColorId?demoColors.find(c=>c.id===layer.previewColorId):undefined;
 if((Boolean(variant)===Boolean(preview))||(layer.variantId&&!variant)||(layer.previewColorId&&!preview))throw Error('Choose an available shade or a preview colour.');
 const hex=preview?.hex||variant?.hexPreview;
 if(material.colorMode!=='tint'&&(!variant?.textureImage||preview))throw Error('This material requires its supplied shade-specific texture.');
 if(material.colorMode==='tint'&&!/^#[0-9a-f]{6}$/i.test(hex||''))throw Error('This shade requires a prepared photographic texture.');
 return {material,fabric,variant,preview,hex:hex||'#ffffff',shadeName:preview?.name||variant!.name,commercial:Boolean(variant&&fabric.source==='supplier')};
}
export function validateDesign(input:unknown,records:FabricRecord[]):VisualizerDesign{
 if(!input||typeof input!=='object')throw Error('Invalid saved design.');
 const raw=input as VisualizerDesign;
 if(raw.version!==1||raw.assetVersion!==assetVersion||(raw.rendererVersion&&raw.rendererVersion!==rendererVersion))throw Error('This saved design uses unavailable preview assets.');
 if(!scenes.some(s=>s.id===raw.sceneId&&s.status==='sample'))throw Error('This window scene is not yet preview-supported.');
 const clean=(key:'main'|'sheer'):LayerSelection=>{const layer=raw[key];if(!layer||typeof layer.enabled!=='boolean'||typeof layer.materialId!=='string'||typeof layer.fabricId!=='string')throw Error('Invalid curtain selection.');const selection:LayerSelection={enabled:layer.enabled,materialId:layer.materialId,fabricId:layer.fabricId,...(typeof layer.variantId==='string'?{variantId:layer.variantId}:{}),...(typeof layer.previewColorId==='string'?{previewColorId:layer.previewColorId}:{})};const resolved=resolveLayer(selection,records);if(resolved.material.layer!==key)throw Error('Fabric does not match the curtain layer.');return selection;};
 let inspiration:VisualizerDesign['inspiration'];if(raw.inspiration){const value=raw.inspiration;if(typeof value!=='object'||[value.style,value.pattern,value.room].some(text=>typeof text!=='string'||text.length>100))throw Error('Invalid design inspiration.');inspiration={style:value.style,pattern:value.pattern,room:value.room};}
 return {version:1,assetVersion,rendererVersion,sceneId:raw.sceneId,main:clean('main'),sheer:clean('sheer'),...(inspiration?{inspiration}:{})};
}
export function fromManual(config:ManualConfig,records:FabricRecord[],inspiration?:VisualizerDesign['inspiration']):VisualizerDesign{
 const design=structuredClone(defaultDesign);
 for(const key of ['main','sheer'] as const){const id=key==='main'?config.mainFabric:config.sheerFabric,variantId=key==='main'?config.mainColor:config.sheerColor,enabled=key==='main'?config.mainEnabled:config.sheerEnabled,material=materials.find(m=>m.layer===key&&m.fabricId===id&&availableMaterial(m,records));if(!material&&enabled)throw Error('Your selected '+key+' fabric needs compatible room-preview assets. Your original fabric is retained in the enquiry. Choose a supported material to start a new sample study.');if(material)design[key]={enabled,materialId:material.id,fabricId:id,variantId};else design[key].enabled=false;}
 if(inspiration)design.inspiration=inspiration;
 return design;
}
export function designSummary(design:VisualizerDesign,records:FabricRecord[]){
 const scene=scenes.find(s=>s.id===design.sceneId)!;
 return ['Window reference: '+scene.name+' (illustrative sample)',...(design.inspiration?['Consultation inspiration (not represented by the sample geometry): '+[design.inspiration.style,design.inspiration.pattern,design.inspiration.room].filter(Boolean).join(' / ')]:[]),...(['sheer','main'] as const).map(key=>{const selection=design[key];if(!selection.enabled)return key+': Not included';const layer=resolveLayer(selection,records);return key+': '+layer.fabric.name+' / '+layer.shadeName+'; fabric ID: '+layer.fabric.id+'; '+(layer.commercial?'variant ID: '+layer.variant!.id+'; SKU: '+(layer.variant!.variantSku||layer.variant!.colorCode):'DEMONSTRATION ONLY, availability to confirm'+(layer.variant?'; reference shade ID: '+layer.variant.id:'; preview colour: '+layer.preview!.id));}),scene.previewSupport==='base-only'?'Preview: Room reference only. Selected curtains have NOT been rendered.':'Construction: sample wave drape; colour and fit are approximate.','Contact: sales@dcorhome.com'].join('\n');
}
export const enquiryHref=(design:VisualizerDesign,records:FabricRecord[])=>'/contact?'+new URLSearchParams({visualizer:JSON.stringify(validateDesign(design,records)),interest:'Manual curtain design consultation',room:scenes.find(scene=>scene.id===design.sceneId)?.name||'Room consultation',message:designSummary(design,records)}).toString();
