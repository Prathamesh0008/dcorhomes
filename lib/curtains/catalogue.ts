// Public records belong in data/catalogue/fabrics.json. Demo records are intentionally
// separate: none of their palettes or compatibility rules assert real availability.
export type FabricVariant = { id: string; name: string; colorCode: string; hexPreview?: string; family: string; swatchImage?: string; variantSku?: string; available: boolean | null; mainImage?: string; textureImage?: string; drapedImage?: string; digitalPreviewImage?: string; digitalPreviewImages?: string[]; digitalSwatchImage?: string; images?: string[]; availability?: string; active?: boolean };
export type FabricRecord = {
  abrasionRubCount?: number; countryOfOrigin?: string; publishedAt?: string; technicalSheet?: string; stockQuantityMetres?: number;
  id: string; slug: string; name: string; category: string; description: string;
  categoryId?: string; variety?: string; active?: boolean; collection?: string; texture?: string; construction?: string; linearWeightGm?: number; rollLengthM?: number; lightFiltering?: string; liningCompatibility?: string; applications?: string[]; washing?: string; dryCleaning?: string; ironing?: string;
  source: 'demo' | 'supplier'; usage: ('main' | 'sheer')[]; sku?: string;
  brand?: string; supplierReference?: string; composition?: string;
  fabricWidthCm?: number; weightGsm?: number; weave?: string; thicknessMm?: number;
  opacity?: string; blackoutPercentage?: number; pattern?: string;
  patternRepeatCm?: { horizontal: number; vertical: number }; careInstructions?: string;
  shrinkage?: string; certifications?: string[]; pricePerMetre?: number;
  currency?: string; availability?: string; minimumOrderMetres?: number; leadTime?: string;
  colors: FabricVariant[]; images: string[]; compatibleHeadingStyles: string[];
};
export const manualHeadings = ['Wave Pleat','Pinch Pleat','Eyelet','Pencil Pleat','Goblet Pleat','Rod Pocket'];
export function specificationRows(f: FabricRecord): [string,string][] {
  const pending='Specification pending';
  return [ ['Fabric ID',f.id],['Fabric name',f.name],['Brand / collection',f.collection || f.brand || pending],['Fabric SKU',f.sku || pending],['Country of origin',f.countryOfOrigin||pending],['Abrasion rub count',f.abrasionRubCount==null?pending:String(f.abrasionRubCount)],['Stock quantity (metres)',f.stockQuantityMetres==null?pending:String(f.stockQuantityMetres)],
    ['Fabric width (cm)',f.fabricWidthCm == null ? pending : String(f.fabricWidthCm)],
    ['Fabric weight (GSM)',f.weightGsm == null ? pending : String(f.weightGsm)],
    ['Composition',f.composition || pending],['Weave / texture',f.weave || pending],
    ['Texture',f.texture || pending],['Construction',f.construction || pending],['Linear weight (g/m)',f.linearWeightGm == null?pending:String(f.linearWeightGm)],['Roll length (m)',f.rollLengthM == null?pending:String(f.rollLengthM)],['Light filtering',f.lightFiltering || pending],['Lining compatibility',f.liningCompatibility || pending],['Washing',f.washing || pending],['Dry cleaning',f.dryCleaning || pending],['Ironing',f.ironing || pending],['Thickness (mm)',f.thicknessMm == null ? pending : String(f.thicknessMm)],
    ['Transparency / light filtering',f.opacity || pending],
    ['Tested blackout (%)',f.blackoutPercentage == null ? pending : String(f.blackoutPercentage)],
    ['Pattern',f.pattern || pending],['Pattern repeat H × V (cm)',f.patternRepeatCm ? `${f.patternRepeatCm.horizontal} × ${f.patternRepeatCm.vertical}` : pending],
    ['Recommended usage',f.source==='demo' ? 'Illustrative direction only' : f.applications?.join(', ') || f.usage.join(' / ')+' curtains'],
    ['Care instructions',f.careInstructions || pending],['Shrinkage',f.shrinkage || pending],
    ['Verified certifications',f.certifications?.join(', ') || pending],
    ['Price per metre',f.pricePerMetre == null ? pending : `${f.currency || ''} ${f.pricePerMetre}`],
    ['Stock / availability',f.availability || pending],
    ['Minimum order (metres)',f.minimumOrderMetres == null ? pending : String(f.minimumOrderMetres)],
    ['Supplier reference',f.supplierReference || pending],['Verified lead time',f.leadTime || pending] ];
}
