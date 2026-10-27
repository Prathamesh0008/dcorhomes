import records from './fabrics.json';
import collections from './collections.json';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import type { FabricCategory } from '@/lib/curtains/categories';

// Version-controlled public content. Embedded shades retain their original IDs and specifications.
// Existing demonstration records remain labelled demo; this is not a production DB export.
export const catalogueRecords = records as FabricRecord[];
export const catalogueCategories = collections as FabricCategory[];
