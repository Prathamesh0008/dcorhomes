import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fabricRecords, categories } from '@/lib/server/fabric-records';
import { categoryFabrics } from '@/lib/seo-catalogue';
import { pageMetadata, type SeoOverride } from '@/lib/seo';
import guidance from '@/data/site/category-guidance.json';
import seo from '@/data/site/seo.json';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbs } from '@/lib/structured-data';
import Container from '@/components/ui/Container';
type Context = {params:Promise<{category:string}>};
async function categoryPage(id:string){
 const copy=(guidance as Record<string,(typeof guidance)['sheer']>)[id],category=(await categories()).find(c=>c.id===id&&c.active!==false);
 const records=categoryFabrics(await fabricRecords(),id);
 if(!copy||!category||!records.length)notFound();
 return {copy,category,records};
}
export async function generateStaticParams(){const records=await fabricRecords();return (await categories()).filter(c=>c.active!==false&&c.id in guidance&&categoryFabrics(records,c.id).length).map(c=>({category:c.id}));}
export async function generateMetadata({params}:Context){const id=(await params).category,{copy}=await categoryPage(id);return pageMetadata(copy.title,copy.intro,`/collections/category/${id}`,{override:(seo.categories as Record<string,SeoOverride>)[id]});}
export default async function Page({params}:Context){const id=(await params).category,{copy,records}=await categoryPage(id);return <Container as="section" className="py-12 md:py-20"><JsonLd data={breadcrumbs([{name:'Home',path:'/'},{name:'Curtain fabrics',path:'/collections'},{name:copy.title,path:`/collections/category/${id}`}])}/><nav aria-label="Breadcrumb" className="mb-8 flex gap-4 text-sm"><Link href="/">Home</Link><Link href="/collections">Curtain fabrics</Link><span aria-current="page">{copy.title}</span></nav><h1 className="text-4xl font-medium">{copy.title}</h1><p className="max-w-3xl leading-8 text-muted">{copy.intro}</p><div className="grid gap-8 md:grid-cols-2">{copy.sections.map(section=><section key={section.heading}><h2 className="text-2xl">{section.heading}</h2><p className="leading-8 text-muted">{section.text}</p></section>)}</div><h2 className="mt-12 text-2xl">Explore the documented fabrics</h2><ul>{records.map(record=><li key={record.id}><Link href={`/collections/${record.slug}`} className="inline-flex min-h-11 items-center underline">{record.name}</Link><p className="text-muted">{record.description}</p></li>)}</ul><div className="mt-8 flex flex-wrap gap-6"><Link className="underline" href="/studio">Try the curtain design studio</Link><Link className="underline" href="/inspiration/layer-sheer-main-curtains">Plan sheer and main layers</Link><Link className="underline" href="/contact">Enquire about fabrics and samples</Link></div></Container>;}
