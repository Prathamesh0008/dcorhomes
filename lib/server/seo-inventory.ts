import { editorialContent } from './content';
import { fabricRecords, categories } from './fabric-records';
import { categoryFabrics, indexableFabric } from '@/lib/seo-catalogue';
import guidance from '@/data/site/category-guidance.json';
export const coreSeoPaths = ['/', '/collections', '/studio', '/measure', '/contact', '/about', '/how-it-works', '/faq', '/inspiration'];
export async function seoInventory():Promise<{path:string;lastModified?:string}[]> {
 const records=await fabricRecords(),articles=(await editorialContent()).articles;
 return [...coreSeoPaths.map(path=>({path})),...articles.map(article=>({path:`/inspiration/${article.slug}`,lastModified:article.updatedAt||article.publishedAt})),...records.filter(indexableFabric).map(record=>({path:`/collections/${record.slug}`,lastModified:record.publishedAt})),...(await categories()).filter(category=>category.active!==false&&category.id in guidance&&categoryFabrics(records,category.id).length).map(category=>({path:`/collections/category/${category.id}`}))];
}
