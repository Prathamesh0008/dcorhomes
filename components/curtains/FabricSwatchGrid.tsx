import type { SwatchItem } from '@/lib/curtains/swatch-query';
import FabricSwatchItem from './SwatchCard';
export default function FabricSwatchGrid({items}:{items:SwatchItem[]}) {
 return <div data-testid="swatch-grid" className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1440px]:grid-cols-6">{items.map(item=><FabricSwatchItem key={JSON.stringify([item.fabric.id,item.variant.id])} item={item}/>)}</div>;
}
