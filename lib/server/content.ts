import content from '@/data/site/editorial.json';
import guides from '@/data/site/guides.json';
export type EditorialArticle = {slug:string;title:string;description:string;image:string;imageAlt?:string;body:string[];sections?:{heading:string;paragraphs:string[]}[];publishedAt?:string;updatedAt?:string;relatedSlugs?:string[]};
export async function editorialContent(){ return structuredClone({...content,articles:[...content.articles,...guides] as EditorialArticle[]}); }
