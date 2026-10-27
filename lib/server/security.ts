import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { HttpError } from './http';
export { HttpError, mutation, jsonInput, failure, privateHeaders } from './http';
function secret() { const key = process.env.SESSION_SECRET; if (!key || key.length < 32) throw new HttpError(503, "Secure sessions are unavailable."); return key; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function equal(a: string, b: string) { const x = createHash("sha256").update(a).digest(), y = createHash("sha256").update(b).digest(); return timingSafeEqual(x, y); }
export async function session(role: "guest" | "admin" = "guest", create = false) {
  if (role === 'admin') {
    const account = await (await import('./customer-auth')).customerSession();
    return account?.user.role === 'admin' ? account.user.id : null;
  }
  const jar = await cookies(); const key = `dcorhome_${role}`;
  const raw = jar.get(key)?.value;
  if (raw) {
    const [id, expires, signature] = raw.split(".");
    if (/^[a-f0-9-]{36}$/.test(id) && Number(expires) > Date.now() && signature && equal(signature, sign(`${id}.${expires}.${role}`))) return id;
  }
  if (!create) return null;
  const id = randomUUID(), expires = Date.now() + (30 * 86400000);
  jar.set(key, `${id}.${expires}.${sign(`${id}.${expires}.${role}`)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_HTTP !== "true", path: "/", maxAge: 2592000 });
  return id;
}
export async function requireAdmin() {
  const account = await (await import('./customer-auth')).customerSession();
  if (!account) throw new HttpError(401, 'Administrator sign-in required.');
  if (account.user.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
}
// Legacy callers share the public, nonpersistent limiter; member login has its own MongoDB limiter.
export async function throttle(request: NextRequest, kind: string, limit: number, ms = 3600000) {
 return (await import('./public-rate-limit')).throttlePublic(request,kind,limit,ms);
}
