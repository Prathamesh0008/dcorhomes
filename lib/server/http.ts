import { NextRequest, NextResponse } from 'next/server';
import { DatabaseUnavailable } from './database-diagnostics';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function mutation(request: NextRequest, maxBytes = 65536) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin && origin !== process.env.SITE_URL) || request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "Cross-site request rejected.");
  if (Number(request.headers.get("content-length") || 0) > maxBytes) throw new HttpError(413, "Request is too large.");
}
export async function jsonInput(request: NextRequest, maxBytes = 65536) {
  mutation(request, maxBytes);
  const reader = request.body?.getReader(); let size = 0; const parts: Uint8Array[] = [];
  if (!reader) throw new HttpError(400, "Missing request.");
  while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > maxBytes) { await reader.cancel(); throw new HttpError(413, "Request is too large."); } parts.push(item.value); }
  try { const value = JSON.parse(Buffer.concat(parts).toString()); if (!value || Array.isArray(value) || typeof value !== "object") throw Error(); return value as Record<string, unknown>; } catch { throw new HttpError(400, "Invalid JSON request."); }
}
export function failure(error: unknown) { const status = error instanceof HttpError ? error.status : error instanceof DatabaseUnavailable ? 503 : 500; return NextResponse.json({ error: error instanceof HttpError || error instanceof DatabaseUnavailable ? error.message : "Unable to complete this operation." }, { status, headers: { "Cache-Control": "no-store" } }); }
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
