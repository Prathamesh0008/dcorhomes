require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
(async () => {
  await require('../lib/server/members.ts').memberIndexes();
  console.log('MongoDB member indexes ready. No accounts were created or existing data removed.');
  await (await require('../lib/server/mongodb.ts').mongoClient()).close();
})().then(() => process.exit(0)).catch(() => { console.error('Index setup failed. Check MongoDB configuration, connectivity and permissions.'); process.exit(1); });
