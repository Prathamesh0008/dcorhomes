import { NextRequest, NextResponse } from 'next/server';
import { authProvider } from '@/lib/auth-provider';
import { requireAccountAdmin } from '@/lib/server/account-session';
import { memberJson, manageMember, requireMemberAdmin } from '@/lib/server/members';
import { failure, privateHeaders } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (authProvider() === 'clerk') {
    try { await requireAccountAdmin(); return NextResponse.json({ error: 'Manage accounts and revoke sessions in the Clerk Dashboard.' }, { status: 405, headers: privateHeaders }); }
    catch (error) { return failure(error); }
  }
  try { const actor = await requireMemberAdmin(), input = await memberJson(request, 1024);
    return NextResponse.json(await manageMember(actor, (await context.params).id, input.action), { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
