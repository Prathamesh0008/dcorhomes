// Read-only CLI. Uses the exact application client/options; never creates indexes or records.
if (!process.argv.includes('--env-only')) require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
require('./auth-loader.cjs');
const { mongoClient, mongoDatabase } = require('../lib/server/mongodb.ts');
const { databaseFailure, databaseFailureDetail, databaseFailureCodes } = require('../lib/server/database-diagnostics.ts');
const runtime = { node: process.version, openssl: process.versions.openssl, driver: require('mongodb/package.json').version, execution: process.env.VERCEL ? 'vercel-marked-process' : 'workstation', configuration: process.argv.includes('--env-only') ? 'injected-only' : 'next-production-env-files' };
// Driver server-selection timeouts do not bound every operating-system DNS lookup.
const deadline = setTimeout(() => {
  console.error(JSON.stringify({ event: 'database_ping', status: 'failed', category: 'network_timeout', detail: 'diagnostic_deadline', ...runtime }));
  process.exit(1);
}, 25000);
(async () => {
  let client;
  try {
    client = await mongoClient();
    await (await mongoDatabase()).command({ ping: 1 }, { maxTimeMS: 5000 });
    console.log(JSON.stringify({ event: 'database_ping', status: 'ok', ...runtime }));
  } catch (error) {
    console.error(JSON.stringify({ event: 'database_ping', status: 'failed', category: databaseFailure(error), detail: databaseFailureDetail(error), codes: databaseFailureCodes(error), ...runtime }));
    process.exitCode = 1;
  } finally { if (client) await client.close(); clearTimeout(deadline); }
})();
