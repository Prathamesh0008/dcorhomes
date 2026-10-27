import { NextRequest, NextResponse } from 'next/server';
import { authProvider } from '@/lib/auth-provider';
import { requireAccountAdmin } from '@/lib/server/account-session';
import { mongoDatabase } from '@/lib/server/mongodb';
import { memberJson, memberIndexes, provisionMember, publicMember, requireMemberAdmin } from '@/lib/server/members';
import { failure, privateHeaders } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function GET() {
  if (authProvider() === 'clerk') {
    try {
      await requireAccountAdmin();
      const client = await (await import('@clerk/nextjs/server')).clerkClient();
      const { data, totalCount } = await client.users.getUserList({ limit: 100 });
      return NextResponse.json({ users: data.map(user => ({ id: user.id, userId: user.username, fullName: user.fullName, role: user.publicMetadata.role, status: user.banned || user.locked ? 'disabled' : user.publicMetadata.dcorhomeAccess === 'approved' ? 'approved' : 'unapproved' })), totalCount }, { headers: privateHeaders });
    } catch (error) { return failure(error); }
  }
  try { await requireMemberAdmin(); await memberIndexes();
    const users = await (await mongoDatabase()).collection('users').find({}, { projection: { name: 1, userId: 1, email: 1, role: 1, status: 1, mustChangePassword: 1, createdAt: 1, lastLoginAt: 1, createdBy: 1 } }).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ users: users.map(publicMember) }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (authProvider() === 'clerk') {
    try { await requireAccountAdmin(); return NextResponse.json({ error: 'Create and manage accounts in the Clerk Dashboard.' }, { status: 405, headers: privateHeaders }); }
    catch (error) { return failure(error); }
  }
  try { const actor = await requireMemberAdmin(), input = await memberJson(request, 4096);
    return NextResponse.json(await provisionMember(actor, input), { status: 201, headers: privateHeaders });
  } catch (error) { return failure(error); }
}
