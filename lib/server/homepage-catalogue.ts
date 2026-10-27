import 'server-only';
import { cache } from 'react';
import { fabricRecords, categories } from './fabric-records';
import { logDatabaseFailure } from './database-diagnostics';
// Request-local sharing includes failures; never substitute bundled inventory on an outage.
export const homepageCatalogue = cache(async () => {
  try { const [records, categoryRecords] = await Promise.all([fabricRecords(), categories()]); return { available: true as const, records, categories: categoryRecords }; }
  catch (error) { logDatabaseFailure('homepage_catalogue_unavailable', error); return { available: false as const, records: [], categories: [] }; }
});
