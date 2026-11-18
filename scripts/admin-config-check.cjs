// Prints setting names only. Never loads or changes account records.
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
require('./auth-loader.cjs');
const issues = require('../lib/server/auth-configuration.ts').authConfigurationIssues();
console.log(JSON.stringify({ event: 'admin_auth_configuration', ready: !issues.length, invalidSettings: issues }));
if (issues.length) process.exitCode = 1;
