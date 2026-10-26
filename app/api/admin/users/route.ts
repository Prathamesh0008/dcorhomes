import { NextRequest, NextResponse } from 'next/server';
import { mongoDatabase } from '@/lib/server/mongodb';
import { memberJson, memberIndexes, provisionMember, publicMember, requireMemberAdmin } from '@/lib/server/members';
import { failure, privateHeaders } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function GET() {
  try { await requireMemberAdmin(); await memberIndexes();
    const users = await (await mongoDatabase()).collection('users').find({}, { projection: { name: 1, userId: 1, email: 1, role: 1, status: 1, mustChangePassword: 1, createdAt: 1, lastLoginAt: 1, createdBy: 1 } }).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ users: users.map(publicMember) }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try { const actor = await requireMemberAdmin(), input = await memberJson(request, 4096);
    return NextResponse.json(await provisionMember(actor, input), { status: 201, headers: privateHeaders });
  } catch (error) { return failure(error); }
}
