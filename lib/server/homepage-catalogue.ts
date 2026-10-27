import { cache } from 'react';
import { fabricRecords, categories } from './fabric-records';
export const homepageCatalogue = cache(async () => ({ available: true as const, records: await fabricRecords(), categories: await categories() }));
