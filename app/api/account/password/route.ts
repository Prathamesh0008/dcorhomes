import { NextRequest, NextResponse } from 'next/server';
import { accountSession } from '@/lib/server/account-session';
import { memberJson, changeMemberPassword, loginLimit } from '@/lib/server/members';
import { failure, HttpError, privateHeaders } from '@/lib/server/security';
export async function POST(request: NextRequest) {
  try { const account = await accountSession(true); if (!account) throw new HttpError(401, 'Please sign in.');
    const input = await memberJson(request, 2048);
    await loginLimit(`password:${account.user.id}`, 'password-change');
    await changeMemberPassword({ id: account.user.id, version: account.user.sessionVersion }, input.currentPassword, input.newPassword);
    return NextResponse.json({ success: true, signInRequired: true }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
