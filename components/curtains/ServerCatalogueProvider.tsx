import 'server-only';
import { fabricRecords } from '@/lib/server/fabric-records';
import FabricCatalogueProvider from './FabricCatalogueProvider';
export default async function ServerCatalogueProvider({ children }: { children: React.ReactNode }) {
  return <FabricCatalogueProvider records={await fabricRecords()}>{children}</FabricCatalogueProvider>;
}
