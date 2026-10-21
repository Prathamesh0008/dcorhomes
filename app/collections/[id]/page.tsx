import { notFound } from 'next/navigation';
import { catalogue } from '@/lib/server/catalogue';
import FabricDetail from '@/components/curtains/FabricDetail';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function generateMetadata({params}:Context){const {id}=await params;const fabric=catalogue().find(p=>p.id===id);return{title:fabric?.name||'Fabric not found',description:fabric?.description,alternates:{canonical:`/collections/${id}`}};}
export default async function Detail({params}:Context){const {id}=await params;const fabric=catalogue().find(p=>p.id===id);if(!fabric)notFound();return <FabricDetail product={fabric}/>;}
