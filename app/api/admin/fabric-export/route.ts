import { NextRequest, NextResponse } from 'next/server';
import { requireMemberAdmin, memberJson } from '@/lib/server/members';
import { exportableFabrics, prepareFabricExport } from '@/lib/server/fabric-export';
import { failure, privateHeaders } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET() {
  try {
    await requireMemberAdmin();
    const fabrics = [...(await exportableFabrics()).entries()].map(([id, entry]) => {
      const record = entry.record as { name?: unknown; category?: unknown; images?: unknown } | null;
      return { id, name: typeof record?.name === 'string' ? record.name : id, category: typeof record?.category === 'string' ? record.category : '', image: Array.isArray(record?.images) && typeof record.images[0] === 'string' ? record.images[0] : '', status: entry.status };
    });
    return NextResponse.json({ fabrics }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    await requireMemberAdmin();
    const input = await memberJson(request, 262144);
    const result = await prepareFabricExport(await exportableFabrics(), input.ids);
    return new NextResponse(JSON.stringify(result.data, null, 2), { headers: { ...privateHeaders, 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${result.complete ? 'fabrics.json' : 'fabric-selection-partial.json'}"` } });
  } catch (error) { return failure(error); }
}
