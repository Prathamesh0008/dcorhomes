import type { FabricRecord } from '../curtains/catalogue';
import { withCustomizerShades } from '../curtains/customizer-shades';
import type { FabricMaterial as Material, RoomScene as Scene } from './types';
import library from './library-assets.json';
import { lavenderSheerHex, studioSheerShadeNames } from './sheer-shades';
import { sheerPatterns } from './sheer-patterns';

// Delivery-only transforms keep original asset paths/checksums in the inventory.
const runtimeImage=(src:string)=>src.replace('/library-v1/','/atelier-v2/').replace(/\.(png|webp)$/,'.webp');

// Studio-only studies: never merged into the commercial fabric catalogue.
const baseRecords: FabricRecord[] = library.fabrics.map(fabric => ({
  id: fabric.id, slug: fabric.id, name: fabric.name, category: 'Illustrative material study',
  description: 'Digitally illustrated textile; confirm fabric, shade and availability with a sample.',
  source: 'demo', usage: [fabric.layer as 'main' | 'sheer'], images: [runtimeImage(fabric.master)],
  compatibleHeadingStyles: [],
  colors: fabric.colors.map(color => ({id: color.id,
    name: (fabric.layer === 'sheer' && studioSheerShadeNames[color.id]) || color.name, colorCode: color.id,
    family: color.name, hexPreview: color.hex, textureImage: runtimeImage(color.texture),
    swatchImage: runtimeImage(color.texture), available: null})),
}));

for(const record of baseRecords.filter(record=>record.usage.includes('sheer'))){
 const white=record.colors.find(color=>color.id==='pure-white')!;
 record.colors.push({
  id:'lavender',name:studioSheerShadeNames.lavender,colorCode:'lavender',
  family:'Lavender',hexPreview:lavenderSheerHex,textureImage:white.textureImage,available:null,
 });
}

export const libraryRecords:FabricRecord[]=[
 ...baseRecords,
 ...sheerPatterns.map(({id,name,baseId,texture})=>({
  ...baseRecords.find(record=>record.id===baseId)!,
  id,slug:id,name,images:[texture],
 })),
];

export function visualizerFabric(id: string | null | undefined, records: FabricRecord[]) {
  const record = records.find(record => record.id === id);
  return record ? withCustomizerShades(record) : libraryRecords.find(record => record.id === id);
}

const baseMaterials: Material[] = library.fabrics.map(fabric => ({
  id: fabric.id, name: fabric.name, layer: fabric.layer as 'main' | 'sheer', fabricId: fabric.id,
  catalogueSource: 'demo', status: 'sample', texture: runtimeImage(fabric.master),
  thumbnail: runtimeImage(fabric.colors.find(color => color.id === 'soft-ivory' || color.id === 'ivory')?.texture || fabric.master),
  opacity: 1, opacityMap: fabric.opacityMap?runtimeImage(fabric.opacityMap):undefined, sheen: /velvet|silk/.test(fabric.id)?.18:0, textureStrength: 0,
  surface: /jacquard|striped|embroidered|net-/.test(fabric.id)?'patterned':fabric.id.includes('velvet')?'velvet':fabric.id.includes('silk')?'silk':'woven',
  repeat: 160, colorMode: 'texture', library: true,
}));

export const libraryMaterials:Material[]=[
 ...baseMaterials,
 ...sheerPatterns.map(({id,name,baseId,texture,repeat})=>({
  ...baseMaterials.find(material=>material.id===baseId)!,
  id,name,fabricId:id,patternTexture:texture,repeat,
 })),
];

export const libraryScenes: Scene[] = library.rooms.map(room => ({
  id: room.id, name: room.name, version: 'manual-v1', status: 'sample',
  base: room.base, thumbnail: runtimeImage(room.thumbnail), width: room.width, height: room.height,
  provenance: room.provisional ? 'Upscaled concept-sheet crop; inspiration only.' : 'Generated architectural prototype; room view only.',
  previewSupport: 'base-only',
  previewNotice: room.provisional
    ? 'Room inspiration only. This image needs aligned curtain and foreground masks before it can preview your fabrics.'
    : room.notice,
  provisional: room.provisional,
  window: {x: room.window[0], y: room.window[1], width: room.window[2] - room.window[0], height: room.window[3] - room.window[1]},
}));
