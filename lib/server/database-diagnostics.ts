import 'server-only';
export type DatabaseFailure = 'missing_configuration' | 'invalid_configuration' | 'authentication' | 'permission' | 'network_timeout' | 'query';
export class DatabaseConfigurationError extends Error {
  constructor(readonly category: DatabaseFailure) { super('Database configuration is unavailable.'); }
}
export function databaseFailure(error: unknown): DatabaseFailure {
  const e = error as { category?: DatabaseFailure; code?: number; name?: string; cause?: unknown } | undefined;
  if (e?.category) return e.category;
  if (e?.name === 'MongoParseError' || e?.name === 'MongoInvalidArgumentError') return 'invalid_configuration';
  if (e?.code === 18) return 'authentication';
  if (e?.code === 13) return 'permission';
  if (e?.name && /Network|ServerSelection|Timeout/.test(e.name)) return 'network_timeout';
  if (e?.cause) return databaseFailure(e.cause);
  return 'query';
}
export function logDatabaseFailure(operation: string, error: unknown) {
  // Deliberately omit driver messages, stacks, URIs, database names and query values.
  console.error(JSON.stringify({ event: 'database_failure', operation, category: databaseFailure(error), detail: databaseFailureDetail(error), codes: databaseFailureCodes(error), node: process.version, openssl: process.versions.openssl }));
}

// Fixed allowlist only: arbitrary driver codes/messages can contain application data.
const diagnosticCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ENODATA', 'ESERVFAIL', 'ETIMEOUT', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH', 'EPIPE', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR', 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE', 'ERR_SSL_WRONG_VERSION_NUMBER', 'ERR_SSL_UNSUPPORTED_PROTOCOL']);
export function databaseFailureCodes(error: unknown): string[] {
  const seen = new Set<unknown>(), codes = new Set<string>();
  function inspect(value: unknown, depth = 0) {
    if (!value || typeof value !== 'object' || seen.has(value) || depth > 12 || seen.size >= 64) return;
    seen.add(value);
    const e = value as { code?: unknown; cause?: unknown; errors?: unknown[]; reason?: { error?: unknown; servers?: Map<unknown, { error?: unknown }> } };
    if (typeof e.code === 'string' && diagnosticCodes.has(e.code)) codes.add(e.code);
    inspect(e.cause, depth + 1); inspect(e.reason?.error, depth + 1);
    if (e.reason?.servers instanceof Map) for (const server of e.reason.servers.values()) inspect(server.error, depth + 1);
    if (Array.isArray(e.errors)) for (const nested of e.errors) inspect(nested, depth + 1);
  }
  inspect(error); return [...codes].sort();
}

export function databaseFailureDetail(error: unknown): 'dns' | 'tls' | 'connection_refused' | 'timeout' | undefined {
  // Inspect nested topology errors, but emit only fixed labels (never hostnames/messages).
  const seen = new Set<unknown>();
  function inspect(value: unknown): ReturnType<typeof databaseFailureDetail> {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    const e = value as { code?: unknown; cause?: unknown; reason?: { servers?: Map<unknown, { error?: unknown }> }; message?: unknown };
    const code = String(e.code || '');
    if (/ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL/.test(code) || /querySrv|queryTxt/.test(String(e.message || ''))) return 'dns';
    if (/TLS|SSL|CERT/.test(code) || /TLS|SSL|certificate/i.test(String(e.message || ''))) return 'tls';
    if (code === 'ECONNREFUSED') return 'connection_refused';
    const cause = inspect(e.cause); if (cause) return cause;
    for (const server of e.reason?.servers?.values() || []) { const result = inspect(server.error); if (result) return result; }
    if (code === 'ETIMEDOUT' || /timed out|timeout/i.test(String(e.message || ''))) return 'timeout';
  }
  return inspect(error);
}

export class DatabaseUnavailable extends Error {
 readonly cause:unknown;
 constructor(cause?:unknown){super('Application record storage is retired. Authentication uses its dedicated MongoDB repository.');this.cause=cause;}
}
