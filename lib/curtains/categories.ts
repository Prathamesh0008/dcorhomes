import type { FabricRecord } from './catalogue';
export type FabricCategory = { id: string; name: string; description: string; active?: boolean };
// Classification only. A category does not assert that stock is available.
export const fabricCategories: FabricCategory[] = [
 ['silk','Silk','Explore silk curtain varieties when verified supplier records are available.'],
 ['sheer','Sheer','A lighter layer for softly filtered daylight.'],
 ['velvet','Velvet','Rich surface texture and a generous drape.'],
 ['linen','Linen','Natural texture and a relaxed material direction.'],
 ['cotton','Cotton','Cotton curtain varieties and blends.'],
 ['jacquard','Jacquard','Woven patterns, from subtle geometry to decorative motifs.'],
 ['chenille','Chenille','Soft, tactile curtain constructions.'],
 ['polyester-blends','Polyester and blends','Synthetic and blended constructions, identified by supplier composition.'],
 ['textured','Textured','Curtain fabrics with a tactile woven surface.'],
 ['unclassified','Other curtain fabrics','Material classification awaiting supplier confirmation.'],
].map(([id,name,description])=>({id,name,description}));
export function categoryId(f: Pick<FabricRecord,'categoryId'|'category'>) { return f.categoryId || ({Silk:'silk',Sheer:'sheer',Linen:'linen',Velvet:'velvet',Textured:'textured'} as Record<string,string>)[f.category] || 'unclassified'; }
export function activeVariants(f: FabricRecord) { return f.colors.filter(c=>c.active!==false); }
export { resolveFabricImages as variantPhotos } from './fabric-images';
