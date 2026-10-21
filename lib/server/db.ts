import { DatabaseSync } from "node:sqlite";
import { mkdirSync, realpathSync } from "node:fs";
import path from "node:path";

let connection: DatabaseSync | undefined;
export function databaseReady() { return Boolean(process.env.DCORHOME_DATA_DIR && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32); }
export function dataDirectory() {
  if (!databaseReady()) throw new Error("Private storage is not configured.");
  const directory = path.resolve(process.env.DCORHOME_DATA_DIR!);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const normalize = (value:string) => process.platform === "win32" ? value.toLowerCase() : value;
  const actualDirectory = normalize(realpathSync(directory));
  const publicDirectory = normalize(realpathSync(path.resolve(process.cwd(), "public")));
  if (actualDirectory === publicDirectory || actualDirectory.startsWith(publicDirectory + path.sep)) throw new Error("Private storage must be outside public.");
  return directory;
}
export function db() {
  if (!connection) {
    connection = new DatabaseSync(path.join(dataDirectory(), "dcorhome.sqlite"));
    connection.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(kind,id));
      CREATE INDEX IF NOT EXISTS records_owner ON records(kind,owner);
      CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    `);
  }
  return connection;
}
export type RecordRow = { kind: string; id: string; owner: string; data: string; created: number };
export function rows(kind: string, owner?: string): RecordRow[] {
  return (owner ? db().prepare("SELECT * FROM records WHERE kind=? AND owner=? ORDER BY created DESC LIMIT 100").all(kind, owner) : db().prepare("SELECT * FROM records WHERE kind=? ORDER BY created DESC LIMIT 200").all(kind)) as RecordRow[];
}
export function row(kind: string, id: string) { return db().prepare("SELECT * FROM records WHERE kind=? AND id=?").get(kind, id) as RecordRow | undefined; }
export function expiredRows(kind:string,before:number) { return db().prepare("SELECT * FROM records WHERE kind=? AND created<? ORDER BY created LIMIT 200").all(kind,before) as RecordRow[]; }
export function put(kind: string, id: string, owner: string, data: unknown) {
  db().prepare("INSERT INTO records VALUES (?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data").run(kind, id, owner, JSON.stringify(data), Date.now());
}
export function remove(kind: string, id: string) { db().prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, id); }
export function consume(key: string, limit: number, windowMs: number) {
  if (!Number.isFinite(limit) || limit < 1) throw new Error("Usage is unavailable.");
  const now = Date.now();
  db().prepare("DELETE FROM limits WHERE expires<?").run(now);
  const result = db().prepare("INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count").get(key, now + windowMs, limit);
  if (!result) throw new Error("Request limit reached. Please try again later.");
}
