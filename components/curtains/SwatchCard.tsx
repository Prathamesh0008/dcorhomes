import Link from 'next/link';
import Image from 'next/image';
import { resolveFabricImages } from '@/lib/curtains/fabric-images';
import type { SwatchItem } from '@/lib/curtains/swatch-query';
export default function FabricSwatchItem({item}:{item:SwatchItem;view?:'grid'|'list'}) {
 const {fabric,variant}=item,photo=resolveFabricImages({...fabric,colors:[variant]},variant.id)[0];
 const src=variant.swatchImage||variant.textureImage||variant.digitalSwatchImage||(photo?.mode!=='reference'?photo?.src:undefined);
 return <article data-testid="swatch-card" className="min-w-0"><Link href={'/collections/'+fabric.slug+'?shade='+encodeURIComponent(variant.id)} title={[fabric.name,variant.name,variant.variantSku].filter(Boolean).join(' — ')} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"><div className="relative aspect-square overflow-hidden bg-[#f3f3f1]">{src?<Image src={src} alt={fabric.name+' — '+variant.name+(photo?.mode==='digital'?' (digital approximation)':'')} fill sizes="(min-width:1440px) 190px,(min-width:1280px) 18vw,(min-width:1024px) 21vw,(min-width:640px) 30vw,46vw" className="object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.025]"/>:<span className="absolute inset-0 flex items-center justify-center p-3 text-center text-[12px] text-muted">Shade photograph unavailable</span>}</div><p className="mb-0 mt-2 text-[12px] font-medium leading-[1.5] group-hover:underline">{fabric.name} — {variant.name}</p></Link></article>;
}
