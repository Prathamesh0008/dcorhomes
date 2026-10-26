import type { FabricRecord } from '../curtains/catalogue';
import type { FabricMaterial as Material, RoomScene as Scene } from './types';
import library from './library-assets.json';

// Delivery-only transforms keep original asset paths/checksums in the inventory.
const runtimeImage=(src:string)=>src.replace('/library-v1/','/atelier-v2/').replace(/\.(png|webp)$/,'.webp');

// Studio-only studies: never merged into the commercial fabric catalogue.
export const libraryRecords: FabricRecord[] = library.fabrics.map(fabric => ({
  id: fabric.id, slug: fabric.id, name: fabric.name, category: 'Illustrative material study',
  description: 'Digitally illustrated textile; confirm fabric, shade and availability with a sample.',
  source: 'demo', usage: [fabric.layer as 'main' | 'sheer'], images: [runtimeImage(fabric.master)],
  compatibleHeadingStyles: [],
  colors: fabric.colors.map(color => ({id: color.id, name: color.name, colorCode: color.id,
    family: color.name, hexPreview: color.hex, textureImage: runtimeImage(color.texture),
    swatchImage: runtimeImage(color.texture), available: null})),
}));

export function visualizerFabric(id: string | undefined, records: FabricRecord[]) {
  return records.find(record => record.id === id) || libraryRecords.find(record => record.id === id);
}

export const libraryMaterials: Material[] = library.fabrics.map(fabric => ({
  id: fabric.id, name: fabric.name, layer: fabric.layer as 'main' | 'sheer', fabricId: fabric.id,
  catalogueSource: 'demo', status: 'sample', texture: runtimeImage(fabric.master),
  thumbnail: runtimeImage(fabric.colors.find(color => color.id === 'soft-ivory' || color.id === 'ivory')?.texture || fabric.master),
  opacity: 1, opacityMap: fabric.opacityMap?runtimeImage(fabric.opacityMap):undefined, sheen: /velvet|silk/.test(fabric.id)?.18:0, textureStrength: 0,
  surface: /jacquard|striped|embroidered|net-/.test(fabric.id)?'patterned':fabric.id.includes('velvet')?'velvet':fabric.id.includes('silk')?'silk':'woven',
  repeat: 160, colorMode: 'texture', library: true,
}));

export const libraryScenes: Scene[] = library.rooms.map(room => ({
  id: room.id, name: room.name, version: 'manual-v1', status: 'sample',
  base: runtimeImage(room.base), thumbnail: runtimeImage(room.thumbnail), width: room.width, height: room.height,
  provenance: room.provisional ? 'Upscaled concept-sheet crop; inspiration only.' : 'Generated architectural prototype; room view only.',
  previewSupport: 'base-only', previewNotice: room.notice, provisional: room.provisional,
  window: {x: room.window[0], y: room.window[1], width: room.window[2] - room.window[0], height: room.window[3] - room.window[1]},
}));
