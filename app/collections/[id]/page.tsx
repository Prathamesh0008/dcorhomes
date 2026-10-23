import { notFound } from 'next/navigation';
import { fabricRecords,categories } from '@/lib/server/fabric-records';
import { categoryId } from '@/lib/curtains/categories';
import FabricDetail from '@/components/curtains/FabricDetail';
import { pageMetadata,siteUrl } from '@/lib/seo';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>;searchParams:Promise<{shade?:string}>};
export async function generateMetadata({params}:Context){const {id}=await params,f=(await fabricRecords()).find(f=>f.slug===id);return f?pageMetadata(f.name+' curtain fabric',f.description,`/collections/${f.slug}`):{title:'Fabric not found'};}
export default async function Detail({params,searchParams}:Context){const {id}=await params,f=(await fabricRecords()).find(f=>f.slug===id);if(!f)notFound();const category=(await categories()).find(c=>c.id===categoryId(f));const structured=f.source==='supplier'?{'@context':'https://schema.org','@type':'Product',name:f.name,description:f.description,sku:f.sku,image:f.images.map(src=>siteUrl+src),url:`${siteUrl}/collections/${f.slug}`} : null;return <>{structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,()=>String.fromCharCode(92)+'u003c')}}/>}<FabricDetail key={f.id} record={f} category={category} initialVariant={(await searchParams).shade} canonicalUrl={`${siteUrl}/collections/${f.slug}`} whatsappNumber={process.env.DCORHOME_WHATSAPP_NUMBER}/></>;}
