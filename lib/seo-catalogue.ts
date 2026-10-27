import type { FabricRecord } from '@/lib/curtains/catalogue';
import { categoryId } from '@/lib/curtains/categories';
import seo from '@/data/site/seo.json';
import { pageMetadata, type SeoOverride } from './seo';
export function indexableFabric(record: FabricRecord) {
  return record.source === 'supplier' && record.active !== false && Boolean(record.name.trim() && record.description.trim() && record.sku && (record.images.length || record.colors.some(c => c.mainImage || c.swatchImage || c.textureImage)));
}
export function categoryFabrics(records: FabricRecord[], category: string) { return records.filter(record => indexableFabric(record) && categoryId(record) === category); }
export function fabricMetadata(record: FabricRecord) {
  const shade=record.colors.find(color=>color.active!==false&&(color.mainImage||color.swatchImage||color.textureImage));
  return pageMetadata(`${record.name}${record.source === 'demo' ? ' — illustrative curtain reference' : ' curtain fabric'}`, record.description, `/collections/${record.slug}`, { index: indexableFabric(record), image: record.images[0]||shade?.mainImage||shade?.swatchImage||shade?.textureImage, imageAlt: `${record.name} curtain fabric reference`, override: (seo.products as Record<string, SeoOverride>)[record.slug] });
}
