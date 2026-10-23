import Link from 'next/link';
import Container from '@/components/ui/Container';
import { SavedFabricList,SavedFabricsProvider } from '@/components/curtains/SavedFabrics';
export const metadata={title:'Saved fabric shades',robots:{index:false,follow:false}};
export default function Saved(){return <Container className="py-10 md:py-16"><Link href="/collections" className="inline-flex min-h-11 items-center text-[13px] underline">Back to Fabric Swatch Search</Link><h1 className="my-6 text-[36px] font-medium">Saved fabric shades</h1><SavedFabricsProvider><SavedFabricList/></SavedFabricsProvider></Container>;}
