import { canonicalUrl, siteUrl } from './seo';
import { business } from './business';
import type { FabricRecord } from './curtains/catalogue';
import { indexableFabric } from './seo-catalogue';
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
export function siteIdentity() { return { '@context': 'https://schema.org', '@graph': [
  { '@type': ['Organization', 'LocalBusiness'], '@id': `${siteUrl}/#organization`, name: 'Dcorhome', url: siteUrl, email: business.email, logo: canonicalUrl('/branding/green.png'), address: { '@type': 'PostalAddress', streetAddress: 'Office No. 2, 1st Floor, Wadhwa PBR, Sector 4, Palm Beach Road, above The Bread Bar, Nerul West, Nerul', addressLocality: 'Navi Mumbai', addressRegion: 'Maharashtra', postalCode: '400706', addressCountry: 'IN' } },
  { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Dcorhome', url: siteUrl, inLanguage: 'en-IN', publisher: { '@id': `${siteUrl}/#organization` } },
] }; }
export function breadcrumbs(items: { name: string; path: string }[]) { return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: canonicalUrl(item.path) })) }; }
export function productSchema(record: FabricRecord) { return indexableFabric(record) ? { '@context': 'https://schema.org', '@type': 'Product', name: record.name, description: record.description, sku: record.sku, url: canonicalUrl(`/collections/${record.slug}`), image: [...new Set([...record.images,...record.colors.filter(c=>c.active!==false).flatMap(c=>[c.mainImage,c.swatchImage,c.textureImage].filter((image):image is string=>Boolean(image)))])].map(canonicalUrl), ...(record.brand ? { brand: { '@type': 'Brand', name: record.brand } } : {}) } : null; }
