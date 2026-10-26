// Shared by the runtime repository and the explicit SQLite migration CLI.
export const recordCollections: Record<string, string> = {
  'fabric-record': 'fabric_products', 'fabric-category': 'fabric_collections', fabric: 'legacy_fabrics',
  enquiry: 'enquiries', 'account-enquiry': 'enquiries',
  'manual-design': 'saved_designs', 'saved-fabric': 'saved_designs', design: 'saved_designs',
  upload: 'asset_metadata', generation: 'asset_metadata', 'catalogue-image': 'asset_metadata',
  share: 'design_shares', content: 'site_content', settings: 'site_settings',
};
export function collectionFor(kind: string) {
  if (!/^[a-z][a-z0-9-]{0,79}$/.test(kind)) throw Error('Invalid record kind.');
  return recordCollections[kind] || 'application_records';
}
export type StoredRecord = { kind: string; id: string; owner: string; payload: unknown; created: number };
export function validateRecord(value: unknown): StoredRecord {
  const record = value as StoredRecord;
  if (!record || typeof record.kind !== 'string') throw Error('Invalid record.');
  collectionFor(record.kind);
  if (typeof record.id !== 'string' || !record.id || record.id.length > 300 || typeof record.owner !== 'string' || !record.owner || record.owner.length > 300 || !Number.isFinite(record.created) || record.created < 0 || !record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) throw Error('Invalid record fields.');
  if (['fabric-record', 'fabric-category', 'fabric'].includes(record.kind) && (record.payload as { id?: string }).id !== record.id) throw Error('Catalogue record ID does not match its payload.');
  return record;
}
