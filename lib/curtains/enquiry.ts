import type { FabricRecord, FabricVariant } from './catalogue';
export function fabricEnquiry(f: FabricRecord, v: FabricVariant | undefined, url: string) {
 return `Hello Dcorhome,

I'm interested in the following curtain fabric:

Fabric: ${f.name}
Collection: ${f.collection || f.brand || f.category}
Color: ${v?.name || 'Please advise'}
Shade Code: ${v?.colorCode || 'Not supplied'}
Fabric SKU: ${f.sku || 'Not supplied'}
Variant SKU: ${v?.variantSku || 'Not supplied'}
${f.fabricWidthCm!=null?'Fabric roll width: '+f.fabricWidthCm+' cm\n':''}${f.weightGsm!=null?'Weight: '+f.weightGsm+' GSM\n':''}Record: ${f.source==='demo'?'DEMO - availability unverified':'Supplier catalogue'}

Please share fabric availability, full specifications, and quotation details.

Product Link: ${url}`;
}
export function whatsappHref(number: string | undefined, message: string) {
 return number && /^[1-9][0-9]{7,14}$/.test(number) ? `https://wa.me/${number}?${new URLSearchParams({text:message})}` : null;
}
