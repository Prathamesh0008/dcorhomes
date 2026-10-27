import content from '@/data/site/editorial.json';
export async function editorialContent(){ return structuredClone(content); }
