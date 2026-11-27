import 'server-only';
import { mongoConfigured } from './mongodb';

export function authConfiguration() {
  const issues: string[] = [];
  const setting = process.env.BETTER_AUTH_URL === undefined ? 'SITE_URL' : 'BETTER_AUTH_URL';
  let origin: string | null = null;
  try {
    const url = new URL(process.env[setting] || '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const localHttp = url.protocol === 'http:' && local &&
      (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_HTTP === 'true');
    if (!url.username && !url.password && url.pathname === '/' && !url.search && !url.hash &&
      (url.protocol === 'https:' || localHttp)) origin = url.origin;
  } catch { /* Report the invalid setting by name below. */ }
  if (!origin) issues.push(setting);
  if (!mongoConfigured()) issues.push('MONGODB_URI/MONGODB_DB');
  if ((process.env.BETTER_AUTH_SECRET?.trim().length || 0) < 32) issues.push('BETTER_AUTH_SECRET');
  return { origin, issues };
}

// Emit setting names only, never secret values.
export function authConfigurationIssues() {
  return authConfiguration().issues;
}
