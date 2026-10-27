import options from '@/data/site/design-options.json';
import type { designOptions } from '@/lib/design-options';
export async function availableOptions(){ return structuredClone(options) as typeof designOptions; }
