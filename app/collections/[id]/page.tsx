import { notFound } from 'next/navigation';
import { fabricRecords,categories } from '@/lib/server/fabric-records';
import { categoryId } from '@/lib/curtains/categories';
import FabricDetail from '@/components/curtains/FabricDetail';
import { siteUrl } from '@/lib/seo';
import { fabricMetadata, indexableFabric } from '@/lib/seo-catalogue';
import { productSchema, breadcrumbs } from '@/lib/structured-data';
import JsonLd from '@/components/seo/JsonLd';
import Link from 'next/link';
import Container from '@/components/ui/Container';
export async function generateStaticParams(){return (await fabricRecords()).map(f=>({id:f.slug}));}
type Context={params:Promise<{id:string}>;searchParams:Promise<{shade?:string}>};
export async function generateMetadata({params}:Context){const {id}=await params,f=(await fabricRecords()).find(f=>f.slug===id);if(!f)notFound();return fabricMetadata(f);}
export default async function Detail({params,searchParams}:Context){
 const {id}=await params,records=await fabricRecords(),f=records.find(f=>f.slug===id);if(!f)notFound();
 const category=(await categories()).find(c=>c.id===categoryId(f)),structured=productSchema(f);
 const related=records.filter(item=>item.id!==f.id&&categoryId(item)===categoryId(f)&&item.source===f.source).slice(0,3);
 return <>{structured&&<JsonLd data={structured}/>}<JsonLd data={breadcrumbs([{name:'Home',path:'/'},{name:'Curtain fabrics',path:'/collections'},{name:f.name,path:`/collections/${f.slug}`}])}/><FabricDetail key={f.id} record={f} category={category} initialVariant={(await searchParams).shade} canonicalUrl={`${siteUrl}/collections/${f.slug}`} whatsappNumber={process.env.DCORHOME_WHATSAPP_NUMBER}/><Container as="section" className="pb-12"><h2 className="text-2xl">{indexableFabric(f)?'Related curtain fabrics':'More curtain design references'}</h2><div className="flex flex-wrap gap-6">{related.map(item=><Link key={item.id} href={`/collections/${item.slug}`} className="inline-flex min-h-11 items-center underline">{item.name}</Link>)}<Link href="/inspiration/linen-vs-velvet-curtains" className="inline-flex min-h-11 items-center underline">Compare curtain textures</Link><Link href="/measure" className="inline-flex min-h-11 items-center underline">Plan your curtain measurements</Link></div></Container></>;
}
