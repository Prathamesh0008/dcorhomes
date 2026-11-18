import 'server-only';
import { mongoConfigured } from './mongodb';

// Emit setting names only, never secret values.
export function authConfigurationIssues() {
  const issues: string[] = [];
  try {
    const origin = new URL(process.env.SITE_URL || '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
      (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && local && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_HTTP === 'true')))) issues.push('SITE_URL');
  } catch { issues.push('SITE_URL'); }
  if (!mongoConfigured()) issues.push('MONGODB_URI/MONGODB_DB');
  if ((process.env.BETTER_AUTH_SECRET?.trim().length || 0) < 32) issues.push('BETTER_AUTH_SECRET');
  return issues;
}
