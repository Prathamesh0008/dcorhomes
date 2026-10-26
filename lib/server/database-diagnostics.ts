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
  console.error(JSON.stringify({ event: 'database_failure', operation, category: databaseFailure(error) }));
}
