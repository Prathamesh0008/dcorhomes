// Read-only CLI. Uses the exact application client/options; never creates indexes or records.
if (!process.argv.includes('--env-only')) require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
require('./auth-loader.cjs');
const { mongoClient, mongoDatabase } = require('../lib/server/mongodb.ts');
const { databaseFailure, databaseFailureDetail } = require('../lib/server/database-diagnostics.ts');
// Driver server-selection timeouts do not bound every operating-system DNS lookup.
const deadline = setTimeout(() => {
  console.error(JSON.stringify({ event: 'database_ping', status: 'failed', category: 'network_timeout', detail: 'diagnostic_deadline' }));
  process.exit(1);
}, 25000);
(async () => {
  let client;
  try {
    client = await mongoClient();
    await (await mongoDatabase()).command({ ping: 1 }, { maxTimeMS: 5000 });
    console.log(JSON.stringify({ event: 'database_ping', status: 'ok', environment: process.env.VERCEL ? 'vercel' : 'local' }));
  } catch (error) {
    console.error(JSON.stringify({ event: 'database_ping', status: 'failed', category: databaseFailure(error), detail: databaseFailureDetail(error) }));
    process.exitCode = 1;
  } finally { if (client) await client.close(); clearTimeout(deadline); }
})();
