import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { consume, databaseReady, row, put } from "./db";

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
function secret() { const key = process.env.SESSION_SECRET; if (!key || key.length < 32) throw new HttpError(503, "Secure sessions are unavailable."); return key; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function equal(a: string, b: string) { const x = createHash("sha256").update(a).digest(), y = createHash("sha256").update(b).digest(); return timingSafeEqual(x, y); }
export async function session(role: "guest" | "admin" = "guest", create = false) {
  const jar = await cookies(); const key = `dcorhome_${role}`;
  const raw = jar.get(key)?.value;
  if (raw) {
    const [id, expires, signature] = raw.split(".");
    if (/^[a-f0-9-]{36}$/.test(id) && Number(expires) > Date.now() && signature && equal(signature, sign(`${id}.${expires}.${role}`)) && (role !== "admin" || row("admin-session",id))) return id;
  }
  if (!create) return null;
  const id = randomUUID(), expires = Date.now() + (role === "admin" ? 8 * 3600000 : 30 * 86400000);
  if(role === "admin") put("admin-session",id,"admin",{expires});
  jar.set(key, `${id}.${expires}.${sign(`${id}.${expires}.${role}`)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_HTTP !== "true", path: "/", maxAge: role === "admin" ? 28800 : 2592000 });
  return id;
}
export async function requireAdmin() { if (!await session("admin")) throw new HttpError(401, "Administrator sign-in required."); }
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
export function throttle(request: NextRequest, kind: string, limit: number, ms = 3600000) {
  if (!databaseReady()) throw new HttpError(503, "This service is temporarily unavailable.");
  const identity = process.env.TRUST_PROXY === "true" ? (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim() : "shared";
  try { consume(`${kind}:${createHash("sha256").update(identity).digest("hex")}`, limit, ms); } catch { throw new HttpError(429, "Too many requests. Please try again later."); }
}
export function failure(error: unknown) { const status = error instanceof HttpError ? error.status : 500; return NextResponse.json({ error: error instanceof HttpError ? error.message : "Unable to complete this operation." }, { status, headers: { "Cache-Control": "no-store" } }); }
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
