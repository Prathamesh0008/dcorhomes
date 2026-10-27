import { homeCategories } from '@/lib/homepage';
import { catalogueRecords, catalogueCategories } from '@/data/catalogue';
export async function navigationCategories(){ return homeCategories(catalogueRecords, catalogueCategories); }
