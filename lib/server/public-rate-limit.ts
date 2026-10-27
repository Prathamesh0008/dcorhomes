import 'server-only';
import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { HttpError } from './http';

const state = globalThis as typeof globalThis & { dcorPublicLimits?: Map<string, { count: number; expires: number }> };
// Bounded best-effort per-instance protection. Configure Vercel WAF for distributed enforcement.
export async function throttlePublic(request: NextRequest, kind: string, limit: number, ms = 3600000) {
 const entries = state.dcorPublicLimits ||= new Map();
 const now = Date.now();
 for (const [key, value] of entries) if (value.expires <= now) entries.delete(key);
 const identity = process.env.TRUST_PROXY === 'true' ? (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim() : 'shared';
 const key = kind + ':' + createHash('sha256').update(identity).digest('hex');
 const current = entries.get(key);
 if (current && current.count >= limit) throw new HttpError(429, 'Too many requests. Please email sales@dcorhome.com or try again later.');
 if (!current && entries.size >= 2048) throw new HttpError(429, 'Please email sales@dcorhome.com or try again later.');
 entries.set(key, { count: (current?.count || 0) + 1, expires: current?.expires || now + ms });
}
