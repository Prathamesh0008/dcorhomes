import 'server-only';
import { homeCategories, type CategoryFabric } from '@/lib/homepage';
import { fabrics } from '@/lib/curtains/manual-config';
import { categories } from './fabric-records';
import { mongoDatabase } from './mongodb';
export async function navigationCategories() {
  const db = await mongoDatabase(), records = new Map<string, CategoryFabric>(fabrics.map(f => [f.id, f]));
  const legacy = await db.collection<{ id: string; payload: { category: CategoryFabric['category']; archived?: boolean } }>('legacy_fabrics').find({ kind: 'fabric' }, { projection: { id: 1, 'payload.category': 1, 'payload.archived': 1 } }).toArray();
  for (const item of legacy) { const prior = records.get(item.id); if (prior) records.set(item.id, { ...prior, category: item.payload.category, active: !item.payload.archived }); }
  const products = await db.collection<{ id: string; payload: CategoryFabric }>('fabric_products').find({ kind: 'fabric-record' }, { projection: { id: 1, 'payload.id': 1, 'payload.category': 1, 'payload.categoryId': 1, 'payload.active': 1, 'payload.blackoutPercentage': 1, 'payload.images': { $slice: 1 }, 'payload.colors.active': 1 } }).toArray();
  for (const item of products) records.set(item.id, item.payload);
  return homeCategories([...records.values()], await categories());
}
