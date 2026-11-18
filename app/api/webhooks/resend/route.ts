import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { recordDelivery } from '@/lib/server/enquiry-store';
import { HttpError, failure, privateHeaders } from '@/lib/server/http';
import { logDatabaseFailure } from '@/lib/server/database-diagnostics';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) throw new HttpError(503, 'Webhook verification is not configured.');
    const reader = request.body?.getReader(), parts: Uint8Array[] = []; let size = 0;
    if (!reader) throw new HttpError(400, 'Missing webhook.');
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 64000) { await reader.cancel(); throw new HttpError(413, 'Webhook is too large.'); } parts.push(part.value); }
    let event;
    try {
      event = new Resend('webhook-verification-only').webhooks.verify({ payload: Buffer.concat(parts).toString('utf8'), webhookSecret: secret,
        headers: { id: request.headers.get('svix-id') || '', timestamp: request.headers.get('svix-timestamp') || '', signature: request.headers.get('svix-signature') || '' } });
    } catch { throw new HttpError(400, 'Invalid webhook signature.'); }
    if (event.type.startsWith('email.') && 'email_id' in event.data) await recordDelivery(event as Parameters<typeof recordDelivery>[0], request.headers.get('svix-id')!);
    return NextResponse.json({ received: true }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof HttpError) return failure(error);
    logDatabaseFailure('enquiry_delivery_event', error);
    return failure(new HttpError(503, 'Webhook processing is temporarily unavailable.'));
  }
}
