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
  console.error(JSON.stringify({ event: 'database_failure', operation, category: databaseFailure(error), detail: databaseFailureDetail(error) }));
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
