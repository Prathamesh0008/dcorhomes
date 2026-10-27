import type { FabricRecord } from './catalogue';
export type FabricCategory = { id: string; name: string; description: string; active?: boolean };
// Classification only. A category does not assert that stock is available.
export { catalogueCategories as fabricCategories } from '../../data/catalogue';
export function categoryId(f: Pick<FabricRecord,'categoryId'|'category'>) { return f.categoryId || ({Silk:'silk',Sheer:'sheer',Linen:'linen',Velvet:'velvet',Textured:'textured'} as Record<string,string>)[f.category] || 'unclassified'; }
export function activeVariants(f: FabricRecord) { return f.colors.filter(c=>c.active!==false); }
export { resolveFabricImages as variantPhotos } from './fabric-images';
