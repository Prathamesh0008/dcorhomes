import 'server-only';
import { allFabricRecords, validateFabricRecord } from './fabric-records';
import { validateDesign } from '@/lib/manual-visualizer/model';
import { mongoDatabase } from './mongodb';
import { HttpError } from './http';

export function draftKind(value: unknown): 'fabric' | 'design' {
  if (value !== 'fabric' && value !== 'design') throw new HttpError(400, 'Choose fabrics or curtain designs.');
  return value;
}
export async function validateDraft(input: Record<string, unknown>) {
  const kind = draftKind(input.kind);
  if (typeof input.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,59}$/.test(input.id)) throw new HttpError(400, 'Use a stable ID of 2–60 lowercase letters, numbers or hyphens.');
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 100) throw new HttpError(400, 'Enter a name of 2–100 characters.');
  let payload;
  if (kind === 'fabric') {
    payload = await validateFabricRecord(input.payload);
    if (payload.id !== input.id || payload.name !== input.name.trim()) throw new HttpError(400, 'Fabric ID and name must match the form.');
  } else {
    try { payload = validateDesign(input.payload, await allFabricRecords()); }
    catch { throw new HttpError(400, 'The curtain design configuration is invalid.'); }
  }
  return { kind, id: input.id, name: input.name.trim(), payload };
}
export async function draftCollection() {
  return (await mongoDatabase()).collection<{ _id: string; kind: 'fabric' | 'design'; id: string; name: string; payload: unknown; revision: number; updatedAt: Date; updatedBy: string }>('admin_content_drafts');
}
