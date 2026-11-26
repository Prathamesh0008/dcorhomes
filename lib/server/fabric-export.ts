import 'server-only';
import { allFabricRecords, validateFabricRecord } from './fabric-records';
import { draftCollection } from './admin-drafts';
import { HttpError } from './http';

export async function exportableFabrics() {
  const [published, drafts] = await Promise.all([allFabricRecords(), (await draftCollection()).find({ kind: 'fabric' }).toArray()]);
  const merged = new Map<string, { record: unknown; status: 'published' | 'draft' }>(published.map(record => [record.id, { record, status: 'published' }]));
  for (const draft of drafts) merged.set(draft.id, { record: draft.payload, status: 'draft' });
  return merged;
}
export async function prepareFabricExport(merged: Awaited<ReturnType<typeof exportableFabrics>>, ids: unknown) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 10000 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw new HttpError(400, 'Select one or more distinct fabrics.');
  const records = [];
  for (const id of ids as string[]) {
    const entry = merged.get(id);
    if (!entry) throw new HttpError(409, 'The catalogue changed. Reopen export and select fabrics again.');
    const validated = await validateFabricRecord(entry.record);
    if (validated.id !== id) throw new HttpError(400, 'A selected fabric has a mismatched ID.');
    records.push(entry.record);
  }
  const complete = ids.length === merged.size;
  return { complete, data: complete ? records : { type: 'partial-fabric-export', warning: 'Partial export: merge these records into the complete catalogue. Do not replace fabrics.json.', records } };
}
