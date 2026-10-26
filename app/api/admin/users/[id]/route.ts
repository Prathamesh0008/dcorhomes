import { NextRequest, NextResponse } from 'next/server';
import { memberJson, manageMember, requireMemberAdmin } from '@/lib/server/members';
import { failure, privateHeaders } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireMemberAdmin(), input = await memberJson(request, 1024);
    return NextResponse.json(await manageMember(actor, (await context.params).id, input.action), { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
