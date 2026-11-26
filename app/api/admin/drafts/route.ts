import { NextRequest, NextResponse } from 'next/server';
import { requireMemberAdmin, memberJson } from '@/lib/server/members';
import { draftCollection, draftKind, validateDraft } from '@/lib/server/admin-drafts';
import { allFabricRecords } from '@/lib/server/fabric-records';
import { failure, HttpError, privateHeaders } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    await requireMemberAdmin();
    const kind = draftKind(request.nextUrl.searchParams.get('kind'));
    const collection = await draftCollection();
    // Exports must include every draft, even when the editor's recent-record list is capped.
    const query = collection.find({ kind }).sort({ updatedAt: -1 });
    const drafts = await (request.nextUrl.searchParams.get('export') === '1' || (kind === 'fabric' && request.nextUrl.searchParams.get('all') === '1') ? query : query.limit(100)).toArray();
    const published = kind === 'fabric' ? await allFabricRecords() : [];
    if (request.nextUrl.searchParams.get('export') === '1') {
      const merged = new Map<string, unknown>(published.map(record => [record.id, record]));
      for (const draft of drafts) merged.set(draft.id, kind === 'fabric' ? draft.payload : { id: draft.id, name: draft.name, design: draft.payload });
      return new NextResponse(JSON.stringify([...merged.values()], null, 2), { headers: { ...privateHeaders, 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${kind === 'fabric' ? 'fabrics' : 'curtain-designs'}.json"` } });
    }
    return NextResponse.json({ drafts: drafts.map(({ _id, ...draft }) => draft), published }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await requireMemberAdmin(), input = await memberJson(request, 64000);
    const data = await validateDraft(input), collection = await draftCollection();
    if (!Number.isInteger(input.revision) || Number(input.revision) < 0) throw new HttpError(400, 'Reload this draft before saving.');
    const key = `${data.kind}:${data.id}`;
    const fields = { ...data, updatedAt: new Date(), updatedBy: actor.id, revision: Number(input.revision) + 1 };
    if (input.revision === 0) {
      try { await collection.insertOne({ _id: key, ...fields }); }
      catch (error) { if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'This draft has changed. Reload before saving.'); throw error; }
    } else {
      const result = await collection.updateOne({ _id: key, revision: Number(input.revision) }, { $set: fields });
      if (!result.matchedCount) throw new HttpError(409, 'This draft has changed. Reload before saving.');
    }
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    await requireMemberAdmin();
    const input = await memberJson(request, 2048), kind = draftKind(input.kind);
    if (typeof input.id !== 'string' || !Number.isInteger(input.revision)) throw new HttpError(400, 'Reload this draft before deleting.');
    const result = await (await draftCollection()).deleteOne({ _id: `${kind}:${input.id}`, revision: Number(input.revision) });
    if (!result.deletedCount) throw new HttpError(409, 'This draft has changed. Reload before deleting.');
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
