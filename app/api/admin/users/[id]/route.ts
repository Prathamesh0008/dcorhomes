import { NextRequest, NextResponse } from 'next/server';
import { memberJson, manageMember, editMember, requireMemberAdmin } from '@/lib/server/members';
import { failure, privateHeaders } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireMemberAdmin(), input = await memberJson(request, 4096), id = (await context.params).id;
    return NextResponse.json(input.action === 'edit' ? await editMember(actor, id, input) : await manageMember(actor, id, input.action, input.newPassword), { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
