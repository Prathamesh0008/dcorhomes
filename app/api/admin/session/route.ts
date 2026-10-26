import { NextRequest, NextResponse } from 'next/server';
import { failure, HttpError, mutation, requireAdmin, privateHeaders } from '@/lib/server/security';
export async function POST(request: NextRequest) {
  try { mutation(request); await requireAdmin(); return NextResponse.json({ ok: true }, { headers: privateHeaders }); }
  catch (error) { return failure(error instanceof HttpError ? error : new HttpError(503, 'Administrator authentication is unavailable.')); }
}
export async function DELETE() {
  return NextResponse.json({ error: 'Use the account Logout action to end your authenticated session.' }, { status: 405, headers: privateHeaders });
}
