// Synthetic errors only; no configuration files or database connections.
require('./auth-loader.cjs');
const assert = require('node:assert/strict');
const { databaseFailureDetail, databaseFailureCodes, logDatabaseFailure } = require('../lib/server/database-diagnostics.ts');
const tcp = { code: 'ECONNRESET', message: 'Client network socket disconnected before secure TLS connection was established' };
const topology = { name: 'MongoServerSelectionError', reason: { servers: new Map([['PRIVATE_HOST', { error: { cause: tcp } }]]) } };
assert.equal(databaseFailureDetail(topology), 'tls'); // Keyword label is not a certificate diagnosis.
assert.deepEqual(databaseFailureCodes(topology), ['ECONNRESET']);
assert.deepEqual(databaseFailureCodes({ cause: { code: 'ERR_TLS_CERT_ALTNAME_INVALID' } }), ['ERR_TLS_CERT_ALTNAME_INVALID']);
assert.deepEqual(databaseFailureCodes({ errors: [{ code: 'ENOTFOUND' }, { code: 'ETIMEDOUT' }] }), ['ENOTFOUND', 'ETIMEDOUT']);
assert.deepEqual(databaseFailureCodes({ code: 'PRIVATE_SENTINEL' }), []);
const cyclic = { code: 'ECONNREFUSED' }; cyclic.cause = cyclic;
assert.deepEqual(databaseFailureCodes(cyclic), ['ECONNREFUSED']);
const original = console.error, logs = [];
console.error = value => logs.push(value);
try { logDatabaseFailure('connect', { ...topology, message: 'PRIVATE_SENTINEL', stack: 'PRIVATE_SENTINEL' }); }
finally { console.error = original; }
assert.ok(!logs.join('').includes('PRIVATE_'));
assert.deepEqual(JSON.parse(logs[0]).codes, ['ECONNRESET']);
console.log('PASS: TLS keyword ambiguity, nested network/certificate/DNS codes, cyclic causes and redacted runtime diagnostics.');
