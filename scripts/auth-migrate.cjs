require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
(async () => {
  const { customerAuth } = require('../lib/server/customer-auth.ts');
  const { getMigrations } = await import('better-auth/db/migration');
  const migration = await getMigrations(customerAuth().options);
  await migration.runMigrations();
  console.log('Customer authentication schema migrated. Existing guest records are unchanged.');
  process.exit(0);
})().catch(() => { console.error('Auth migration failed. Check SITE_URL, BETTER_AUTH_SECRET and database configuration.'); process.exit(1); });
