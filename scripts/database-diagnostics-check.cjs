// Synthetic errors only; no configuration files or database connections.
require('./auth-loader.cjs');
const assert = require('node:assert/strict');
const { databaseFailure, databaseFailureDetail, databaseFailureCodes, logDatabaseFailure } = require('../lib/server/database-diagnostics.ts');
const tcp = { code: 'ECONNRESET', message: 'Client network socket disconnected before secure TLS connection was established' };
const topology = { name: 'MongoServerSelectionError', reason: { servers: new Map([['PRIVATE_HOST', { error: { cause: tcp } }]]) } };
assert.equal(databaseFailureDetail(topology), 'tls'); // Keyword label is not a certificate diagnosis.
assert.deepEqual(databaseFailureCodes(topology), ['ECONNRESET']);
assert.equal(databaseFailure(topology), 'network_timeout');
const alert = { name: 'MongoServerSelectionError', reason: { servers: new Map([['PRIVATE_HOST', { error: { cause: { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' } } }]]) } };
assert.equal(databaseFailure(alert), 'tls');
assert.equal(databaseFailureDetail(alert), 'tls');
assert.equal(databaseFailure({ name: 'MongoNetworkError', cause: { code: 'CERT_HAS_EXPIRED' } }), 'tls');
assert.equal(databaseFailure({ name: 'MongoServerSelectionError' }), 'network_timeout');
const atlasError = { name: 'MongoServerError', code: 8000, codeName: 'AtlasError' };
const atlasAuth = { ...atlasError, message: 'bad auth : authentication failed PRIVATE_SENTINEL' };
assert.equal(databaseFailure(atlasAuth), 'authentication');
assert.equal(databaseFailure({ ...atlasError, message: 'another Atlas error' }), 'query');
assert.deepEqual(databaseFailureCodes({ cause: { code: 'ERR_TLS_CERT_ALTNAME_INVALID' } }), ['ERR_TLS_CERT_ALTNAME_INVALID']);
assert.deepEqual(databaseFailureCodes({ errors: [{ code: 'ENOTFOUND' }, { code: 'ETIMEDOUT' }] }), ['ENOTFOUND', 'ETIMEDOUT']);
assert.deepEqual(databaseFailureCodes({ code: 'PRIVATE_SENTINEL' }), []);
const cyclic = { code: 'ECONNREFUSED' }; cyclic.cause = cyclic;
assert.deepEqual(databaseFailureCodes(cyclic), ['ECONNREFUSED']);
const original = console.error, logs = [];
console.error = value => logs.push(value);
try {
  logDatabaseFailure('connect', { ...topology, message: 'PRIVATE_SENTINEL', stack: 'PRIVATE_SENTINEL' });
  logDatabaseFailure('connect', atlasAuth);
}
finally { console.error = original; }
assert.ok(!logs.join('').includes('PRIVATE_'));
assert.deepEqual(JSON.parse(logs[0]).codes, ['ECONNRESET']);
assert.equal(JSON.parse(logs[1]).category, 'authentication');
console.log('PASS: Atlas authentication classification, nested network/TLS/DNS errors and redacted runtime diagnostics.');
