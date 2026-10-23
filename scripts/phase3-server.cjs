// Dedicated local verification server; never reads or writes live account data.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { spawn } = require('node:child_process');
process.env.DCORHOME_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dcorhome-phase3-'));
process.env.DCORHOME_DATABASE_URL = '';
process.env.SITE_URL = 'http://localhost:3199';
process.env.BETTER_AUTH_SECRET = require('node:crypto').randomBytes(32).toString('hex');
process.env.SESSION_SECRET = require('node:crypto').randomBytes(32).toString('hex');
process.env.RESEND_API_KEY = '';
process.env.ENQUIRY_FROM_EMAIL = '';
process.env.ALLOW_LOCAL_HTTP = 'true';
process.env.TRUST_PROXY = 'false';
require('./auth-loader.cjs');
(async () => {
  const { customerAuth } = require('../lib/server/customer-auth.ts');
  const { getMigrations } = await import('better-auth/db/migration');
  await (await getMigrations(customerAuth().options)).runMigrations();
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3199'], { env: process.env, stdio: 'inherit', windowsHide: true });
  process.on('SIGINT', () => { child.kill(); process.exit(0); });
})().catch(error => { console.error(error); process.exit(1); });
