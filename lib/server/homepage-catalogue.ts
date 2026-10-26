import 'server-only';
import { cache } from 'react';
import { fabrics } from '@/lib/curtains/manual-config';
import { fabricCategories } from '@/lib/curtains/categories';
import { fabricRecords, categories } from './fabric-records';
import { logDatabaseFailure } from './database-diagnostics';
// Request-local public presentation fallback only; never used by writes or private routes.
export const homepageCatalogue = cache(async () => {
  try { const [records, categoryRecords] = await Promise.all([fabricRecords(), categories()]); return { records, categories: categoryRecords }; }
  catch (error) { logDatabaseFailure('homepage_catalogue_fallback', error); return { records: fabrics.filter(f => f.active !== false), categories: fabricCategories }; }
});
