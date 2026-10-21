import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { dataDirectory } from "./db";

const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const mac = (key: string | Buffer, value: string) => createHmac("sha256", key).update(value).digest();
export function assetStorageReady() { return process.env.ASSET_STORAGE === "local" || Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY); }
async function remote(method: string, key: string, body?: Buffer) {
  const endpoint = new URL(process.env.S3_ENDPOINT!);
  if (endpoint.protocol !== "https:" && process.env.ALLOW_LOCAL_HTTP !== "true") throw Error("HTTPS storage required");
  const region = process.env.S3_REGION || "us-east-1";
  const uri = `${endpoint.pathname.replace(/\/$/, "")}/${encodeURIComponent(process.env.S3_BUCKET!)}/${key}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""), day = date.slice(0, 8), digest = hash(body || "");
  const headers = `host:${endpoint.host}\nx-amz-content-sha256:${digest}\nx-amz-date:${date}\n`;
  const scope = `${day}/${region}/s3/aws4_request`, signed = "host;x-amz-content-sha256;x-amz-date";
  const canonical = [method, uri, "", headers, signed, digest].join("\n");
  const signingKey = mac(mac(mac(mac(`AWS4${process.env.S3_SECRET_ACCESS_KEY}`, day), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(`AWS4-HMAC-SHA256\n${date}\n${scope}\n${hash(canonical)}`).digest("hex");
  const response = await fetch(`${endpoint.origin}${uri}`, { method, headers: { "x-amz-date": date, "x-amz-content-sha256": digest, Authorization: `AWS4-HMAC-SHA256 Credential=${process.env.S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signed}, Signature=${signature}` }, body: body ? new Uint8Array(body) : undefined, signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!response.ok && !(method === "DELETE" && response.status === 404)) throw Error("Private storage request failed");
  return Buffer.from(await response.arrayBuffer());
}
function valid(key: string) { if (!/^[a-f0-9-]{36}\/(original|result)\.webp$/.test(key)) throw Error("Invalid private image key"); }
export async function putAsset(key: string, bytes: Buffer) { valid(key); if (process.env.ASSET_STORAGE !== "local") { await remote("PUT", key, bytes); return; } const target = path.join(dataDirectory(), "assets", key); await mkdir(path.dirname(target), { recursive: true, mode: 0o700 }); await writeFile(target, bytes, { mode: 0o600 }); }
export async function getAsset(key: string) { valid(key); return process.env.ASSET_STORAGE === "local" ? readFile(path.join(dataDirectory(), "assets", key)) : remote("GET", key); }
export async function deleteAsset(key: string) { valid(key); if (process.env.ASSET_STORAGE !== "local") { await remote("DELETE", key); return; } await unlink(path.join(dataDirectory(), "assets", key)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; }); }
