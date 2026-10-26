import 'server-only';
import { comparisonPairs } from '@/lib/assets';
import { row } from './db';
import { logDatabaseFailure } from './database-diagnostics';
export async function homepagePair() {
  try {
    const saved = await row('settings', 'hero');
    if (saved) {
      const pair = JSON.parse(saved.data) as { before: string; after: string; provenance: string };
      if (typeof pair.before !== 'string' || typeof pair.after !== 'string') throw Error('Invalid hero override.');
      return pair;
    }
  } catch (error) { logDatabaseFailure('homepage_hero_fallback', error); }
  return comparisonPairs[0];
}
